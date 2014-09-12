/**
 * bemdecl-provider
 * ================
 *
 * Технология переименована в `provide-bemdecl`
 */
var inherit = require('inherit');

module.exports = inherit(require('./provide-bemdecl'), {
    getName: function () {
        return 'bemdecl-provider';
    },

    build: function () {
        var logger = this.node.getLogger();

        logger.logTechIsDeprecated(this._target, this.getName(), 'enb-bem-techs', 'provide-bemdecl', 'enb-bem-techs');
        this.__base();
    }
});
