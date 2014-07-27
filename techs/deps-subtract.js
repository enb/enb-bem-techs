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

        logger.logTechIsDeprecated(this._target, this.getName(), 'enb-bem', 'subtract-deps');
        this.__base();
    }
});
