'use strict';

const originNamingPreset = require('@bem/sdk.naming.presets').origin;
const stringifyEntity = require('@bem/sdk.naming.entity.stringify')(originNamingPreset);
const parseEntity = require('@bem/sdk.naming.entity.parse')(originNamingPreset);

/**
 * Contains info about files in levels for bundle.
 */
module.exports = class BundleIntrospection {
    constructor (levels, introspections) {
        this._levels = levels;
        this._introspections = introspections;
    }
    /**
     * Returns all level paths.
     *
     * @returns {String[]}
     */
    getLevels () {
        return this._levels;
    }
    /**
     * Returns all BEM entities.
     *
     * @returns {Object[]}
     */
    getEntities () {
        const entities = [];

        this._introspections.forEach(introspection => {
            Object.keys(introspection).forEach(id => {
                const entity = parseEntity(id);

                entities.push(entity);
            });
        });

        return entities;
    }
    /**
     * Returns info about files of specified entity.
     *
     * @param {Object} entity
     * @returns {Object[]}
     */
    getFilesByEntity (entity) {
        const id = stringifyEntity(entity);

        let files = [];
        this._introspections.forEach(introspection => {
            files = files.concat(introspection[id] || []);
        });

        return files;
    }
    /**
     * Returns info about files with specified techs.
     *
     * @param {String[]} techs
     * @returns {Object[]}
     */
    getFilesByTechs (techs) {
        const res = [];

        this._introspections.forEach(introspection => {
            Object.keys(introspection).forEach(id => {
                const files = introspection[id];

                files.forEach(file => {
                    if (techs.indexOf(file.tech) !== -1) {
                        res.push(file);
                    }
                });
            });
        });

        return res;
    }
};
