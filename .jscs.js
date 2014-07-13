var config = require('enb-validate-code/jscs');

config.excludeFiles = [
    'node_modules',
    'exlib',
    'coverage'
];

module.exports = config;
