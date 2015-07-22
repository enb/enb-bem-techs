/**
 * deps-subtract
 * =============
 *
 * Технология переименована в `subtract-deps`
 */
var inherit = require('inherit');

module.exports = inherit(require('./subtract-deps'), {
    getName: function () {
        return 'deps-subtract';
    },

    build: function () {
        var logger = this.node.getLogger();

        logger.logTechIsDeprecated(this._target, this.getName(),
            'enb-bem-techs', 'subtract-deps', 'enb-bem-techs', ' It will be removed from this package in v3.0.0.');
        this.__base();
    }
});
