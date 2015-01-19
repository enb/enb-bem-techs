/**
 * deps-by-tech-to-bemdecl
 * =======================
 *
 * Формирует BEMDECL-файл на основе зависимостей по технологиям (depsByTech).
 * Такие зависимости описываются в `deps.js` технологиях БЭМ-сущностей.
 *
 * Опции:
 *
 * `target`
 *
 * Тип: `String`. По умолчанию: `?.bemdecl.js`.
 * Результирующий BEMDECL-файл.
 *
 * `sourceTech`
 *
 * Тип: `String`. Обязательная опция.
 * Имя технологии для которой собираются зависимости.
 *
 * `destTech`
 *
 * Тип: `String`.
 * Имя технологии от которой зависит `sourceTech`.
 *
 * `filesTarget`
 *
 * Тип: `String`. По умолчанию: `?.files`.
 * Таргет со списоком `deps.js`-файлов (результат технологии `files`).
 *
 * `sourceSuffixes`
 *
 * Тип: `String[]`. По умолчанию: `['deps.js']`.
 * Суффиксы файлов с описанием зависимостей БЭМ-сущностей.
 *
 * Пример:
 *
 * Частый случай, когда БЭМ-сущность в технологии клиенского JavaScript использует свою же технологию шаблонов.
 *
 * `button.deps.js`
 *
 * ```js
 * {
 *     block: 'button'
 *     tech: 'js'              // sourceTech
 *     shouldDeps: {
 *         tech: 'bemhtml'     // destTech
 *     }
 * }
 * ```
 *
 * В большинстве случаев схема построения BEMDECL-файла по `depsByTech` выглядит так:
 *
 * ```
 * (BEMJSON ->) BEMDECL (1) -> deps (2) -> files (3) -> BEMDECL (4)
 * ```
 *
 * 1. Получаем BEMDECL-файл (?.bemdecl.js).
 * 2. Дополняем декларацию БЭМ-сущностей из BEMDECL-файла и записываем результат в DEPS-файл (?.deps.js).
 * 3. Получаем упорядоченный список `deps.js` файлов (?.files.js).
 * 4. Получаем BEMDECL-файл на основе зависимостей по технологиям (?.tech.bemdecl.js).
 *
 * ```js
 * var techs = require('enb-bem-techs'),
 * provide = require('enb/techs/file-provider');
 *
 * nodeConfig.addTechs([
 *     [techs.levels, { levels: ['blocks'] }],
 *     [provide, { target: '?.bemdecl.js' }], // (1) `?.bemdecl.js`
 *     [techs.deps],                          // (2) `?.deps.js`
 *     [techs.files],                         // (3) `?.files.js`
 *     // Далее '?.bemhtml.bemdecl.js' можно использовать для сборки шаблонов,
 *     // которые используются в клиенском JavaScript.
 *     // Список `deps.js` файлов берём из `?.files`, т.к. опция filesTarget
 *     // по умолчанию — `?.files`.
 *     [techs.depsByTechToBemdecl, {          // (4) `?.bemhtml.bemdecl.js`
 *         target: '?.bemhtml.bemdecl.js',
 *         sourceTech: 'js',
 *         destTech: 'bemhtml'
 *     }]
 * ]);
 * ```
 */
var inherit = require('inherit'),
    vm = require('vm'),
    naming = require('bem-naming'),
    vow = require('vow'),
    vfs = require('enb/lib/fs/async-fs'),
    asyncRequire = require('enb/lib/fs/async-require'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
    deps = require('../lib/deps/deps');

module.exports = inherit(require('enb/lib/tech/base-tech'), {
    getName: function () {
        return 'deps-by-tech-to-bemdecl';
    },

    configure: function () {
        this._target = this.node.unmaskTargetName(this.getOption('target', '?.bemdecl.js'));
        this._filesTarget = this.node.unmaskTargetName(this.getOption('filesTarget', '?.files'));
        this._sourceTech = this.getRequiredOption('sourceTech');
        this._destTech = this.getOption('destTech');
        this._sourceSuffixes = this.getOption('sourceSuffixes', ['deps.js']);
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
            sourceSuffixes = Array.isArray(this._sourceSuffixes) ? this._sourceSuffixes : [this._sourceSuffixes];

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
                                                singleDep.block || (singleDep.block = notation.block);

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

                        var blocks = deps.toBemdecl(result),
                            str = 'exports.blocks = ' + JSON.stringify(blocks, null, 4) + ';\n';

                        return vfs.write(bemdeclFilename, str, 'utf-8')
                            .then(function () {
                                cache.cacheFileInfo('bemdecl-file', bemdeclFilename);
                                cache.cacheFileList('deps-files', depsFiles);
                                node.resolveTarget(target, { blocks: blocks });
                            });
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

function depKey(dep) {
    return dep.block +
        (dep.elem ? '__' + dep.elem : '') +
        (dep.mod ? '_' + dep.mod + (dep.val ? '_' + dep.val : '') : '');
}
