var inherit = require('inherit');

/**
 * @class BemdeclFromBemjsonTech
 * @augments {BemjsonToBemdeclTech}
 * @deprecated Use {@link BemjsonToBemdeclTech} instead. It will be removed in v3.0.0.
 * @see {@link BemjsonToBemdeclTech}
 */
module.exports = inherit(require('./bemjson-to-bemdecl'), {
    getName: function () {
        return 'bemdecl-from-bemjson';
    },

    build: function () {
        var logger = this.node.getLogger();

        logger.logTechIsDeprecated(this._target, this.getName(),
            'enb-bem-techs', 'bemjson-to-bemdecl', 'enb-bem-techs', ' It will be removed in v3.0.0.');
        this.__base();
    }
});
