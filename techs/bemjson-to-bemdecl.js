var inherit = require('inherit'),
    enb = require('enb'),
    vfs = enb.asyncFS || require('enb/lib/fs/async-fs'),
    BaseTech = enb.BaseTech || require('enb/lib/tech/base-tech'),
    requireOrEval = require('enb-require-or-eval'),
    asyncRequire = require('enb-async-require'),
    clearRequire = require('clear-require'),
    deps = require('../lib/deps/deps');

/**
 * @class BemjsonToBemdeclTech
 * @augments {BaseTech}
 * @classdesc
 *
 * Builds BEMDECL file from BEMJSON file.
 *
 * @param {Object}  [options]                          Options.
 * @param {String}  [options.target='?.bemdecl.js']    Path to a built BEMDECL file.
 * @param {String}  [options.source='?.bemjson.js']    Path to a BEMJSON file.
 * @param {String}  [options.bemdeclFormat='bemdecl']  Format of result declaration (bemdecl or deps).
 *
 * @example
 * var FileProvideTech = require('enb/techs/file-provider'),
 *     bemTechs = require('enb-bem-techs');
 *
 * module.exports = function(config) {
 *     config.node('bundle', function(node) {
 *         // get BEMJSON file
 *         node.addTech([FileProvideTech, { target: '?.bemjson.js' }]);
 *
 *         // build BEMDECL file
 *         node.addTech(bemTechs.bemjsonToBemdecl);
 *         node.addTarget('?.bemdecl.js');
 *     });
 * };
 */
module.exports = inherit(BaseTech, {
    getName: function () {
        return 'bemjson-to-bemdecl';
    },

    configure: function () {
        var logger = this.node.getLogger();

        this._target = this.getOption('destTarget');
        if (this._target) {
            logger.logOptionIsDeprecated(this.node.unmaskTargetName(this._target), 'enb-bem-techs', this.getName(),
                'destTarget', 'target', ' It will be removed in v3.0.0.');
        } else {
            this._target = this.getOption('target', '?.bemdecl.js');
        }
        this._target = this.node.unmaskTargetName(this._target);

        this._sourceTarget = this.getOption('sourceTarget');
        if (this._sourceTarget) {
            logger.logOptionIsDeprecated(this._target, 'enb-bem-techs', this.getName(),
                'sourceTarget', 'source', ' It will be removed in v3.0.0.');
        } else {
            this._sourceTarget = this.getOption('source', '?.bemjson.js');
        }
        this._sourceTarget = this.node.unmaskTargetName(this._sourceTarget);

        this._bemdeclFormat = this.getOption('bemdeclFormat', 'bemdecl');
    },

    getTargets: function () {
        return [this._target];
    },

    build: function () {
        var node = this.node,
            target = this._target,
            cache = node.getNodeCache(target),
            bemdeclFilename = node.resolvePath(target),
            bemjsonFilename = node.resolvePath(this._sourceTarget),
            bemdeclFormat = this._bemdeclFormat;

        return this.node.requireSources([this._sourceTarget])
            .then(function () {
                if (cache.needRebuildFile('bemdecl-file', bemdeclFilename) ||
                    cache.needRebuildFile('bemjson-file', bemjsonFilename)
                ) {
                    return requireOrEval(bemjsonFilename)
                        .then(function (bemjson) {
                            var bemjsonDeps = getDepsFromBemjson(bemjson),
                                decl,
                                data,
                                str;

                            if (bemdeclFormat === 'deps') {
                                decl = bemjsonDeps;
                                data = { deps: decl };
                                str = 'exports.deps = ' + JSON.stringify(decl, null, 4) + ';\n';
                            } else {
                                decl = deps.toBemdecl(bemjsonDeps),
                                data = { blocks: decl };
                                str = 'exports.blocks = ' + JSON.stringify(decl, null, 4) + ';\n';
                            }

                            return vfs.write(bemdeclFilename, str, 'utf-8')
                                .then(function () {
                                    cache.cacheFileInfo('bemdecl-file', bemdeclFilename);
                                    cache.cacheFileInfo('bemjson-file', bemjsonFilename);
                                    node.resolveTarget(target, data);
                                });
                        });
                } else {
                    node.isValidTarget(target);
                    clearRequire(bemdeclFilename);

                    return asyncRequire(bemdeclFilename)
                        .then(function (result) {
                            node.resolveTarget(target, result);
                            return null;
                        });
                }
            });
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
            var dep = { block: bemjson.block };
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
                        var subDep = { block: bemjson.block };
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
