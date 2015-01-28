/**
 * levels-to-bemdecl
 * =================
 *
 * Формирует BEMDECL-файл, состоящий из всех БЭМ-сущностей, найденных в указанных уровнях.
 *
 * Опции:
 *
 * `target`
 *
 * Тип: `String`. По умолчанию: `?.bemdecl.js`.
 * Результирующий BEMDECL-файл.
 *
 * `source`
 *
 * Тип: `String`. По умолчанию: `?.levels`.
 * Таргет с интроспекцией уровней (результат сканирования `levels` технологией).
 *
 * Пример:
 *
 * ```js
 * var techs = require('enb-bem-techs');
 *
 * nodeConfig.addTechs([
 *     // Сканируем уровни проекта.
 *     // Результат записываем в `?.levels`, т.к. опция `target` по умолчанию — `?.levels`.
 *     [techs.levels, { levels: ['blocks'] }],
 *
 *     // Строим BEMDECL-файл по результатам сканирования уровней.
 *     // Интроспекцию берём из `?.levels`, т.к. опция `source` по умолчанию — `?.levels`.
 *     [techs.levelsToBemdecl]
 * ]);
 * ```
 */
var inherit = require('inherit'),
    vfs = require('enb/lib/fs/async-fs'),
    deps = require('../lib/deps/deps'),
    asyncRequire = require('enb/lib/fs/async-require'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache');

module.exports = inherit(require('enb/lib/tech/base-tech'), {
    getName: function () {
        return 'levels-to-bemdecl';
    },

    configure: function () {
        this._target = this.node.unmaskTargetName(
            this.getOption('target', this.node.getTargetName('bemdecl.js')));
        this._source = this.node.unmaskTargetName(
            this.getOption('source', this.node.getTargetName('levels')));
    },

    getTargets: function () {
        return [this.node.unmaskTargetName(this._target)];
    },

    build: function () {
        var node = this.node,
            target = this._target,
            bemdeclFilename = node.resolvePath(target),
            cache = node.getNodeCache(target);

        return node.requireSources([this._source]).spread(function (levels) {
            if (cache.needRebuildFile('bemdecl-file', bemdeclFilename)) {
                var resDeps = [],
                    blocks = [],
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

                blocks = deps.toBemdecl(resDeps);
                str = 'exports.blocks = ' + JSON.stringify(blocks, null, 4) + ';\n';

                return vfs.write(bemdeclFilename, str, 'utf8')
                    .then(function () {
                        cache.cacheFileInfo('bemdecl-file', bemdeclFilename);
                        node.resolveTarget(target, { blocks: blocks });
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
