/**
 * levels-to-bemdecl
 * =================
 *
 * Формирует *bemdecl*, состоящий из всех сущностей, найденных на уровнях.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий bemdecl-таргет. По умолчанию — `?.bemdecl.js`.
 * * *String* **levelsTarget** — Исходный levels. По умолчанию — `?.levels`.
 *
 * * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb-bem-techs/techs/levels-to-bemdecl'));
 * ```
 */
var inherit = require('inherit'),
    vfs = require('enb/lib/fs/async-fs'),
    deps = require('../lib/deps/deps'),
    asyncRequire = require('enb/lib/fs/async-require'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache');

module.exports = inherit(require('enb/lib/tech/base-tech'), {
    getName: function () {
        return 'levels-to-bemdecl';
    },

    configure: function () {
        this._target = this.node.unmaskTargetName(
            this.getOption('target', this.node.getTargetName('bemdecl.js')));
        this._levelsTarget = this.node.unmaskTargetName(
            this.getOption('levelsTarget', this.node.getTargetName('levels')));
    },

    getTargets: function () {
        return [this.node.unmaskTargetName(this._target)];
    },

    build: function () {
        var node = this.node,
            target = this._target,
            bemdeclFilename = node.resolvePath(target),
            cache = node.getNodeCache(target);

        return node.requireSources([this._levelsTarget]).spread(function (levels) {
            if (cache.needRebuildFile('bemdecl-file', bemdeclFilename)) {
                var resDeps = [],
                    blocks = [],
                    str;

                levels.items.forEach(function (level) {
                    Object.keys(level.blocks).forEach(function (name) {
                        var block = level.blocks[name];

                        resDeps.push({
                            block: name
                        });

                        processMods(resDeps, name, block.mods);
                        processElems(resDeps, name, block.elements);
                    });
                });

                blocks = deps.toBemdecl(resDeps);
                str = 'exports.blocks = ' + JSON.stringify(blocks, null, 4) + ';\n';

                return vfs.write(bemdeclFilename, str, 'utf8')
                    .then(function () {
                        cache.cacheFileInfo('bemdecl-file', bemdeclFilename);
                        node.resolveTarget(target, { blocks: blocks });
                    });
            } else {
                node.isValidTarget(target);
                dropRequireCache(require, bemdeclFilename);

                return asyncRequire(bemdeclFilename)
                    .then(function (result) {
                        node.resolveTarget(target, result);
                        return null;
                    });
            }
        });
    }
});

function processElems(deps, block, elems) {
    if (elems) {
        Object.keys(elems).forEach(function (elemName) {
            deps.push({
                block: block,
                elem: elemName
            });

            processMods(deps, block, elems[elemName].mods, elemName);
        });
    }
}

function processMods(deps, block, mods, elem) {
    if (mods) {
        Object.keys(mods).forEach(function (modName) {
            var dep = {
                block: block,
                mod: modName,
                val: Object.keys(mods[modName])[0]
            };

            elem && (dep.elem = elem);

            deps.push(dep);
        });
    }
}
