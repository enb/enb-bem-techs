'use strict';

const inherit = require('inherit');
const enb = require('enb');
const vfs = enb.asyncFS || require('enb/lib/fs/async-fs');
const BaseTech = enb.BaseTech || require('enb/lib/tech/base-tech');
const fileEval = require('file-eval');
const nodeEval = require('node-eval');
const BemCell = require('@bem/sdk.cell');
const bemjsonToDecl = require('@bem/sdk.bemjson-to-decl');
const bemDecl = require('@bem/sdk.decl');

/**
 * @class BemjsonToBemdeclTech
 * @augments {BaseTech}
 * @classdesc
 *
 * Builds BEMDECL file from BEMJSON file.
 *
 * @param {Object}  [options]                          Options.
 * @param {String}  [options.target='?.bemdecl.js']    Path to a built BEMDECL file.
 * @param {String}  [options.source='?.bemjson.js']    Path to a BEMJSON file.
 * @param {String}  [options.bemdeclFormat='bemdecl']  Format of result declaration (bemdecl or deps).
 *
 * @example
 * var FileProvideTech = require('enb/techs/file-provider'),
 *     bemTechs = require('enb-bem-techs');
 *
 * module.exports = function(config) {
 *     config.node('bundle', function(node) {
 *         // get BEMJSON file
 *         node.addTech([FileProvideTech, { target: '?.bemjson.js' }]);
 *
 *         // build BEMDECL file
 *         node.addTech(bemTechs.bemjsonToBemdecl);
 *         node.addTarget('?.bemdecl.js');
 *     });
 * };
 */
module.exports = inherit(BaseTech, {
    getName() {
        return 'bemjson-to-bemdecl';
    },

    configure() {
        const node = this.node;

        this._target = node.unmaskTargetName(this.getOption('target', '?.bemdecl.js'));
        this._sourceTarget = node.unmaskTargetName(this.getOption('source', '?.bemjson.js'));
        this._bemdeclFormat = this.getOption('bemdeclFormat', 'bemdecl');
    },

    getTargets() {
        return [this._target];
    },

    build() {
        const node = this.node;
        const logger = node.getLogger();
        const target = this._target;
        const cache = node.getNodeCache(target);
        const bemdeclFilename = node.resolvePath(target);
        const bemjsonFilename = node.resolvePath(this._sourceTarget);
        const bemdeclFormat = this._bemdeclFormat;

        const convertBemdeclFormatName = (formatName) => {
            const convertedFormatName = {
                bemdecl: 'v1',
                deps: 'enb'
            }[formatName];

            if (convertedFormatName) {
                const msg = `Deprecated format ${formatName}. Use ${convertedFormatName} instead.`;

                logger.logWarningAction('deprecate', this._target, msg);
            }

            return convertedFormatName || formatName;
        };

        return this.node.requireSources([this._sourceTarget])
            .then(() => {
                if (cache.needRebuildFile('bemdecl-file', bemdeclFilename) ||
                    cache.needRebuildFile('bemjson-file', bemjsonFilename)
                ) {
                    return fileEval(bemjsonFilename)
                        .then(bemjson => {
                            const entities = bemjsonToDecl.convert(bemjson);
                            const cells = entities.map(entity => new BemCell({ entity }));
                            const bemdeclFormatName = convertBemdeclFormatName(bemdeclFormat);
                            const str = bemDecl.stringify(cells, { format: bemdeclFormatName, exportType: 'commonjs' });
                            const data = nodeEval(str);

                            return vfs.write(bemdeclFilename, str, 'utf-8')
                                .then(() => {
                                    cache.cacheFileInfo('bemdecl-file', bemdeclFilename);
                                    cache.cacheFileInfo('bemjson-file', bemjsonFilename);
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

