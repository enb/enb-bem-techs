'use strict';

const path = require('path');
const fs = require('fs');

const vow = require('vow');
const enb = require('enb');
const walk = require('bem-walk');
const stringifyEntity = require('bem-naming').stringify;
const uniqBy = require('lodash').uniqBy;

const vfs = enb.asyncFS || require('enb/lib/fs/async-fs');
const buildFlow = enb.buildFlow || require('enb/lib/build-flow');
const BundleIntrospection = require('../lib/bundle-introspection');

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
module.exports = buildFlow.create()
    .name('levels')
    .target('target', '?.levels')
    .defineRequiredOption('levels')
    .defineOption('sublevelDirectories', ['blocks'])
    .saver(function () {})
    .needRebuild(function () {
        return true;
    })
    .builder(function () {
        const target = this._target;
        const node = this.node;
        const scan = this.scanLevel.bind(this);

        return this.getLevels()
            .then(function (levels) {
                return vow.all(levels.map(scan))
                    .then(function (introspections) {
                        return [levels, introspections];
                    });
            })
            .spread(function (levels, introspections) {
                const levelPaths = levels.map(function (level) { return level.path; });

                node.resolveTarget(target, new BundleIntrospection(levelPaths, introspections));
            }, this);
    })
    .methods({
        /**
         * Returns levels for current bundle.
         *
         * @returns {{path: string, check: boolean}[]}
         */
        getLevels: function () {
            const sourceLevels = this._initLevels(this._levels);

            return this._findSublevels()
                .then(function (sublevels) {
                    return uniqBy(sourceLevels.concat(sublevels), 'path');
                });
        },
        /**
         * Scans specified level.
         *
         * If level has `check: false` option and was scanned previously then introspection will be taken from cache.
         *
         * If the level of need for several bundles then it will be scanned only once.
         *
         * @param {{path: string, check: boolean}[]} level
         * @returns {promise}
         */
        scanLevel: function (level) {
            const node = this.node;
            const cache = node.getNodeCache(this._target);
            const state = node.buildState;
            const scan = this._forceScanLevel.bind(this);
            const levelpath = level.path;
            const key = 'level:' + levelpath;

            let promise = state[key];
            if (promise) { return promise; }

            if (level.check === false) {
                var data = cache.get(key);

                promise = data ? vow.resolve(data)
                    : scan(levelpath)
                        .then(function (introspection) {
                            cache.set(key, introspection);

                            return introspection;
                        });
            } else {
                promise = scan(levelpath);
            }

            state[key] = promise;

            return promise;
        },
        /**
         * Processes the `levels` option.
         *
         * @returns {{path: string, check: boolean}[]}
         */
        _initLevels: function () {
            const root = this.node.getRootDir();

            return this._levels.map(function (level) {
                const levelpath = typeof level === 'object' ? level.path : level;

                return {
                    path: path.resolve(root, levelpath),
                    check: level.hasOwnProperty('check') ? level.check : true
                };
            });
        },
        /**
         * Finds special levels for current bundle.
         *
         * @returns {{path: string, check: boolean}[]}
         */
        _findSublevels: function () {
            const dir = path.join(this.node.getDir());
            const patterns = this._sublevelDirectories;

            return vfs.listDir(dir)
                .then(function (basenames) {
                    return basenames
                        .filter(function (basename) {
                            return patterns.indexOf(basename) !== -1;
                        })
                        .map(function (basename) {
                            return { path: path.join(dir, basename), check: false };
                        });
                });
        },
        /**
         * Scans specified level.
         *
         * The cache of current node will be ignored and scan happen again.
         *
         * @param {string} levelpath - path to level.
         * @returns {promise}
         */
        _forceScanLevel: function (levelpath) {
            return new vow.Promise((resolve, reject) => {
                const data = {};
                const promises = [];

                walk([levelpath])
                    .on('data', function (file) {
                        const id = stringifyEntity(file.entity);

                        promises.push(new Promise((resolve, reject) => {
                            fs.stat(file.path, (err, stats) => {
                                if (err) {
                                    return reject(err);
                                }

                                file.isDirectory = stats.isDirectory();
                                file.mtime = stats.mtime.getTime();

                                (data[id] || (data[id] = [])).push(file);

                                resolve();
                            });
                        }));
                    })
                    .on('error', reject)
                    .on('end', () => {
                        Promise.all(promises)
                            .catch(reject)
                            .then(() => resolve(data));
                    });
            });
        }
    })
    .createTech();
