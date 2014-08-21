var config = require('enb-validate-code/jscs');

config.excludeFiles = [
    'node_modules',
    'exlib',
    'benchmark/fixtures',
    'coverage'
];

module.exports = config;
