var inherit = require('inherit');

/**
 * @class BemdeclMergeTech
 * @augments {MergeBemdeclTech}
 * @deprecated Use {@link MergeBemdeclTech} instead. It will be removed in v3.0.0.
 * @see {@link MergeBemdeclTech}
 */
module.exports = inherit(require('./merge-bemdecl'), {
    getName: function () {
        return 'bemdecl-merge';
    },

    build: function () {
        var logger = this.node.getLogger();

        logger.logTechIsDeprecated(this._target, this.getName(), 'enb-bem-techs',
            'merge-bemdecl', 'enb-bem-techs', ' It will be removed in v3.0.0.');
        this.__base();
    }
});
