/**
 * deps-by-tech-to-bemdecl
 * =======================
 *
 * Формирует *bemdecl* на основе depsByTech-информации из `?.deps.js`.
 *
 * **Опции**
 *
 * * *String* **sourceTech** — Имя исходной технологии. Обязательная опция.
 * * *String* **destTech** — Имя конечной технологии. Обязательная опция.
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
 *   (его предоставляет технология `files`). По умолчанию — `?.files`.
 * * *String* **sourceSuffixes** — суффиксы файлов, по которым строится `files`-таргет. По умолчанию — 'deps.js'.
 * * *String* **target** — Результирующий bemdecl-таргет. По умолчанию — `?.bemdecl.js`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb-bem-techs/techs/deps-by-tech-to-bemdecl'), {
 *     sourceTech: 'js',
 *     destTech: 'bemhtml'
 * });
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
        this._destTech = this.getRequiredOption('destTech');
    },

    getTargets: function () {
        return [this._target];
    },

    build: function () {
        var node = this.node,
            target = this._target,
            cache = node.getNodeCache(target),
            bemdeclFilename = node.resolvePath(target),
            filesFilename = node.resolvePath(this._filesTarget),
            sourceTech = this._sourceTech,
            destTech = this._destTech;

        return this.node.requireSources([this._filesTarget])
            .spread(function (files) {
                if (cache.needRebuildFile('bemdecl-file', bemdeclFilename) ||
                    cache.needRebuildFile('files-file', filesFilename)
                ) {
                    var depsFiles = files.bySuffix['deps.js'] || [];

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

                                                if (singleDep.tech === destTech) {
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
                                cache.cacheFileInfo('files-file', filesFilename);
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
