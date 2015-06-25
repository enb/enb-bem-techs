/**
 * Data structure to properly handle mustDeps.
 * Used internally in deps-old tech.
 *
 * @param {OldDeps} oldDeps
 * @param fn Function to be called on visited nodes
 */
module.exports = function(oldDeps, fn) {
    var nodes = {},      // collection of nodes, visited nodes are replaced with `true`
        nextDelayed = 1; // incremental id for delayed nodes

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
            var node = getNode(key);

            if (node.refCount > 0) { // node have unvisited dependencies, mark as delayed and exit
                node.delayed = nextDelayed++;
                node.args = args;
                return;
            }

            var nodesToVisit = [];
            while(true) {  // visit current node and all delayed nodes depending on it
                nodes[key] = true;
                fn.apply(oldDeps, args);
                node.backRefs.forEach(function(key) { // decrement refCoun on all nodes depending on current
                    var node = nodes[key];
                    if (--node.refCount === 0 && node.delayed) {
                        nodesToVisit.push(key); // time to visit delayed node
                    }
                });
                if (nodesToVisit.length === 0) { break }
                nodesToVisit.sort(function(a, b) { // sort by descending id
                    return nodes[b].delayed - nodes[a].delayed;
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
            var loops = [];
            while(true) {
                var earlyKey = '';
                Object.keys(nodes).forEach(function(key) {
                    var node = nodes[key];
                    if (node === true) {
                        delete nodes[key];
                    } else if (!earlyKey || node.delayed < nodes[earlyKey].delayed) {
                        earlyKey = key;
                    }
                });
                if (!earlyKey) { break }
                loops.push(cutLoop(earlyKey));
                this.visit(earlyKey, nodes[earlyKey].args);
            }
            return loops.reverse();
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

    function cutLoop(loopKey) {
        var stack = [loopKey],
            visited = {},
            loopRefs = null;
        lookup(loopKey);
        function lookup(parentKey) {
            var parentRefs = nodes[parentKey].backRefs;
            return parentRefs.some(function(key) {
                if (visited[key]) { return false; }
                visited[key] = true;
                if (key === loopKey) {
                    loopRefs = parentRefs;
                    return true;
                }
                stack.push(key);
                if (lookup(key)) {
                    return true;
                } else {
                    stack.pop();
                    return false;
                }
            });
        }
        loopRefs.splice(loopRefs.indexOf(loopKey), 1);
        nodes[loopKey].refCount--;
        return stack.reverse();
    }
};
