var inherit = require('inherit'),
    enb = require('enb'),
    fileEval = require('file-eval'),

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
        var node = this.node;

        this._target = node.unmaskTargetName(this.getOption('target', node.getTargetName('bemdecl.js')));
        this._source = node.unmaskTargetName(this.getOption('source', node.getTargetName('levels')));
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

        return node.requireSources([this._source]).spread(function (introspection) {
            if (cache.needRebuildFile('bemdecl-file', bemdeclFilename)) {
                var resDeps = introspection.getEntities().map(function (entity) {
                        var dep = {
                            block: entity.block
                        };

                        entity.elem && (dep.elem = entity.elem);
                        entity.modName && (dep.mod = entity.modName);
                        entity.modVal && (dep.val = entity.modVal);

                        return dep;
                    }),
                    data,
                    str;

                if (bemdeclFormat === 'deps') {
                    data = { deps: resDeps };
                    str = 'exports.deps = ' + JSON.stringify(resDeps, null, 4) + ';\n';
                } else {
                    var decl = deps.toBemdecl(resDeps);

                    data = { blocks: decl };
                    str = 'exports.blocks = ' + JSON.stringify(decl, null, 4) + ';\n';
                }

                return vfs.write(bemdeclFilename, str, 'utf8')
                    .then(function () {
                        cache.cacheFileInfo('bemdecl-file', bemdeclFilename);
                        node.resolveTarget(target, data);
                    });
            } else {
                node.isValidTarget(target);

                return fileEval(bemdeclFilename)
                    .then(function (result) {
                        node.resolveTarget(target, result);
                        return null;
                    });
            }
        });
    }
});
