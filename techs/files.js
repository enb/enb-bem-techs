var fs = require('fs'),
    path = require('path'),

    inherit = require('inherit'),
    vow = require('vow'),
    enb = require('enb'),
    fileEval = require('file-eval'),
    bemDecl = require('@bem/sdk.decl'),
    originNamingPreset = require('@bem/sdk.naming.presets').origin,
    stringifyEntity = require('@bem/sdk.naming.entity.stringify')(originNamingPreset),
    BaseTech = enb.BaseTech || require('enb/lib/tech/base-tech'),
    FileList = enb.FileList || require('enb/lib/file-list');

/**
 * @class FilesTech
 * @augments {BaseTech}
 * @see {@link FileList}
 * @classdesc
 *
 * Builds list of files and list of directories. Uses declaration of BEM entities and {@link Levels}.
 *
 * Used by the most of other technologies except for base technologies.
 *
 * Important: provides result in two targets: `?.files` and `?.dirs`.
 *
 * @param {Object}  [options]                         Options.
 * @param {String}  [options.filesTarget='?.files']   Path to built target with files list ({@link FileList}).
 * @param {String}  [options.dirsTarget='?.dirs']     Path to built target with dirs list ({@link FileList}).
 * @param {String}  [options.levelsTarget=?.levels]   Path to target with {@link Levels}.
 * @param {String}  [options.depsFile=?.deps.js]      Path to file with declaration of BEM entities.
 *
 * @example
 * var FileProvideTech = require('enb/techs/file-provider'),
 *     bemTechs = require('enb-bem-techs');
 *
 * module.exports = function(config) {
 *     config.node('bundle', function(node) {
 *         // scan levels
 *         node.addTech([bemTechs.levels, { levels: ['blocks'] }]);
 *
 *         // build DEPS file
 *         node.addTechs([
 *              [FileProvideTech, { target: '?.bemdecl.js' }],
 *              bemTechs.deps
 *         ]);
 *
 *         // build lists of files and dirs
 *         node.addTech([techs.files, {
 *             filesTarget: '?.files',
 *             dirsTarget: '?.dirs'
 *         }]);
 *         node.addTargets(['?.files', '?.dirs']);
 *     });
 * };
 */
module.exports = inherit(BaseTech, {
    getName: function () {
        return 'files';
    },

    configure: function () {
        var node = this.node;

        this._filesTarget = node.unmaskTargetName(this.getOption('filesTarget', '?.files'));
        this._dirsTarget = node.unmaskTargetName(this.getOption('dirsTarget', '?.dirs'));
        this._levelsTarget = node.unmaskTargetName(this.getOption('levelsTarget', '?.levels'));
        this._depsFile = node.unmaskTargetName(this.getOption('depsFile', '?.deps.js'));
    },

    getTargets: function () {
        return [
            this._filesTarget,
            this._dirsTarget
        ];
    },

    build: function () {
        var _this = this,
            depsFilename = this.node.resolvePath(this._depsFile),
            filesTarget = this._filesTarget,
            dirsTarget = this._dirsTarget;

        return this.node.requireSources([this._depsFile, this._levelsTarget])
            .spread(function (data, introspection) {
                return requireSourceDeps(data, depsFilename)
                    .then(function (sourceDeps) {
                        var fileList = new FileList(),
                            dirList = new FileList(),
                            uniqs = {};

                        var data = sourceDeps.map(function (entity) {
                            var id = stringifyEntity(entity);

                            if (uniqs[id]) { return []; }
                            uniqs[id] = true;

                            var commonModId;

                            if (entity.mod && entity.mod.val) {
                                var commonMod = {
                                    block: entity.block,
                                    mod: {
                                        name: entity.mod.name,
                                        val: true
                                    }
                                };

                                entity.elem && (commonMod.elem = entity.elem);

                                commonModId = stringifyEntity(commonMod);
                            }

                            return introspection._introspections.map(function (levelIntrospection) {
                                return (levelIntrospection[id] || levelIntrospection[commonModId] || []);
                            });
                        });

                        var uniqFiles = {};

                        data.forEach(function (slices) {
                            slices.forEach(function (slice) {
                                var files = [];
                                var dirs = [];

                                slice.forEach(function (file) {
                                    if (uniqFiles[file.path]) { return; }
                                    uniqFiles[file.path] = true;

                                    var info = getFileInfo(file);

                                    file.isDirectory ? dirs.push(info) : files.push(info);
                                });

                                fileList.addFiles(files);
                                dirList.addFiles(dirs);
                            });
                        });

                        _this.node.resolveTarget(filesTarget, fileList);
                        _this.node.resolveTarget(dirsTarget, dirList);
                    });
            });
    },

    clean: function () {}
});

/**
 * Returns info about file for ENB FileList.
 *
 * @param {object} file - info about file.
 * @returns {promise}
 */
function getFileInfo(file) {
    var filename = file.path;
    var isDirectory = file.isDirectory;
    var info = {
        fullname: filename,
        name: path.basename(filename),
        suffix: file.tech,
        mtime: file.mtime,
        isDirectory: isDirectory
    };

    if (!isDirectory) {
        return info;
    }

    var basenames = fs.readdirSync(filename);

    info.files = basenames.map(function (basename) {
        return FileList.getFileInfo(path.join(filename, basename));
    });

    return info;
}

function requireSourceDeps(data, filename) {
    return (data ? vow.resolve(data) : fileEval(filename))
        .then(function (sourceDeps) {
            if (Array.isArray(sourceDeps)) {
                sourceDeps = { deps: sourceDeps };
            }

            return bemDecl.parse(sourceDeps);
        })
        .then(function (sourceDeps) {
            return sourceDeps.map(function (cell) {
                return cell.entity;
            });
        });
}
