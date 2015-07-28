var inherit = require('inherit');

/**
 * @class BemdeclProviderTech
 * @augments {ProvideBemdeclTech}
 * @deprecated Use {@link ProvideBemdeclTech} instead. It will be removed in v3.0.0.
 * @see {@link ProvideBemdeclTech}
 */
module.exports = inherit(require('./provide-bemdecl'), {
    getName: function () {
        return 'bemdecl-provider';
    },

    build: function () {
        var logger = this.node.getLogger();

        logger.logTechIsDeprecated(this._target, this.getName(), 'enb-bem-techs',
            'provide-bemdecl', 'enb-bem-techs', ' It will be removed in v3.0.0.');
        this.__base();
    }
});
