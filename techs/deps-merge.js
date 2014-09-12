/**
 * deps-merge
 * ==========
 *
 * Технология переименована в `merge-deps`
 */
var inherit = require('inherit');

module.exports = inherit(require('./merge-deps'), {
    getName: function () {
        return 'deps-merge';
    },

    build: function () {
        var logger = this.node.getLogger();

        logger.logTechIsDeprecated(this._target, this.getName(), 'enb-bem-techs', 'merge-deps', 'enb-bem-techs');
        this.__base();
    }
});
