var inherit = require('inherit'),
    vow = require('vow'),
    deps = require('../lib/deps/deps'),
    enb = require('enb'),
    BaseTech = enb.BaseTech || require('enb/lib/tech/base-tech'),
    asyncRequire = require('enb-async-require'),
    clearRequire = require('clear-require'),
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
        var logger = this.node.getLogger();

        this._filesTarget = this.node.unmaskTargetName(this.getOption('filesTarget', '?.files'));
        this._dirsTarget = this.node.unmaskTargetName(this.getOption('dirsTarget', '?.dirs'));
        this._levelsTarget = this.node.unmaskTargetName(this.getOption('levelsTarget', '?.levels'));

        this._depsFile = this.getOption('depsTarget');
        if (this._depsFile) {
            logger.logOptionIsDeprecated(this._filesTarget, 'enb-bem', this.getName(),
                'depsTarget', 'depsFile', ' It will be removed in v3.0.0.');
            logger.logOptionIsDeprecated(this._dirsTarget, 'enb-bem', this.getName(),
                'depsTarget', 'depsFile', ' It will be removed in v3.0.0.');
        } else {
            this._depsFile = this.getOption('depsFile', '?.deps.js');
        }
        this._depsFile = this.node.unmaskTargetName(this._depsFile);
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
            .spread(function (data, levels) {
                return requireSourceDeps(data, depsFilename)
                    .then(function (sourceDeps) {
                        var fileList = new FileList(),
                            dirList = new FileList(),
                            levelPaths = levels.items.map(function (level) {
                                return level.getPath();
                            }),
                            hash = {};

                        for (var i = 0, l = sourceDeps.length; i < l; i++) {
                            var dep = sourceDeps[i],
                                entities;

                            if (dep.elem) {
                                entities = levels.getElemEntities(dep.block, dep.elem, dep.mod, dep.val);
                            } else {
                                entities = levels.getBlockEntities(dep.block, dep.mod, dep.val);
                            }

                            slice(entities.files.filter(filter)).forEach(fileList.addFiles.bind(fileList));
                            slice(entities.dirs.filter(filter)).forEach(dirList.addFiles.bind(dirList));
                        }

                        function slice(files) {
                            var slices = levelPaths.map(function () { return []; }),
                                uniqs = {};

                            files.forEach(function iterate(file) {
                                var filename = file.fullname;

                                levelPaths.forEach(function (levelPath, index) {
                                    if (!uniqs[filename] && filename.indexOf(levelPath) === 0) {
                                        slices[index].push(file);
                                        uniqs[filename] = true;
                                    }
                                });
                            });

                            return slices;
                        }

                        function filter(file) {
                            var filename = file.fullname;

                            if (hash[filename]) {
                                return false;
                            }

                            hash[filename] = true;
                            return true;
                        }

                        _this.node.resolveTarget(filesTarget, fileList);
                        _this.node.resolveTarget(dirsTarget, dirList);
                    });
            });
    },

    clean: function () {}
});

function requireSourceDeps(data, filename) {
    return (data ? vow.resolve(data) : (
            clearRequire(filename),
            asyncRequire(filename)
        ))
        .then(function (sourceDeps) {
            if (sourceDeps.blocks) {
                return deps.fromBemdecl(sourceDeps.blocks);
            }

            return Array.isArray(sourceDeps) ? sourceDeps : sourceDeps.deps;
        });
}
