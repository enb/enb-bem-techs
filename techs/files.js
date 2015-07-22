var inherit = require('inherit'),
    vow = require('vow'),
    deps = require('../lib/deps/deps'),
    asyncRequire = require('enb/lib/fs/async-require'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
    FileList = require('enb/lib/file-list');

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
 *     bem = require('enb-bem-techs');
 *
 * module.exports = function(config) {
 *     config.node('bundle', function(node) {
 *         // scan levels
 *         node.addTech([bem.levels, { levels: ['blocks'] }]);
 *
 *         // build DEPS file
 *         node.addTechs([
 *              [FileProvideTech, { target: '?.bemdecl.js' }],
 *              bem.deps
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
module.exports = inherit(require('enb/lib/tech/base-tech.js'), {
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
                            var slices = levelPaths.map(function () { return []; });

                            files.forEach(function iterate(file) {
                                levelPaths.forEach(function (levelPath, index) {
                                    if (file.fullname.indexOf(levelPath) === 0) {
                                        slices[index].push(file);
                                    }
                                });
                            });

                            return slices;
                        }

                        function filter(file) {
                            if (hash[file.fullname]) {
                                return false;
                            }

                            hash[file.fullname] = true;
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
            dropRequireCache(require, filename),
            asyncRequire(filename)
        ))
        .then(function (sourceDeps) {
            if (sourceDeps.blocks) {
                return deps.fromBemdecl(sourceDeps.blocks);
            }

            return Array.isArray(sourceDeps) ? sourceDeps : sourceDeps.deps;
        });
}
