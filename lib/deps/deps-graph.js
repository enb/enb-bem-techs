var _ = require('lodash');
require('seedrandom');

function DepsGraph(must, should) {
    this.must = must || {};
    this.should = should || {};
}

DepsGraph.prototype.getLink = function (from, to) {
    if (this.must[from] && this.must[from][to]) { return 'must'; }
    if (this.should[from] && this.should[from][to]) { return 'should'; }
    return '';
};

DepsGraph.prototype.setLink = function (from, to, prop) {
    (this[prop][from] || (this[prop][from] = {}))[to] = true;
};

DepsGraph.prototype.toTestScheme = function () {
    var _this = this,
        blocks = {};
    _.forIn(_.extend({}, this.must, this.should), function (val, id) {
        var name = DepsGraph.idToName(id),
            block = {};
        ['must', 'should'].forEach(function (prop) {
            if (_this[prop][id]) {
                block[prop + 'Deps'] = Object.keys(_this[prop][id]).map(DepsGraph.idToName);
            }
        });
        blocks[name] = {};
        blocks[name][name + '.deps.js'] = '(' + JSON.stringify(block) + ')';
    });
    return { blocks: blocks };
};

DepsGraph.prototype.toGraphViz = function () {
    var _this = this,
        res = 'digraph G {\n';
    ['must', 'should'].forEach(function (prop) {
        Object.keys(_this[prop]).forEach(function (from) {
            var fromName = DepsGraph.idToName(from);
            Object.keys(_this[prop][from]).forEach(function (to) {
                res += '  ' + fromName + ' -> ' + DepsGraph.idToName(to) +
                    (prop === 'must' ? ' [ penwidth = 5 ]' : '') + ';\n';
            });
        });
    });
    res += '}\n';
    return res;
};

DepsGraph.random = function (nodeCnt, mustCnt, shouldCnt, seed, allowLoops) {
    if (seed) {
        Math.seedrandom(seed);
    }
    var g = new DepsGraph(),
        count = { must: mustCnt, should: shouldCnt },
        chances = {
            must: allowLoops ? _.fill(new Array(nodeCnt), nodeCnt - 1)
                : _.map(new Array(nodeCnt), function (undefinded, i) {
                    return nodeCnt - 1 - i;
                }),
            should: _.fill(new Array(nodeCnt), nodeCnt - 1)
        },
        visited = { 0: true };
    while (count.must + count.should) {
        var prop = randInt(count.must + count.should) < count.must ? 'must' : 'should',
            available = _.map(chances[prop], zeroIfNotVisited),
            chanceSum = _.sum(available);
        if (chanceSum === 0) { return null; }
        var chance = randInt(chanceSum),
            i = 0,
            j = 0;
        do {
            chance -= available[i++];
        } while (chance >= 0);
        chance = randInt(available[--i]);
        do {
            if (isLinkPossible(i, j++, allowLoops ? 'should' : prop)) { chance--; }
        } while (chance >= 0);
        setLink(i, --j, prop);
        visited[j] = true;
        count[prop]--;
    }
    function zeroIfNotVisited(chance, i) {
        return visited[i] ? chance : 0;
    }
    function isLinkPossible(from, to, prop) {
        if (from === to || g.getLink(from, to)) { return false; }
        return prop !== 'must' || from < to && g.getLink(to, from) !== 'must';
    }
    function setLink(from, to, prop) {
        g.setLink(from, to, prop);
        chances[prop][from]--;
    }
    return g;
};

DepsGraph.idToName = function (id) {
    var result = '',
        mult = 26,
        len = 1;
    while (id >= mult) {
        id -= mult;
        mult *= 26;
        len++;
    }
    while (len) {
        result = String.fromCharCode((id % 26) + 'A'.charCodeAt(0)) + result;
        id = Math.floor(id / 26);
        len--;
    }
    return result;
};

DepsGraph.nameToId = function (name) {
    var result = 0,
        mult = 1,
        len = name.length;
    while (len > 1) {
        mult *= 26;
        result += mult;
        len--;
    }
    while (name) {
        result += (name.charCodeAt(0) - 'A'.charCodeAt(0)) * mult;
        name = name.substring(1);
        mult /= 26;
    }
    return result;
};

function randInt(cap) {
    return Math.floor(Math.random() * cap);
}

module.exports = DepsGraph;
