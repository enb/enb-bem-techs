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
var MustDeps = require('./must-deps');

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
            this._mustDepsLoops = [];
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
                            for (var modName in mods) {
                                if (!mods.hasOwnProperty(modName)) {
                                    continue;
                                }
                                modsArr.push({ mod: modName });
                                var mod = { mod: modName };
                                var modVals = mods[modName];
                                Array.isArray(modVals) ? (mod.vals = modVals) : (mod.val = modVals);
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
            var fromItems = this.items,
                itemsToSubstract = deps.items;

            for (var key in itemsToSubstract) {
                if (key && itemsToSubstract.hasOwnProperty(key)) {
                    delete fromItems[key];
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
            var selfItems = this.items,
                anotherItems = deps.items,
                newItems = {};

            for (var key in anotherItems) {
                if ((anotherItems.hasOwnProperty(key) && selfItems.hasOwnProperty(key)) || !key) {
                    newItems[key] = selfItems[key];
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
            var count = 0,
                items = this.items;

            for (var key in items) {
                items.hasOwnProperty(key) && count++;
            }

            return count;
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
         * Modified procedure use MustDeps data structure to handle such cases.
         *
         * @param {Function} fn Function accepts `item` and `ctx` arguments
         * @param {Object.<string,boolean>} visited Hash for marking visited values
         * @param {Array} [itemsByOrder]
         * @param {Object} [ctx]
         */
        forEach: function (fn, visited, itemsByOrder, ctx) {
            visited || (visited = {});
            var _this = this,
                md = MustDeps(this, fn);
            (itemsByOrder || this.items[''].shouldDeps).forEach(function (key) {
                _this._iterateItem(md, visited, key, ctx || _this.items[key]);
            });
            this._mustDepsLoops = md.getLoops();
        },

        /**
         * @param {MustDeps} mustDeps First item in series of mustDeps calls, undefined if item is in shouldDeps
         * @param {Object.<string,boolean>} visited Hash for marking visited values
         * @param {string} key Current item key
         * @param {Object} ctx
         */
        _iterateItem: function (mustDeps, visited, key, ctx) {
            if (visited[key]) { return }
            visited[key] = true;

            var _this = this,
                item = this.items[key];

            item.mustDeps.forEach(function (childKey) { // iterate mustDeps
                if (childKey === key) { return } // skip if item depends on itself
                mustDeps.addDep(key, childKey);
                _this._iterateItem(mustDeps, visited, childKey, ctx);
            });

            mustDeps.visit(key, [item, ctx]);

            item.shouldDeps.forEach(function (childKey) { // iterate shouldDeps
                _this._iterateItem(mustDeps, visited, childKey, ctx);
            });
        },

        /**
         * Вызывает map для набора зависимостей.
         *
         * @param {Function} fn
         * @returns {Array}
         */
        map: function (fn) {
            var mapped = [];
            this.forEach(function (item) {
                mapped.push(fn.call(this, item));
            });
            return mapped;
        },

        /**
         * Фильтрует зависимости, возвращает результат.
         * @param {Function} fn
         * @returns {Array}
         */
        filter: function (fn) {
            var filtered = [];
            this.forEach(function (item) {
                if (fn.call(this, item)) {
                    filtered.push(item);
                }
            });
            return filtered;
        },

        /**
         * Возвращает результат резолвинга.
         *
         * @returns {Object}
         */
        serialize: function () {
            var byTech = {};
            this.forEach(function (item, ctx) {
                var contextTech = ctx.item.tech || '';
                var itemTech = item.item.tech || '';
                var techsByTech = byTech[contextTech] || (byTech[contextTech] = {});
                var serializedItem = item.serialize();
                if (serializedItem) {
                    (techsByTech[itemTech] || (techsByTech[itemTech] = [])).push(serializedItem);
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
            var result = [];
            var deps = this.serialize();

            if (deps['']) {
                result.push('exports.deps = ' + JSON.stringify(deps[''][''], null, 4) + ';\n');
                delete deps[''][''];
            } else {
                result.push('exports.deps = [];\n');
            }

            isEmptyObject(deps) || result.push('exports.depsByTechs = ' + JSON.stringify(deps, null, 4) + ';\n');

            return result.join('');
        },

        /**
         * Возвращает результат раскрытия зависимостей.
         *
         * @returns {Object|*|*|Array}
         */
        getDeps: function () {
            var serializedData = this.serialize();
            var loops = this._mustDepsLoops;
            if (loops.length && !this.strict) {
                // В non-strict режиме, чтобы сохранить обратную совместимость,
                // нужно разрезать связи вызывающие циклы и повторно запустить алгоритм
                var items = this.items;
                loops.forEach(function (loop) {
                    var from = loop[loop.length - 1],
                        to = loop[0],
                        mustDeps = items[from].mustDeps;
                    mustDeps.splice(mustDeps.indexOf(to), 1);
                });
                serializedData = this.serialize();
                this._mustDepsLoops = loops; // восстанавливаем список циклов для вывода их в лог
            }
            return (serializedData && serializedData[''] && serializedData['']['']) || [];
        },

        /**
         * Возвращает информацию о циклических зависимостях.
         *
         * @returns {{mustDeps: Array}}
         */
        getLoops: function () {
            return {
                mustDeps: this._mustDepsLoops
            };
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
                var keys = ['tech', 'block', 'elem', 'mod', 'val'];
                var key;

                while (key = keys.shift()) {
                    if (this.item[key]) {
                        break;
                    } else {
                        ctx[key] && (this.item[key] = ctx[key]);
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
            var result = new this.__self({}, this);
            result.shouldDeps = this.shouldDeps.concat();
            result.mustDeps = this.mustDeps.concat();
            this.hasOwnProperty('key') && (result.key = this.key);
            return result;
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
            var depsTypes = ['mustDeps', 'shouldDeps'],
                depsType,
                thisDeps,
                itemDeps;

            while (depsType = depsTypes.shift()) {
                itemDeps = item[depsType] || (item[depsType] = {});
                if (thisDeps = this.item[depsType]) {
                    for (var dependency in thisDeps) {
                        if (thisDeps.hasOwnProperty(dependency)) {
                            (itemDeps[dependency] = thisDeps[dependency].extend(itemDeps[dependency]));
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

            var item = this.item;
            var key = '';

            if (item.block) {
                key += item.block;
                item.elem && (key += '__' + item.elem);
                if (item.mod) {
                    key += '_' + item.mod;
                    item.val && (key += '_' + item.val);
                }
            }
            if (item.tech) {
                key += '.' + item.tech;
            }
            return this.key = key;
        },

        /**
         * Сериализует зависимость в объект.
         *
         * @returns {Object}
         */
        serialize: function () {
            var result = {};
            var keys = ['tech', 'block', 'elem', 'mod', 'val'];
            var key;

            while (key = keys.shift()) {
                if (this.item[key]) {
                    result[key] = this.item[key];
                }
            }
            if (result.block) {
                return result;
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
        var type = typeof value;
        return type === 'string' || type === 'number';
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
