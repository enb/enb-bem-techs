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

        logger.logTechIsDeprecated(this._target, this.getName(), 'enb-bem-techs',
            'merge-bemdecl', 'enb-bem-techs', ' It will be removed from this package in v3.0.0.');
        this.__base();
    }
});
