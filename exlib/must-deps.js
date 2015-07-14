/**
 * Data structure to properly handle mustDeps.
 * Used internally in deps-old tech.
 *
 * @param {OldDeps} oldDeps
 * @param fn Function to be called on visited nodes
 */
module.exports = function(oldDeps, fn) {
    var nodes = {},      // collection of nodes, visited nodes are replaced with `true`
        nextDelayed = 1, // incremental id for delayed nodes
        loops;

    return {
        /**
         * Add dependency between nodes with given keys
         * @param {string} fromKey
         * @param {string} toKey
         */
        addDep: function(fromKey, toKey) {
            var to = getNode(toKey);
            if (to === true) { return }
            var from = getNode(fromKey);
            to.backRefs.push(fromKey);
            from.refCount++;
        },

        /**
         * Invoke function on given node, or delay invocation if node has dependencies which are not visited.
         *
         * Each node knows who depend on it (`backRefs`) and on how many nodes it depend (`refCount`).
         * When `refCount === 0` it is safe to call function on the node, remove it from the graph
         * and decrease `refCount` on all depending nodes.
         * When `refCount > 0`, node is marked as delayed and assigned an incremental id.
         * Node with lowest id will be visited after it `refCount` drop to zero.
         *
         * @param {string} key
         * @param {Object[]} args
         */
        visit: function(key, args) {
            var node = getNode(key),
                nodesToVisit = [];

            if (node.refCount > 0) { // node have unvisited dependencies, mark as delayed and exit
                node.delayed = nextDelayed++;
                node.args = args;
                return;
            }

            while(true) {  // visit current node and all delayed nodes depending on it
                nodes[key] = true;
                fn.apply(oldDeps, args);
                node.backRefs.forEach(function(key) { // decrement refCoun on all nodes depending on current
                    var node = nodes[key];
                    node.refCount--;
                    if (node.refCount === 0 && node.delayed) {
                        nodesToVisit.push(key); // time to visit delayed node
                    }
                });
                if (nodesToVisit.length === 0) { break }
                nodesToVisit.sort(function(first, second) { // sort by descending id
                    return nodes[second].delayed - nodes[first].delayed;
                });
                key = nodesToVisit.pop(); // pick node with smallest delayed id
                node = nodes[key];
                args = node.args;
            }
        },

        /**
         * Return array of mustDeps loops found.
         *
         * @returns {string[][]}
         */
        getLoops: function() {
            if (loops) {
                return loops;
            }

            loops = [];
            var keys = Object.keys(nodes);

            while(true) {
                keys = keys.filter(function(key) {
                    return nodes[key] !== true;
                }).sort(function(first, second) { // sort by descending id
                    return nodes[second].delayed - nodes[first].delayed;
                });
                if (keys.length === 0) { break; }
                var earlyKey = keys[keys.length - 1];
                while(true) {
                    var loop = findLoop(earlyKey);
                    if (!loop) {
                        keys.pop();
                        break;
                    }
                    loops.push(loop);
                    var loopRefs = nodes[loop[0]].backRefs;
                    loopRefs.splice(loopRefs.indexOf(earlyKey), 1);
                    nodes[earlyKey].refCount--;
                    if (nodes[earlyKey].refCount === 0) {
                        this.visit(earlyKey, nodes[earlyKey].args);
                        break;
                    }
                }
            }
            return loops;
        }
    };

    function getNode(key) {
        return nodes[key] || (nodes[key] = {
            backRefs: [], // list of nodes depending on this one
            refCount: 0,  // number of nodes this nodes depends on
            delayed: 0,   // id for delayed nodes
            args: null    // argument list for delayed nodes
        });
    }

    function findLoop(loopKey) {
        var visited = {},
            stack = null;
        function lookup(parentKey) {
            return nodes[parentKey].backRefs.some(function(key) {
                if (visited[key]) { return false; }
                visited[key] = true;
                if (key === loopKey) {
                    stack = [];
                    return true;
                }
                if (!lookup(key)) { return false; }
                stack.push(key);
                return true;
            });
        }
        if (!lookup(loopKey)) { return null; }
        stack.push(loopKey);
        return stack;
    }
};
