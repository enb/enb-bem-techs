/**
 * bemdecl-merge
 * =============
 *
 * Технология переименована в `merge-bemdecl`
 */
var inherit = require('inherit');

module.exports = inherit(require('./merge-bemdecl'), {
    getName: function () {
        return 'bemdecl-merge';
    },

    build: function () {
        var logger = this.node.getLogger();

        logger.logTechIsDeprecated(this._target, this.getName(), 'enb-bem-techs', 'merge-bemdecl', 'enb-bem-techs');
        this.__base();
    }
});
