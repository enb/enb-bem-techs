/**
 * bemdecl-from-deps-by-tech
 * =========================
 *
 * Технология переименована в `deps-by-tech-to-bemdecl`
 */
var inherit = require('inherit');

module.exports = inherit(require('./deps-by-tech-to-bemdecl'), {
    getName: function () {
        return 'bemdecl-from-deps-by-tech';
    },

    build: function () {
        var logger = this.node.getLogger();

        logger.logTechIsDeprecated(this._target, this.getName(), 'enb-bem-techs',
            'deps-by-tech-to-bemdecl', 'enb-bem-techs', ' It will be removed from this package in v3.0.0.');
        this.__base();
    }
});
