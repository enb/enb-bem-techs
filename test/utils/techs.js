var proxyquire = require('proxyquire'),
    asyncRequire = require('./async-require'),
    stub = {
        'enb-require-or-eval': asyncRequire,
        'enb-async-require': asyncRequire,
        'clear-require': function () {}
    };

module.exports = {
    bemjsonToBemdecl: proxyquire('../../techs/bemjson-to-bemdecl', stub),
    depsByTechToBemdecl: proxyquire('../../techs/deps-by-tech-to-bemdecl', stub),
    deps: proxyquire('../../techs/deps', stub),
    files: proxyquire('../../techs/files', stub),
    levels: require('../../techs/levels'),
    levelsToBemdecl: proxyquire('../../techs/levels-to-bemdecl', stub),
    mergeBemdecl: proxyquire('../../techs/merge-bemdecl', stub),
    mergeDeps: proxyquire('../../techs/merge-deps', stub),
    provideDeps: proxyquire('../../techs/provide-deps', stub),
    provideBemdecl: proxyquire('../../techs/provide-bemdecl', stub),
    subtractDeps: proxyquire('../../techs/subtract-deps', stub),
};
