/**
 * bemdecl-from-bemjson
 * ====================
 *
 * Формирует *bemdecl* на основе `?.bemjson.js`.
 *
 * **Опции**
 *
 * * *String* **source** — Исходный bemjson-таргет. По умолчанию — `?.bemjson.js`.
 * * *String* **target** — Результирующий bemdecl-таргет. По умолчанию — `?.bemdecl.js`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb-bem/techs/bemdecl-from-bemjson'));
 * ```
 *
 */
var inherit = require('inherit');
var vfs = require('enb/lib/fs/async-fs');
var requireOrEval = require('enb/lib/fs/require-or-eval');
var asyncRequire = require('enb/lib/fs/async-require');
var dropRequireCache = require('enb/lib/fs/drop-require-cache');
var deps = require('../lib/deps/deps');

module.exports = inherit(require('enb/lib/tech/base-tech'), {
    getName: function () {
        return 'bemdecl-from-bemjson';
    },

    configure: function () {
        this._sourceTarget = this.getOption('sourceTarget');
        if (!this._sourceTarget) {
            this._sourceTarget = this.getOption('source', '?.bemjson.js');
        }
        this._sourceTarget = this.node.unmaskTargetName(this._sourceTarget);

        this._target = this.getOption('destTarget');
        if (!this._target) {
            this._target = this.getOption('target', '?.bemdecl.js');
        }
        this._target = this.node.unmaskTargetName(this._target);
    },

    getTargets: function () {
        return [this._target];
    },

    build: function () {
        var node = this.node;
        var target = this._target;
        var cache = node.getNodeCache(target);
        var bemdeclFilename = node.resolvePath(target);
        var bemjsonFilename = node.resolvePath(this._sourceTarget);

        if (cache.needRebuildFile('bemdecl-file', bemdeclFilename) ||
            cache.needRebuildFile('bemjson-file', bemjsonFilename)
        ) {
            return requireOrEval(bemjsonFilename)
                .then(function (bemjson) {
                    var bemjsonDeps = getDepsFromBemjson(bemjson);
                    var bemdecl = deps.toBemdecl(bemjsonDeps);
                    var str = 'exports.blocks = ' + JSON.stringify(bemdecl, null, 4) + ';\n';

                    return vfs.write(bemdeclFilename, str, 'utf-8')
                        .then(function () {
                            cache.cacheFileInfo('bemdecl-file', bemdeclFilename);
                            cache.cacheFileInfo('bemjson-file', bemjsonFilename);
                            node.resolveTarget(target, bemdecl);
                        });
                });
        } else {
            node.isValidTarget(target);
            dropRequireCache(require, bemdeclFilename);

            return asyncRequire(bemdeclFilename)
                .then(function (result) {
                    node.resolveTarget(target, result.blocks);
                    return null;
                });
        }
    }
});

function getDepsFromBemjson(bemjson) {
    var deps = [];

    addDepsFromBemjson(bemjson, deps, {}, null);

    return deps;
}

function addDepsFromBemjson(bemjson, deps, depsIndex, parentBlockName) {
    if (!bemjson) { return; }
    if (Array.isArray(bemjson)) {
        bemjson.forEach(function (bemjsonItem) {
            addDepsFromBemjson(bemjsonItem, deps, depsIndex, parentBlockName);
        });
    } else {
        if (bemjson.block || bemjson.elem) {
            if (bemjson.elem && !bemjson.block) {
                bemjson.block = parentBlockName;
            }
            var dep = {block: bemjson.block};
            if (bemjson.elem) {
                dep.elem = bemjson.elem;
            }
            var itemKey = depKey(dep);
            if (!depsIndex[itemKey]) {
                deps.push(dep);
                depsIndex[itemKey] = true;
            }
            if (bemjson.elemMods) {
                bemjson.mods = bemjson.elemMods;
            }
            if (bemjson.mods) {
                for (var j in bemjson.mods) {
                    if (bemjson.mods.hasOwnProperty(j)) {
                        var subDep = {block: bemjson.block};
                        if (bemjson.elem) {
                            subDep.elem = bemjson.elem;
                        }
                        subDep.mod = j;
                        subDep.val = bemjson.mods[j];
                        var subItemKey = depKey(subDep);
                        if (!depsIndex[subItemKey]) {
                            deps.push(subDep);
                            depsIndex[subItemKey] = true;
                        }
                    }
                }
            }
        }
        for (var i in bemjson) {
            if (bemjson.hasOwnProperty(i)) {
                if (i !== 'mods' && i !== 'js' && i !== 'attrs') {
                    var value = bemjson[i];
                    if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
                        addDepsFromBemjson(bemjson[i], deps, depsIndex, bemjson.block || parentBlockName);
                    }
                }
            }
        }
    }
}

function depKey(dep) {
    return dep.block +
        (dep.elem ? '__' + dep.elem : '') +
        (dep.mod ? '_' + dep.mod + (dep.val ? '_' + dep.val : '') : '');
}
