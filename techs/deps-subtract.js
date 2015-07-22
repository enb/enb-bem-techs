var inherit = require('inherit');

/**
 * @class DepsSubtractTech
 * @augments {SubtractDepsTech}
 * @deprecated Use {@link SubtractDepsTech} instead. It will be removed in v3.0.0.
 * @see {@link SubtractDepsTech}
 */
module.exports = inherit(require('./subtract-deps'), {
    getName: function () {
        return 'deps-subtract';
    },

    build: function () {
        var logger = this.node.getLogger();

        logger.logTechIsDeprecated(this._target, this.getName(),
            'enb-bem-techs', 'subtract-deps', 'enb-bem-techs', ' It will be removed in v3.0.0.');
        this.__base();
    }
});
