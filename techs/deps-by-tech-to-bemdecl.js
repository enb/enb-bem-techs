'use strict';

const inherit = require('inherit');
const originNamingPreset = require('@bem/sdk.naming.presets').origin;
const parseEntity = require('@bem/sdk.naming.entity.parse')(originNamingPreset);
const enb = require('enb');
const vfs = enb.asyncFS || require('enb/lib/fs/async-fs');
const BaseTech = enb.BaseTech || require('enb/lib/tech/base-tech');
const fileEval = require('file-eval');
const bemDecl = require('@bem/sdk.decl');
const bemDeps = require('@bem/sdk.deps');

/**
 * @class DepsByTechToBemdeclTech
 * @augments {BaseTech}
 * @classdesc
 *
 * Builds BEMDECL file using tech dependencies (depsByTech). Such dependencies are described in `deps.js` files.
 *
 * @param {Object}      options                              Options.
 * @param {String}      options.sourceTech                   Tech name to build declaration for.
 *                                                           It depends on `destTech`.
 * @param {String}      options.destTech                     Tech name `sourceTech` depends from.
 * @param {String}      [options.target=?.bemdecl.js]        Path to BEMDECL file to build.
 * @param {String}      [options.filesTarget='?.files']      Path to target with {@link FileList}.
 * @param {String[]}    [options.sourceSuffixes=['deps.js']] Files with specified suffixes involved in the assembly.
 * @param {String}      [options.bemdeclFormat='bemdecl'] Format of result declaration (bemdecl or deps).
 *
 * @example
 * var FileProvideTech = require('enb/techs/file-provider'),
 *     bemTechs = require('enb-bem-techs');
 *
 * module.exports = function(config) {
 *     config.node('bundle', function(node) {
 *         // get FileList
 *         node.addTechs([
 *             [bemTechs.levels, { levels: ['blocks'] }],
 *             [FileProvideTech, { target: '?.bemdecl.js' }],
 *             bemTechs.deps,
 *             bemTechs.files
 *         ]);
 *
 *         // build BEMDECL file with BEMHTML entities for JavaScript
 *         node.addTech([bemTechs.depsByTechToBemdecl, {
 *             target: '?.bemhtml.bemdecl.js',
 *             sourceTech: 'js',
 *             destTech: 'bemhtml'
 *         }]);
 *         node.addTarget('?.bemhtml.bemdecl.js');
 *     });
 * };
 */
module.exports = inherit(BaseTech, {
    getName() {
        return 'deps-by-tech-to-bemdecl';
    },

    configure() {
        const node = this.node;

        this._target = node.unmaskTargetName(this.getOption('target', '?.bemdecl.js'));
        this._filesTarget = node.unmaskTargetName(this.getOption('filesTarget', '?.files'));
        this._sourceTech = this.getRequiredOption('sourceTech');
        this._destTech = this.getOption('destTech');
        this._sourceSuffixes = this.getOption('sourceSuffixes', ['deps.js']);
        this._bemdeclFormat = this.getOption('bemdeclFormat', 'bemdecl');
    },

    getTargets() {
        return [this._target];
    },

    build() {
        const node = this.node;
        const target = this._target;
        const cache = node.getNodeCache(target);
        const bemdeclFilename = node.resolvePath(target);
        const sourceTech = this._sourceTech;
        const destTech = this._destTech;
        const sourceSuffixes = Array.isArray(this._sourceSuffixes) ? this._sourceSuffixes : [this._sourceSuffixes];
        const bemdeclFormat = this._bemdeclFormat;

        return this.node.requireSources([this._filesTarget])
            .spread(files => {
                const depsFileList = files.getBySuffix(sourceSuffixes);

                if (cache.needRebuildFile('bemdecl-file', bemdeclFilename) ||
                    cache.needRebuildFileList('deps-files', depsFileList)
                ) {
                    const entities = [];
                    const depsFiles = depsFileList.map(file => {
                        const bemname = file.name.split('.')[0];
                        const entity = parseEntity(bemname);

                        entities.push(entity);

                        return { path: file.fullname, entity };
                    });

                    return bemDeps.read()(depsFiles)
                        .then(bemDeps.parse())
                        .then(bemDeps.buildGraph)
                        .then(graph => {
                            const resolvedDeps = graph.dependenciesOf(entities, sourceTech)
                                .filter(cell => destTech ? cell.tech === destTech : true);

                            let data = bemDecl.format(resolvedDeps, { format: bemdeclFormat === 'deps' ? 'enb' : 'v1' });

                            if (bemdeclFormat !== 'deps') {
                                data = { blocks: data };
                            }

                            const str = `module.exports = ${JSON.stringify(data, null, 4)}\n`;

                            return vfs.write(bemdeclFilename, str, 'utf-8')
                                .then(() => {
                                    cache.cacheFileInfo('bemdecl-file', bemdeclFilename);
                                    cache.cacheFileList('deps-files', depsFileList);
                                    node.resolveTarget(target, data);
                                });
                    });
                } else {
                    node.isValidTarget(target);

                    return fileEval(bemdeclFilename)
                        .then(result => {
                            node.resolveTarget(target, result);
                            return null;
                        });
                }
            });
    }
});
