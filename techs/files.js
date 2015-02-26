/**
 * files
 * =====
 *
 * Собирает список исходных файлов и директорий для сборки на основе декларации БЭМ-сущностей,
 * а также результате сканирования уровней `levels` технологией.
 *
 * Предоставляет `?.files` и `?.dirs` таргеты.
 *
 * Используется большинством технологиями в ENB (кроме базовых).
 *
 * Опции:
 *
 * `filesTarget`
 *
 * Тип: `String`. По умолчанию: `?.files`.
 * Результирующий `files`-таргет.
 *
 * `dirsTarget`
 *
 * Тип: `String`. По умолчанию: `?.dirs`.
 * Результирующий `dirs`-таргет.
 *
 * `depsFile`
 *
 * Тип: `String`. По умолчанию: `?.deps.js`.
 * Исходная декларация БЭМ-сущностей.
 *
 * `levelsTarget`
 *
 * Тип: `String`. По умолчанию: `?.levels`.
 * Таргет с интроспекцией уровней (результат сканирования `levels` технологией).
 *
 * Пример:
 *
 * Формирование списка файлов и директорий по BEMDECL-файлу.
 *
 * ```js
 * var techs = require('enb-bem-techs'),
 * provide = require('enb/techs/file-provider');
 *
 * nodeConfig.addTechs([
 *     [techs.levels, { levels: ['blocks'] }],
 *     [provide, { target: '?.bemdecl.js' }]
 *     [techs.files, { depsFile: '?.bemdecl.js' }]
 * ]);
 * ```
 *
 * Формирование списка файлов и директорий по DEPS-файлу.
 *
 * ```js
 * var techs = require('enb-bem-techs'),
 * provide = require('enb/techs/file-provider');
 *
 * nodeConfig.addTechs([
 *     [techs.levels, { levels: ['blocks'] }],
 *     [provide, { target: '?.bemdecl.js' }],
 *     [techs.deps],
 *     [techs.files]
 * ]);
 * ```
 */
var inherit = require('inherit'),
    vow = require('vow'),
    deps = require('../lib/deps/deps'),
    asyncRequire = require('enb/lib/fs/async-require'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
    FileList = require('enb/lib/file-list');

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
            logger.logOptionIsDeprecated(this._filesTarget, 'enb-bem', this.getName(), 'depsTarget', 'depsFile');
            logger.logOptionIsDeprecated(this._dirsTarget, 'enb-bem', this.getName(), 'depsTarget', 'depsFile');
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
                            files = {},
                            dirs = {};

                        for (var i = 0, l = sourceDeps.length; i < l; i++) {
                            var dep = sourceDeps[i],
                                entities;
                            if (dep.elem) {
                                entities = levels.getElemEntities(dep.block, dep.elem, dep.mod, dep.val);
                            } else {
                                entities = levels.getBlockEntities(dep.block, dep.mod, dep.val);
                            }

                            addEntityFiles(entities);
                        }

                        fileList.addFiles(Object.keys(files).map(function (filename) {
                            return files[filename];
                        }));

                        dirList.addFiles(Object.keys(dirs).map(function (dirname) {
                            return dirs[dirname];
                        }));

                        function addEntityFiles(entities) {
                            entities.files.forEach(function (file) {
                                files[file.fullname] = file;
                            });

                            entities.dirs.forEach(function (dir) {
                                dirs[dir.fullname] = dir;
                            });
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
