'use strict';

const path = require('path');
const fs = require('fs');
const stream = require('stream');

const vow = require('vow');
const enb = require('enb');
const walk = require('@bem/sdk.walk');
const uniqBy = require('lodash.uniqby');
const omit = require('lodash.omit');

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
    .saver(() => {})
    .needRebuild(() => true)
    .builder(function () {
        const target = this._target;
        const node = this.node;
        const scan = this.scanLevel.bind(this);

        return this.getLevels()
            .then(levels => {
                return vow.all(levels.map(scan))
                    .then(introspections => [levels, introspections]);
            })
            .spread((levels, introspections) => {
                const levelPaths = levels.map(level => level.path);

                node.resolveTarget(target, new BundleIntrospection(levelPaths, introspections));
            }, this);
    })
    .methods({
        /**
         * Returns levels for current bundle.
         *
         * @returns {{path: string, check: boolean}[]}
         */
        getLevels() {
            const sourceLevels = this._initLevels(this._levels);

            return this._findSublevels()
                .then(sublevels => uniqBy(sourceLevels.concat(sublevels), 'path'));
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
        scanLevel(level) {
            const node = this.node;
            const cache = node.getNodeCache(this._target);
            const state = node.buildState;
            const scan = this._forceScanLevel.bind(this);
            const levelpath = level.path;
            const key = `level:${levelpath}`;

            let promise = state[key];
            if (promise) { return promise; }

            if (level.check === false) {
                const data = cache.get(key);

                promise = data ? vow.resolve(data)
                    : scan(levelpath)
                        .then(introspection => {
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
        _initLevels() {
            const root = this.node.getRootDir();

            return this._levels.map(level => {
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
        _findSublevels() {
            const dir = path.join(this.node.getDir());
            const patterns = this._sublevelDirectories;

            return vfs.listDir(dir)
                .then(basenames => {
                    return basenames.filter(basename => patterns.indexOf(basename) !== -1)
                        .map(basename => ({
                            path: path.join(dir, basename),
                            check: false
                        }));
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
        _forceScanLevel(levelpath) {
            return new vow.Promise((resolve, reject) => {
                const data = {};

                walk([levelpath])
                    .on('error', reject)
                    .pipe(new stream.Writable({
                        objectMode: true,
                        write(file, encoding, callback) {
                            tryCatch(() => {
                                const entity = file.entity;
                                const id = file.entity.id;
                                const stats = fs.statSync(file.path);
                                const entityData = omit(entity.toJSON(), 'mod');

                                if (entity.mod) {
                                    entityData.modName = entity.mod.name;
                                    entity.mod.val && (entityData.modVal = entity.mod.val);
                                }

                                const fileData = {
                                    entity: entityData,
                                    tech: file.tech,
                                    level: file.level,
                                    path: file.path,
                                    isDirectory: stats.isDirectory(),
                                    mtime: stats.mtime.getTime()
                                };

                                const entityFiles = data.hasOwnProperty(id) && data[id] || (data[id] = []);
                                entityFiles.push(fileData);

                                callback();
                            }, callback);
                        }
                    }))
                    .on('error', reject)
                    .on('finish', () => resolve(data));
            });
        }
    })
    .createTech();

// try-catch optimization
function tryCatch(tryFn, catchFn) {
    try {
        tryFn();
    } catch (e) { catchFn(e); }
}
