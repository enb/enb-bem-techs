var inherit = require('inherit'),
    enb = require('enb'),
    vfs = enb.asyncFS || require('enb/lib/fs/async-fs'),
    BaseTech = enb.BaseTech || require('enb/lib/tech/base-tech'),
    deps = require('../lib/deps/deps');

/**
 * @class LevelsToBemdeclTech
 * @augments {BaseTech}
 * @see {@link Levels}
 * @classdesc
 *
 * Builds BEMDECL file with BEM entities from specified levels.
 *
 * @param {Object}  [options]                         Options.
 * @param {String}  [options.target='?.bemdecl.js']   Path to result BEMDECL file.
 * @param {String}  [options.source='?.levels']       Path to target with {@link Levels}.
 * @param {String}  [options.bemdeclFormat='bemdecl'] Format of result declaration (bemdecl or deps).
 *
 * @example
 * var bemTechs = require('enb-bem-techs');
 *
 * module.exports = function(config) {
 *     config.node('bundle', function(node) {
 *         // scan levels
 *         node.addTech([bemTechs.levels, { levels: ['blocks'] }]);
 *
 *         // build BEMDECL file
 *         node.addTech(bemTechs.levelsToBemdecl);
 *         node.addTarget('?.bemdecl.js');
 *     });
 * };
 */
module.exports = inherit(BaseTech, {
    getName: function () {
        return 'levels-to-bemdecl';
    },

    configure: function () {
        this._target = this.node.unmaskTargetName(
            this.getOption('target', this.node.getTargetName('bemdecl.js')));
        this._source = this.node.unmaskTargetName(
            this.getOption('source', this.node.getTargetName('levels')));
        this._bemdeclFormat = this.getOption('bemdeclFormat', 'bemdecl');
    },

    getTargets: function () {
        return [this.node.unmaskTargetName(this._target)];
    },

    build: function () {
        var node = this.node,
            target = this._target,
            bemdeclFilename = node.resolvePath(target),
            bemdeclFormat = this._bemdeclFormat,
            cache = node.getNodeCache(target);

        return node.requireSources([this._source]).spread(function (levels) {
            var resDeps = [],
                decl = [],
                data,
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

            if (bemdeclFormat === 'deps') {
                decl = resDeps;
                data = { deps: decl };
                str = 'exports.deps = ' + JSON.stringify(decl, null, 4) + ';\n';
            } else {
                decl = deps.toBemdecl(resDeps);
                data = { blocks: decl };
                str = 'exports.blocks = ' + JSON.stringify(decl, null, 4) + ';\n';
            }

            if (cache.get('bemdecl') !== str || cache.needRebuildFile('bemdecl-file', bemdeclFilename)) {
                return vfs.write(bemdeclFilename, str, 'utf8')
                    .then(function () {
                        cache.cacheFileInfo('bemdecl-file', bemdeclFilename);
                        cache.set('bemdecl', str);
                        node.resolveTarget(target, data);
                    });
            }

            node.isValidTarget(target);
            node.resolveTarget(target, data);
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
            var vals = Object.keys(mods[modName]);

            vals.forEach(function (val) {
                var dep = {
                    block: block,
                    mod: modName,
                    val: val === '*' ? true : val
                };

                elem && (dep.elem = elem);

                deps.push(dep);
            });
        });
    }
}
