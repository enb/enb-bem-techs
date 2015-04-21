/**
 * --- (C) Original BEM Tools, modified for compatibility.
 *
 * Инструментарий для раскрытия deps'ов.
 * Заимствованный.
 */

var inherit = require('inherit');
var vowFs = require('enb/lib/fs/async-fs');
var vm = require('vm');
var Vow = require('vow');

module.exports.OldDeps = (function () {
    /**
     * Класс, раскрывающий зависимости. Взят из bem-tools.
     *
     * @name OldDeps
     */
    var OldDeps = inherit({

        /**
         * Конструктор.
         *
         * @param {Array} deps блоки из bemdecl
         * @param {Boolean} strict бросать исключение при циклических mustDeps
         */
        __constructor: function (deps, strict) {
            this.items = {};
            this.itemsByOrder = [];
            this.uniqExpand = {};

            // Force adding of root item to this.items
            var rootItem = this.rootItem = new OldDepsItem({});
            this.items[rootItem.buildKey()] = rootItem;

            deps && this.parse(deps);
            this.strict = strict;
        },

        /**
         * Добавляет зависимость в коллекцию.
         *
         * @param {OldDepsItem} target
         * @param {String} depsType shouldDeps/mustDeps
         * @param {OldDepsItem} item
         */
        add: function (target, depsType, item) {
            var items = this.items;
            var targetKey = target.buildKey();
            var itemKey = item.buildKey();

            if (!items[itemKey]) {
                items[itemKey] = item;
                this.itemsByOrder.push(itemKey);
            }

            (items[targetKey] || (items[targetKey] = target))[depsType].push(itemKey);
        },

        /**
         * Удаляет зависимость из коллекции.
         *
         * @param {OldDepsItem} target
         * @param {OldDepsItem} item
         */
        remove: function (target, item) {
            target = this.items[target.buildKey()];
            var itemKey = item.buildKey();
            removeFromArray(target.shouldDeps, itemKey);
            removeFromArray(target.mustDeps, itemKey);
        },

        /**
         * Клонирует резолвер зависимостей.
         *
         * @param {OldDeps} [target]
         * @returns {OldDeps}
         */
        clone: function (target) {
            target || (target = new this.__self());

            var items = this.items;
            for (var i in items) {
                if (!items.hasOwnProperty(i)) {
                    continue;
                }
                target.items[i] = items[i].clone();
            }

            target.itemsByOrder = this.itemsByOrder.concat();
            target.tech = this.tech;
            target.uniqExpand = this.uniqExpand;

            return target;
        },

        /**
         * Разбирает bemdecl.
         *
         * @param {Array} deps
         * @param {Object} [ctx]
         * @param {Function} [fn]
         * @returns {OldDeps}
         */
        parse: function (deps, ctx, fn) {
            fn || (fn = function (i) { this.add(this.rootItem, 'shouldDeps', i); });

            var _this = this;

            var forEachItem = function (type, items, ctx) {
                    items && !isEmptyObject(items) && (Array.isArray(items) ? items : [items]).forEach(function (item) {

                        if (isSimple(item)) {
                            var i = item;
                            (item = {})[type] = i;
                        }
                        item.name && (item[type] = item.name);

                        var depsItem = new OldDepsItem(item, ctx);

                        if (Array.isArray(item.elem)) {
                            //add only elems and not block
                            forEachItem('elem', item.elem, depsItem);
                        } else {
                            fn.call(_this, depsItem); // _this.add(rootItem, 'shouldDeps', depsItem);
                        }

                        _this.parse(
                            item.mustDeps,
                            depsItem,
                            function (i) { this.add(depsItem, 'mustDeps', i); });

                        _this.parse(
                            item.shouldDeps,
                            depsItem,
                            function (i) { this.add(depsItem, 'shouldDeps', i); });

                        _this.parse(
                            item.noDeps,
                            depsItem,
                            function (i) { this.remove(depsItem, i); });

                        forEachItem('elem', item.elems, depsItem);

                        var mods = item.mods;
                        if (mods && !Array.isArray(mods)) { // Object
                            var modsArr = [];
                            for (var m in mods) {
                                if (!mods.hasOwnProperty(m)) {
                                    continue;
                                }
                                modsArr.push({ mod: m });
                                var mod = { mod: m };
                                var v = mods[m];
                                Array.isArray(v) ? (mod.vals = v) : (mod.val = v);
                                modsArr.push(mod);
                            }
                            mods = modsArr;
                        }
                        forEachItem('mod', mods, depsItem);

                        forEachItem('val', item.vals, depsItem);

                    });
                };

            forEachItem('block', deps, ctx);

            return this;
        },

        /**
         * Раскрывает зависимости, используя deps.js-файлы.
         *
         * @param {Object} tech
         * @returns {Promise}
         */
        expandByFS: function (tech) {

            this.tech = tech;

            var _this = this;
            var depsCount1 = this.getCount();
            var depsCount2;

            return Vow.when(this.expandOnceByFS())
                .then(function again(newDeps) {

                    depsCount2 = newDeps.getCount();
                    if (depsCount1 !== depsCount2) {
                        depsCount1 = depsCount2;
                        return Vow.when(newDeps.expandOnceByFS(), again);
                    }

                    return newDeps.clone(_this);

                });

        },

        /**
         * Раскрывает зависимости, используя deps.js-файлы без повторений.
         *
         * @returns {Promise}
         */
        expandOnceByFS: function () {

            var newDeps = this.clone();
            var items = this.filter(function (item) {
                return !newDeps.uniqExpand.hasOwnProperty(item.buildKey());
            });

            function keepWorking(item) {
                newDeps.uniqExpand[item.buildKey()] = true;
                return newDeps.expandItemByFS(item).then(function () {
                    if (items.length > 0) {
                        return keepWorking(items.shift());
                    } else {
                        return null;
                    }
                });
            }

            if (items.length > 0) {
                return keepWorking(items.shift()).then(function () {
                    return newDeps;
                });
            } else {
                return Vow.fulfill(newDeps);
            }
        },

        /**
         * Раскрывает одну зависимость, используя deps.js-файлы.
         *
         * @param {OldDepsItem} item
         * @returns {Promise}
         */
        expandItemByFS: function (item) {

            var _this = this;
            var tech = this.tech;

            var files = tech.levels.getFilesByDecl(item.item.block, item.item.elem, item.item.mod, item.item.val)
                .filter(function (file) {
                    return file.suffix === 'deps.js';
                });

            var promise = Vow.fulfill();

            files.forEach(function (file) {
                promise = promise.then(function () {
                    return vowFs.read(file.fullname, 'utf8').then(function (content) {
                        try {
                            _this.parse(vm.runInThisContext(content, file.fullname), item);
                        } catch (e) {
                            throw new Error('Syntax error in file "' + file.fullname + '": ' + e.message);
                        }
                    });
                });
            });

            return promise;
        },

        /**
         * Вычитает зависимости из переданного OldDeps.
         *
         * @param {OldDeps} deps
         * @returns {OldDeps}
         */
        subtract: function (deps) {
            var items1 = this.items;
            var items2 = deps.items;

            for (var k in items2) {
                if (k && items2.hasOwnProperty(k)) {
                    delete items1[k];
                }
            }
            return this;
        },

        /**
         * Сохраняет пересечение с другим OldDeps.
         *
         * @param {OldDeps} deps
         * @returns {OldDeps}
         */
        intersect: function (deps) {
            var items1 = this.items;
            var items2 = deps.items;
            var newItems = {};

            for (var k in items2) {
                if ((items2.hasOwnProperty(k) && items1.hasOwnProperty(k)) || !k) {
                    newItems[k] = items1[k];
                }
            }

            this.items = newItems;

            return this;
        },

        /**
         * Возвращает количество зависимостей.
         *
         * @returns {Number}
         */
        getCount: function () {
            var res = 0;
            var items = this.items;

            for (var k in items) {
                items.hasOwnProperty(k) && res++;
            }

            return res;
        },

        /**
         * Итерирует по набору зависимостей.
         *
         * @param {Function} fn
         * @param {Object} [uniq]
         * @param {Array} [itemsByOrder]
         * @param {Object} [ctx]
         */
        forEach: function (fn, uniq, itemsByOrder, ctx) {
            uniq || (uniq = {});
            var _this = this;
            (itemsByOrder || this.items[''].shouldDeps).forEach(function (i) {
                var item = _this.items[i];
                _this._iterateItem(fn, uniq, item, ctx || item, null);
            });
        },

        /**
         * Iterate through item dependencies
         *
         * Modification of `forEach` procedure from bem-tools with these goals in mind:
         *  - To produce same order of deps as original procedure when possible.
         *  - To fix wrong deps order in certain cases.
         *  - To detect loops in mustDeps.
         *
         * Original procedure was very simple:
         *  - For each deps node (block/element/modifier), visit its mustDeps recursively,
         *  then node itself, then shouldDeps.
         *  - Node can be in one of two states:
         *    1) not visited
         *    2) visited
         *  - Node is skipped if it is already in visited state.
         *  - Node is marked as visited before traversing mustDeps.
         *
         * Unfortunately, this solution has a flaw. There are cases in which it produces wrong deps order.
         * Consider the following traversal chain:
         * A --mustDeps--> B --shouldDeps--> C --mustDeps--> A
         * In this case mustDeps of C will be skipped because A is marked as visited.
         * As a result C will occur in the resulting deps before A.
         *
         * Modified procedure is more complex:
         *  - Node can be in one of three states:
         *    1) not visited
         *    2) visited
         *    3) traversing mustDeps for this node, node is not yet visited
         *  - While traversing mustDeps, procedure know the first node in mustDeps chain (mustDeps root).
         *  - For each node in third state (mustDeps in progress) procedure also maintains a list of mustDeps roots,
         *  depending on this node.
         *  - Node C is added to this list for node A if
         *    - node A encountered during mustDeps traversal
         *    - node A is in third state
         *    - node C is current mustDeps root.
         *  This means that there is a traversal chain
         *  A --mustDeps--> ... --shouldDeps--> C --mustDeps--> ... --mustDeps--> A
         *  In this case all nodes starting from C should be visited only after A will be visited.
         *  To achieve this, C is put into the mustDeps root list for A and nodes from C to A are not marked as visited.
         *  - After finishing with mustDeps, procedure is looping through collected mustDeps root list for current node
         *  restarting procedure for each of them.
         *
         *  This guarantees correct order of deps.
         *
         * @param {Function} fn Function accepts `item` argument
         * @param {Object.<string,boolean|String[]>} progress Hash with progress status for items. Possible values:
         *  - undefined: item is not visited
         *  - true: item is visited
         *  - String[]: iterating mustDeps for item. Array contains keys for items which depends
         *  on current item and should be re-iterated after it
         * @param {Object} item Current item
         * @param {Object} ctx
         * @param {Object} [mustDepsRoot] First item in series of mustDeps calls, undefined if item is in shouldDeps
         * @returns boolean Do we need to rollback current mustDeps chain
         */
        _iterateItem: function (fn, progress, item, ctx, mustDepsRoot) {
            var _this = this;
            var key = item.buildKey();

            if (progress[key] === true) { return false; } // skip already iterated item
            if (Array.isArray(progress[key])) { // this item mustDeps iteration in progress
                if (!mustDepsRoot) { return false; } // skip if this item in shouldDeps
                switch (progress[key].indexOf(mustDepsRoot)) {
                    case 0: // loop in mustDeps found, show warning or throw the exception
                        this._handleCircularMustDeps(key);
                        return false;
                    case -1: // remember to re-iterate current mustDeps chain later, rollback
                        progress[key].push(mustDepsRoot);
                }
                return true;
            }

            progress[key] = [mustDepsRoot || key];
            var rollback = item.mustDeps.reduce(function (rollback, i) { // iterate mustDeps
                var item = _this.items[i];
                if (item.buildKey() === key) { return rollback; } // skip if item depends on itself
                return _this._iterateItem(fn, progress, item, ctx, mustDepsRoot || key) || rollback;
            }, false);

            if (!rollback) {
                fn.call(this, item, ctx); // iterate item
                var delayedDeps = progress[key].slice(1);
                progress[key] = true;
                delayedDeps.forEach(function (i) { // iterate items which depends on current item
                    _this._iterateItem(fn, progress, _this.items[i], ctx);
                });
            }

            item.shouldDeps.forEach(function (i) { // iterate shouldDeps
                _this._iterateItem(fn, progress, _this.items[i], ctx);
            });

            if (rollback) { delete progress[key]; }
            return rollback;
        },

        _handleCircularMustDeps: function (loopKey) {
            var _this = this;
            function visit(key, stack) {
                var item = _this.items[key];
                if (!item) { return; }
                return item.mustDeps.every(function (i) {
                    if (i === key) { return true; }
                    if (i === loopKey) {
                        var message = 'Circular mustDeps: ' + stack.concat(i).join(' <- ');
                        if (_this.strict) {
                            throw new Error(message);
                        } else {
                            console.error(message);
                            return false;
                        }
                    }
                    return visit(i, stack.concat(i));
                });
            }
            visit(loopKey, [loopKey]);
        },

        /**
         * Вызывает map для набора зависимостей.
         *
         * @param {Function} fn
         * @returns {Array}
         */
        map: function (fn) {
            var res = [];
            this.forEach(function (item) {
                res.push(fn.call(this, item));
            });
            return res;
        },

        /**
         * Фильтрует зависимости, возвращает результат.
         * @param {Function} fn
         * @returns {Array}
         */
        filter: function (fn) {
            var res = [];
            this.forEach(function (item) {
                if (fn.call(this, item)) {
                    res.push(item);
                }
            });
            return res;
        },

        /**
         * Возвращает результат резолвинга.
         *
         * @returns {Object}
         */
        serialize: function () {
            var byTech = {};
            this.forEach(function (item, ctx) {
                var t1 = ctx.item.tech || '';
                var t2 = item.item.tech || '';
                var techsByTech = byTech[t1] || (byTech[t1] = {});
                var i = item.serialize();
                if (i) {
                    (techsByTech[t2] || (techsByTech[t2] = [])).push(i);
                }
            });
            return byTech;
        },

        /**
         * Сериализует в строку.
         *
         * @returns {String}
         */
        stringify: function () {
            var res = [];
            var deps = this.serialize();

            if (deps['']) {
                res.push('exports.deps = ' + JSON.stringify(deps[''][''], null, 4) + ';\n');
                delete deps[''][''];
            } else {
                res.push('exports.deps = [];\n');
            }

            isEmptyObject(deps) || res.push('exports.depsByTechs = ' + JSON.stringify(deps, null, 4) + ';\n');

            return res.join('');
        },

        /**
         * Возвращает результат раскрытия зависимостей.
         *
         * @returns {Object|*|*|Array}
         */
        getDeps: function () {
            var serializedData = this.serialize();
            return (serializedData && serializedData[''] && serializedData['']['']) || [];
        }

    });

    /**
     * Элемент зависимостей.
     *
     * @name OldDepsItem
     */
    var OldDepsItem = inherit({

        __constructor: function (item, ctx) {
            this.shouldDeps = [];
            this.mustDeps = [];
            this.item = {};
            this.extendByCtx({ item: item });
            this.extendByCtx(ctx);
        },

        /**
         * Раскрывает зависимости.
         *
         * @param {Object} ctx
         * @returns {OldDepsItem}
         */
        extendByCtx: function (ctx) {
            if (ctx && (ctx = ctx.item)) {
                var ks = ['tech', 'block', 'elem', 'mod', 'val'];
                var k;

                while (k = ks.shift()) {
                    if (this.item[k]) {
                        break;
                    } else {
                        ctx[k] && (this.item[k] = ctx[k]);
                    }
                }
            }
            return this;
        },

        /**
         * Возвращает копию.
         *
         * @returns {OldDepsItem}
         */
        clone: function () {
            var res = new this.__self({}, this);
            res.shouldDeps = this.shouldDeps.concat();
            res.mustDeps = this.mustDeps.concat();
            this.hasOwnProperty('key') && (res.key = this.key);
            return res;
        },

        /**
         * Расширяет зависимость.
         *
         * @param {OldDepsItem} item
         * @returns {OldDepsItem}
         */
        extend: function (item) {
            if (!item) {
                return this;
            }
            var ds = ['mustDeps', 'shouldDeps'];
            var d;
            var thisDeps;
            var itemDeps;
            while (d = ds.shift()) {
                itemDeps = item[d] || (item[d] = {});
                if (thisDeps = this.item[d]) {
                    for (var k in thisDeps) {
                        if (thisDeps.hasOwnProperty(k)) {
                            if (!thisDeps[k].extend) {
                                throw 'bla'; // FIXME: WTF?
                            }
                            (itemDeps[k] = thisDeps[k].extend(itemDeps[k]));
                        }
                    }
                }
            }
            return item;
        },

        /**
         * Записывает зависимость в кэш по ключу.
         *
         * @param {Object} cache
         * @returns {OldDepsItem}
         */
        cache: function (cache) {
            var key = this.buildKey();
            return cache[key] = this.extend(cache[key]);
        },

        /**
         * Строит ключ для зависимости.
         *
         * @returns {String}
         */
        buildKey: function () {
            if ('key' in this) {
                return this.key;
            }

            var i = this.item;
            var k = '';

            if (i.block) {
                k += i.block;
                i.elem && (k += '__' + i.elem);
                if (i.mod) {
                    k += '_' + i.mod;
                    i.val && (k += '_' + i.val);
                }
            }
            if (i.tech) {
                k += '.' + i.tech;
            }
            return this.key = k;
        },

        /**
         * Сериализует зависимость в объект.
         *
         * @returns {Object}
         */
        serialize: function () {
            var res = {};
            var ks = ['tech', 'block', 'elem', 'mod', 'val'];
            var k;

            while (k = ks.shift()) {
                if (this.item[k]) {
                    res[k] = this.item[k];
                }
            }
            if (res.block) {
                return res;
            }
        }

    });

    exports.DepsItem = OldDepsItem;

    /**
     * Возвращает true при String/Number.
     * @param {*} value
     * @returns {Boolean}
     */
    function isSimple(value) {
        var t = typeof value;
        return t === 'string' || t === 'number';
    }

    /**
     * Хэлпер для удаления значений из массива.
     * Возвращает true в случае успеха.
     *
     * @param {Array} arr
     * @param {*} value
     * @returns {Boolean}
     */
    function removeFromArray(arr, value) {
        var i = arr.indexOf(value);
        if (i >= 0) {
            arr.splice(i, 1);
            return true;
        } else {
            return false;
        }
    }

    /**
     * Возвращает true, если переданный объект пуст.
     * @param {Object} obj
     * @returns {Boolean}
     */
    function isEmptyObject(obj) {
        for (var i in obj) {
            return false;
        }
        return true;
    }

    return OldDeps;
})();
