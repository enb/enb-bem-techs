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

        logger.logTechIsDeprecated(this._target, this.getName(), 'enb-bem-techs',
            'provide-deps', 'enb-bem-techs', ' It will be removed from this package in v3.0.0.');
        this.__base();
    }
});
