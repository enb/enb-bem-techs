'use strict';

const fs = require('fs');
const path = require('path');
const inherit = require('inherit');
const vow = require('vow');
const enb = require('enb');
const fileEval = require('file-eval');
const bemDecl = require('@bem/sdk.decl');
const originNamingPreset = require('@bem/sdk.naming.presets').origin;
const stringifyEntity = require('@bem/sdk.naming.entity.stringify')(originNamingPreset);
const BaseTech = enb.BaseTech || require('enb/lib/tech/base-tech');
const FileList = enb.FileList || require('enb/lib/file-list');

/**
 * @class FilesTech
 * @augments {BaseTech}
 * @see {@link FileList}
 * @classdesc
 *
 * Builds list of files and list of directories. Uses declaration of BEM entities and {@link Levels}.
 *
 * Used by the most of other technologies except for base technologies.
 *
 * Important: provides result in two targets: `?.files` and `?.dirs`.
 *
 * @param {Object}  [options]                         Options.
 * @param {String}  [options.filesTarget='?.files']   Path to built target with files list ({@link FileList}).
 * @param {String}  [options.dirsTarget='?.dirs']     Path to built target with dirs list ({@link FileList}).
 * @param {String}  [options.levelsTarget=?.levels]   Path to target with {@link Levels}.
 * @param {String}  [options.depsFile=?.deps.js]      Path to file with declaration of BEM entities.
 *
 * @example
 * var FileProvideTech = require('enb/techs/file-provider'),
 *     bemTechs = require('enb-bem-techs');
 *
 * module.exports = function(config) {
 *     config.node('bundle', function(node) {
 *         // scan levels
 *         node.addTech([bemTechs.levels, { levels: ['blocks'] }]);
 *
 *         // build DEPS file
 *         node.addTechs([
 *              [FileProvideTech, { target: '?.bemdecl.js' }],
 *              bemTechs.deps
 *         ]);
 *
 *         // build lists of files and dirs
 *         node.addTech([techs.files, {
 *             filesTarget: '?.files',
 *             dirsTarget: '?.dirs'
 *         }]);
 *         node.addTargets(['?.files', '?.dirs']);
 *     });
 * };
 */
module.exports = inherit(BaseTech, {
    getName() {
        return 'files';
    },

    configure() {
        const node = this.node;

        this._filesTarget = node.unmaskTargetName(this.getOption('filesTarget', '?.files'));
        this._dirsTarget = node.unmaskTargetName(this.getOption('dirsTarget', '?.dirs'));
        this._levelsTarget = node.unmaskTargetName(this.getOption('levelsTarget', '?.levels'));
        this._depsFile = node.unmaskTargetName(this.getOption('depsFile', '?.deps.js'));
    },

    getTargets() {
        return [
            this._filesTarget,
            this._dirsTarget
        ];
    },

    build() {
        const _this = this;
        const depsFilename = this.node.resolvePath(this._depsFile);
        const filesTarget = this._filesTarget;
        const dirsTarget = this._dirsTarget;

        return this.node.requireSources([this._depsFile, this._levelsTarget])
            .spread((sourceDeps, introspection) => requireSourceDeps(sourceDeps, depsFilename)
            .then(sourceDecl => {
                const fileList = new FileList();
                const dirList = new FileList();
                const uniqs = {};

                const data = sourceDecl.map(entity => {
                    const id = stringifyEntity(entity);

                    if (uniqs[id]) { return []; }
                    uniqs[id] = true;

                    let commonModId;

                    if (entity.mod && entity.mod.val) {
                        const commonMod = {
                            block: entity.block,
                            mod: {
                                name: entity.mod.name,
                                val: true
                            }
                        };

                        entity.elem && (commonMod.elem = entity.elem);

                        commonModId = stringifyEntity(commonMod);
                    }

                    return introspection._introspections.map(levelIntrospection => {
                        return levelIntrospection[id] || levelIntrospection[commonModId] || [];
                    });
                });

                const uniqFiles = {};

                data.forEach(slices => {
                    slices.forEach(slice => {
                        const files = [];
                        const dirs = [];

                        slice.forEach(file => {
                            if (uniqFiles[file.path]) { return; }
                            uniqFiles[file.path] = true;

                            const info = getFileInfo(file);

                            file.isDirectory ? dirs.push(info) : files.push(info);
                        });

                        fileList.addFiles(files);
                        dirList.addFiles(dirs);
                    });
                });

                _this.node.resolveTarget(filesTarget, fileList);
                _this.node.resolveTarget(dirsTarget, dirList);
            }));
    },

    clean() {}
});

/**
 * Returns info about file for ENB FileList.
 *
 * @param {object} file - info about file.
 * @returns {promise}
 */
function getFileInfo(file) {
    const filename = file.path;
    const isDirectory = file.isDirectory;
    const info = {
        fullname: filename,
        name: path.basename(filename),
        suffix: file.tech,
        mtime: file.mtime,
        isDirectory
    };

    if (!isDirectory) {
        return info;
    }

    const basenames = fs.readdirSync(filename);

    info.files = basenames.map(basename => FileList.getFileInfo(path.join(filename, basename)));

    return info;
}

function requireSourceDeps(data, filename) {
    return (data ? vow.resolve(data) : fileEval(filename))
        .then(sourceDeps => {
            if (Array.isArray(sourceDeps)) {
                sourceDeps = { deps: sourceDeps };
            }

            return bemDecl.parse(sourceDeps);
        })
        .then(sourceDeps => sourceDeps.map(cell => cell.entity));
}
