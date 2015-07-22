/**
 * bemdecl-from-bemjson
 * ====================
 *
 * Технология переименована в `bemjson-to-bemdecl`
 */
var inherit = require('inherit');

module.exports = inherit(require('./bemjson-to-bemdecl'), {
    getName: function () {
        return 'bemdecl-from-bemjson';
    },

    build: function () {
        var logger = this.node.getLogger();

        logger.logTechIsDeprecated(this._target, this.getName(),
            'enb-bem-techs', 'bemjson-to-bemdecl', 'enb-bem-techs', ' It will be removed from this package in v3.0.0.');
        this.__base();
    }
});
