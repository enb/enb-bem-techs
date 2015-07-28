var inherit = require('inherit');

/**
 * @class DepsProviderTech
 * @augments {ProvideDepsTech}
 * @deprecated Use {@link ProvideDepsTech} instead. It will be removed in v3.0.0.
 * @see {@link ProvideDepsTech}
 */
module.exports = inherit(require('./provide-deps'), {
    getName: function () {
        return 'deps-provider';
    },

    build: function () {
        var logger = this.node.getLogger();

        logger.logTechIsDeprecated(this._target, this.getName(), 'enb-bem-techs',
            'provide-deps', 'enb-bem-techs', ' It will be removed in v3.0.0.');
        this.__base();
    }
});
