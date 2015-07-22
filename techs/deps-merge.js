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

        logger.logTechIsDeprecated(this._target, this.getName(), 'enb-bem-techs',
            'merge-deps', 'enb-bem-techs', ' It will be removed from this package in v3.0.0.');
        this.__base();
    }
});
