var inherit = require('inherit'),
    vm = require('vm'),
    naming = require('bem-naming'),
    vow = require('vow'),
    enb = require('enb'),
    vfs = enb.asyncFS || require('enb/lib/fs/async-fs'),
    BaseTech = enb.BaseTech || require('enb/lib/tech/base-tech'),
    asyncRequire = require('enb-async-require'),
    clearRequire = require('clear-require'),
    deps = require('../lib/deps/deps');

/**
 * @class DepsByTechToBemdeclTech
 * @augments {BaseTech}
 * @classdesc
 *
 * Builds BEMDECL file using tech dependencies (depsByTech). Such dependencies are described in `deps.js` files.
 *
 * @param {Object}      options                              Options.
 * @param {String}      options.sourceTech                   Tech name to build declaration for.
 *                                                           It depends on `destTech`.
 * @param {String}      options.destTech                     Tech name `sourceTech` depends from.
 * @param {String}      [options.target=?.bemdecl.js]        Path to BEMDECL file to build.
 * @param {String}      [options.filesTarget='?.files']      Path to target with {@link FileList}.
 * @param {String[]}    [options.sourceSuffixes=['deps.js']] Files with specified suffixes involved in the assembly.
 * @param {String}  [options.bemdeclFormat='bemdecl'] Format of result declaration (bemdecl or deps).
 *
 * @example
 * var FileProvideTech = require('enb/techs/file-provider'),
 *     bemTechs = require('enb-bem-techs');
 *
 * module.exports = function(config) {
 *     config.node('bundle', function(node) {
 *         // get FileList
 *         node.addTechs([
 *             [bemTechs.levels, { levels: ['blocks'] }],
 *             [FileProvideTech, { target: '?.bemdecl.js' }],
 *             bemTechs.deps,
 *             bemTechs.files
 *         ]);
 *
 *         // build BEMDECL file with BEMHTML entities for JavaScript
 *         node.addTech([bemTechs.depsByTechToBemdecl, {
 *             target: '?.bemhtml.bemdecl.js',
 *             sourceTech: 'js',
 *             destTech: 'bemhtml'
 *         }]);
 *         node.addTarget('?.bemhtml.bemdecl.js');
 *     });
 * };
 */
module.exports = inherit(BaseTech, {
    getName: function () {
        return 'deps-by-tech-to-bemdecl';
    },

    configure: function () {
        this._target = this.node.unmaskTargetName(this.getOption('target', '?.bemdecl.js'));
        this._filesTarget = this.node.unmaskTargetName(this.getOption('filesTarget', '?.files'));
        this._sourceTech = this.getRequiredOption('sourceTech');
        this._destTech = this.getOption('destTech');
        this._sourceSuffixes = this.getOption('sourceSuffixes', ['deps.js']);
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
            sourceTech = this._sourceTech,
            destTech = this._destTech,
            sourceSuffixes = Array.isArray(this._sourceSuffixes) ? this._sourceSuffixes : [this._sourceSuffixes],
            bemdeclFormat = this._bemdeclFormat;

        return this.node.requireSources([this._filesTarget])
            .spread(function (files) {
                var depsFiles = files.getBySuffix(sourceSuffixes);

                if (cache.needRebuildFile('bemdecl-file', bemdeclFilename) ||
                    cache.needRebuildFileList('deps-files', depsFiles)
                ) {
                    return vow.all(depsFiles.map(function (file) {
                        return vfs.read(file.fullname, 'utf8').then(function (text) {
                            return { file: file, text: text };
                        });
                    })).then(function (depResults) {
                        var result = [],
                            depIndex = {};

                        depResults.forEach(function (depResult) {
                            var fileDeps = vm.runInThisContext(depResult.text),
                                bemname = depResult.file.name.split('.')[0],
                                notation = naming.parse(bemname);

                            if (!fileDeps) {
                                return;
                            }
                            fileDeps = Array.isArray(fileDeps) ? fileDeps : [fileDeps];
                            fileDeps.forEach(function (dep) {
                                if (dep.tech === sourceTech) {
                                    ['mustDeps', 'shouldDeps'].forEach(function (depType) {
                                        if (dep[depType]) {
                                            deps.flattenDeps(dep[depType]).forEach(function (singleDep) {
                                                if (!singleDep.block) {
                                                    singleDep.block = notation.block;

                                                    if (!singleDep.elem) {
                                                        notation.elem && (singleDep.elem = notation.elem);

                                                        if (!singleDep.mod) {
                                                             notation.modName && (singleDep.mod = notation.modName);

                                                             if (!singleDep.val) {
                                                                 notation.modVal && (singleDep.val = notation.modVal);
                                                             }
                                                        }
                                                    }
                                                }

                                                singleDep.val || singleDep.mod && (singleDep.val = true);

                                                if (!destTech || singleDep.tech === destTech) {
                                                    var key = depKey(singleDep);
                                                    if (!depIndex[key]) {
                                                        depIndex[key] = true;
                                                        result.push(singleDep);
                                                    }
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        });

                        var decl,
                            data,
                            str;

                        if (bemdeclFormat === 'deps') {
                            decl = result;
                            data = { deps: decl };
                            str = 'exports.deps = ' + JSON.stringify(decl, null, 4) + ';\n';
                        } else {
                            decl = deps.toBemdecl(result),
                            data = { blocks: decl };
                            str = 'exports.blocks = ' + JSON.stringify(decl, null, 4) + ';\n';
                        }

                        return vfs.write(bemdeclFilename, str, 'utf-8')
                            .then(function () {
                                cache.cacheFileInfo('bemdecl-file', bemdeclFilename);
                                cache.cacheFileList('deps-files', depsFiles);
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

function depKey(dep) {
    return dep.block +
        (dep.elem ? '__' + dep.elem : '') +
        (dep.mod ? '_' + dep.mod + (dep.val ? '_' + dep.val : '') : '');
}
