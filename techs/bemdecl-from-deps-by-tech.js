var inherit = require('inherit');

/**
 * @class BemdeclFromDepsByTechTech
 * @augments {DepsByTechToBemdeclTech}
 * @deprecated Use {@link DepsByTechToBemdeclTech} instead. It will be removed in v3.0.0.
 * @see {@link DepsByTechToBemdeclTech}
 */
module.exports = inherit(require('./deps-by-tech-to-bemdecl'), {
    getName: function () {
        return 'bemdecl-from-deps-by-tech';
    },

    build: function () {
        var logger = this.node.getLogger();

        logger.logTechIsDeprecated(this._target, this.getName(), 'enb-bem-techs',
            'deps-by-tech-to-bemdecl', 'enb-bem-techs', ' It will be removed in v3.0.0.');
        this.__base();
    }
});
