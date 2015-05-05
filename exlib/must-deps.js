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
        loops = [];      // collection of detected loops

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
            if (!from.rootRef) { from.rootRef = fromKey; }
            if (from.rootRef === to.rootRef && !to.delayed) {
                addLoop(toKey, fromKey); // connecting to node from same mustDeps chain means loop in mustDeps
                return;
            }
            if (!to.rootRef) { to.rootRef = from.rootRef; }
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
            return loops;
        }
    };

    function getNode(key) {
        return nodes[key] || (nodes[key] = {
            backRefs: [], // list of nodes depending on this one
            refCount: 0,  // number of nodes this nodes depends on
            rootRef: '',  // first node in current mustDeps chain (used for loops detection)
            delayed: 0,   // id for delayed nodes
            args: null    // argument list for delayed nodes
        });
    }

    function addLoop(fromKey, toKey) {
        lookup(toKey, [toKey]);
        function lookup(key, stack) {
            if (key === fromKey) {
                loops.push(stack.reverse().concat(fromKey));
                return false;
            }
            return nodes[key].backRefs.every(function(backKey) {
                if (nodes[backKey].rootRef !== nodes[fromKey].rootRef || stack.indexOf(backKey) > -1) { return true; }
                return lookup(backKey, stack.concat(backKey));
            });
        }
    }
};
