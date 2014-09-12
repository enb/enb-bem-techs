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

        logger.logTechIsDeprecated(this._target, this.getName(), 'enb-bem-techs', 'subtract-deps', 'enb-bem-techs');
        this.__base();
    }
});
