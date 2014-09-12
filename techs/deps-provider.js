/**
 * deps-provider
 * =============
 *
 * Технология переименована в `provide-deps`
 */
var inherit = require('inherit');

module.exports = inherit(require('./provide-deps'), {
    getName: function () {
        return 'deps-provider';
    },

    build: function () {
        var logger = this.node.getLogger();

        logger.logTechIsDeprecated(this._target, this.getName(), 'enb-bem-techs', 'provide-deps', 'enb-bem-techs');
        this.__base();
    }
});
