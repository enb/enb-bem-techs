var inherit = require('inherit');

/**
 * @class DepsMergeTech
 * @augments {MergeDepsTech}
 * @deprecated Use {@link MergeDepsTech} instead. It will be removed in v3.0.0.
 * @see {@link MergeDepsTech}
 */
module.exports = inherit(require('./merge-deps'), {
    getName: function () {
        return 'deps-merge';
    },

    build: function () {
        var logger = this.node.getLogger();

        logger.logTechIsDeprecated(this._target, this.getName(), 'enb-bem-techs',
            'merge-deps', 'enb-bem-techs', ' It will be removed in v3.0.0.');
        this.__base();
    }
});
