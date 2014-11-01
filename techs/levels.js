/**
 * levels
 * ======
 *
 * Собирает информацию об уровнях переопределения проекта. Результат выполнения этой технологии необходим
 * следующим технологиям:
 *
 *  * `levelsToBemdecl`
 *  * `deps`
 *  * `depsOld`
 *  * `files`
 *
 * Опции:
 *
 * `target`
 *
 * Тип: `String`. По умолчанию: `?.levels`.
 * Результирующий таргет.
 *
 * `levels`
 *
 * Тип: `String[] | Object[]`.
 * Список путей до уровней переопределения.
 *
 * Каждый путь может быть задан абсолютным или относительно корня проекта.
 *
 * Вместо строки может использоваться объект вида `{ path: 'path/to/level', check: false }`.
 * Поле `path` является обязательным, а поле `check` по умолчанию равно `true`.
 *
 * Значение `check: false` используется для того, чтобы закэшировать содержимое уровня.
 *
 * Если указать `check: true` уровень будет сканироваться заново каждый раз при сборке, вне зависимости от наличия кэша.
 *
 * Пример:
 *
 * ```js
 * var techs = require('enb-bem-techs');
 *
 * nodeConfig.addTech([techs.levels, { levels: [
 *     // На проекте не нужно менять код внешних библиотек,
 *     // достаточно один раз просканировать их уровни и использовать кэш.
 *     { path: 'libs/bem-core/common.blocks', check: false },
 *     { path: 'libs/bem-core/desktop.blocks', check: false },
 *
 *     // Уровни проекта нужно сканировать перед каждой сборкой.
 *     { path: 'desktop.blocks', check: true },
 * ] }]);
 * ```
 */
var path = require('path'),
    inherit = require('inherit'),
    vow = require('vow'),
    vfs = require('enb/lib/fs/async-fs'),
    Level = require('../lib/levels/level'),
    Levels = require('../lib/levels/levels');

module.exports = inherit(require('enb/lib/tech/base-tech'), {
    getName: function () {
        return 'levels';
    },

    init: function () {
        this.__base.apply(this, arguments);
        this._levelConfig = this.getRequiredOption('levels');
        this._sublevelDirectories = this.getOption('sublevelDirectories', ['blocks']);
        this._target = this.node.unmaskTargetName(this.getOption('target', '?.levels'));
    },

    getTargets: function () {
        return [this._target];
    },

    build: function () {
        var _this = this,
            root = this.node.getRootDir(),
            target = this._target,
            levelList = [],
            levelsToCache = [],
            levelsIndex = {},
            cache = this.node.getNodeCache(target),
            levelConfig = _this._levelConfig;

        for (var i = 0, l = levelConfig.length; i < l; i++) {
            var levelInfo = levelConfig[i];

            levelInfo = typeof levelInfo === 'object' ? levelInfo : { path: levelInfo };

            var levelPath = path.resolve(root, levelInfo.path),
                levelKey = 'level:' + levelPath;
            if (levelsIndex[levelPath]) {
                continue;
            }
            levelsIndex[levelPath] = true;
            if (!this.node.buildState[levelKey]) {
                var level = new Level(levelPath, this.node.getLevelNamingScheme(levelPath));
                if (levelInfo.check === false) {
                    var blocks = cache.get(levelPath);
                    if (blocks) {
                        level.loadFromCache(blocks);
                    } else {
                        levelsToCache.push(level);
                    }
                }
                this.node.buildState[levelKey] = level;
            }
            levelList.push(this.node.buildState[levelKey]);
        }

        return vfs.listDir(path.join(_this.node.getRootDir(), _this.node.getPath()))
            .then(function (listDir) {
                return _this._sublevelDirectories.filter(function (path) {
                    return listDir.indexOf(path) !== -1;
                });
            })
            .then(function (sublevels) {
                return vow.all(sublevels.map(function (path) {
                    var sublevelPath = _this.node.resolvePath(path);
                    if (!levelsIndex[sublevelPath]) {
                        levelsIndex[sublevelPath] = true;
                        levelList.push(new Level(sublevelPath, _this.node.getLevelNamingScheme(sublevelPath)));
                    }
                }));
            })
            .then(function () {
                return vow.all(levelList.map(function (level) {
                        return level.load();
                    }))
                    .then(function () {
                        levelsToCache.forEach(function (level) {
                            cache.set(level.getPath(), level.getBlocks());
                        });
                        _this.node.resolveTarget(target, new Levels(levelList));
                    });
            });
    },

    clean: function () {}
});
