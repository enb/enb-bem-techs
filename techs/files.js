/**
 * files
 * =====
 *
 * Собирает список исходных файлов для сборки на основе *deps* и *levels*, предоставляет `?.files` и `?.dirs`.
 * Используется многими технологиями, которые объединяют множество файлов из различных уровней переопределения в один.
 *
 * **Опции**
 *
 * * *String* **depsFile** — Исходный deps-таргет. По умолчанию — `?.deps.js`.
 * * *String* **levelsTarget** — Исходный levels. По умолчанию — `?.levels`.
 * * *String* **filesTarget** — Результирующий files-таргет. По умолчанию — `?.files`.
 * * *String* **dirsTarget** — Результирующий dirs-таргет. По умолчанию — `?.dirs`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb-bem/techs/files'));
 * ```
 */
var inherit = require('inherit');
var FileList = require('enb/lib/file-list');

module.exports = inherit(require('enb/lib/tech/base-tech.js'), {
    getName: function () {
        return 'files';
    },

    configure: function () {
        var logger = this.node.getLogger();

        this._filesTarget = this.node.unmaskTargetName(this.getOption('filesTarget', '?.files'));
        this._dirsTarget = this.node.unmaskTargetName(this.getOption('dirsTarget', '?.dirs'));
        this._levelsTarget = this.node.unmaskTargetName(this.getOption('levelsTarget', '?.levels'));

        this._depsTarget = this.getOption('depsTarget');
        if (this._depsTarget) {
            logger.logOptionIsDeprecated(this._filesTarget, 'enb-bem', this.getName(), 'depsTarget', 'depsFile');
            logger.logOptionIsDeprecated(this._dirsTarget, 'enb-bem', this.getName(), 'depsTarget', 'depsFile');
        } else {
            this._depsTarget = this.getOption('depsFile', '?.deps.js');
        }
        this._depsTarget = this.node.unmaskTargetName(this._depsTarget);
    },

    getTargets: function () {
        return [
            this._filesTarget,
            this._dirsTarget
        ];
    },

    build: function () {
        var _this = this;
        var filesTarget = this._filesTarget;
        var dirsTarget = this._dirsTarget;

        return this.node.requireSources([this._depsTarget, this._levelsTarget])
            .spread(function (deps, levels) {
                var fileList = new FileList();
                var dirList = new FileList();
                var files = {};
                var dirs = {};

                for (var i = 0, l = deps.length; i < l; i++) {
                    var dep = deps[i];
                    var entities;
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
    },

    clean: function () {}
});
