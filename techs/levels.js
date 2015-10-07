var path = require('path'),
    inherit = require('inherit'),
    vow = require('vow'),
    enb = require('enb'),
    vfs = enb.asyncFS || require('enb/lib/fs/async-fs'),
    BaseTech = enb.BaseTech || require('enb/lib/tech/base-tech'),
    Level = require('../lib/levels/level'),
    Levels = require('../lib/levels/levels');

/**
 * @class LevelsTech
 * @augments {BaseTech}
 * @see {@link Levels}
 * @classdesc
 *
 * Scans project levels.
 *
 * The following technologies use the result of this technology: {@link LevelsToBemdeclTech}, {@link DepsTech},
 * {@link DepsOldTech}, {@link FilesTech}.
 *
 * @param {Object}              options                      Options.
 * @param {String}              [options.target='?.levels']  Path to result target with {@link Levels}.
 * @param {String[] | Object[]} options.levels               Paths of levels to scan. Instead path you can specified
 *                                                           `{ path: 'path/to/level', check: true }`.
 * @example
 * var FileProvideTech = require('enb/techs/file-provider'),
 *     bemTechs = require('enb-bem-techs');
 *
 * module.exports = function(config) {
 *     node.addTech([bemTechs.levels, {
 *         levels: [
 *             // In project you don't needto change source code of libs.
 *             // It is possible to scan libs levels one time and take result from cache.
 *             { path: 'libs/bem-core/common.blocks', check: false },
 *             { path: 'libs/bem-core/desktop.blocks', check: false },
 *
 *             // Project levels need scan for each build.
 *             { path: 'desktop.blocks', check: true }
 *         ]
 *     }]);
 * };
 */
module.exports = inherit(BaseTech, {
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
