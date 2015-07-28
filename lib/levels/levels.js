var inherit = require('inherit');

module.exports = inherit(/** @lends Levels.prototype */{
    /**
     * @constructs Levels
     * @classdesc Works with list of levels.
     * @see {@link Level}
     *
     * @param {Level[]} items — levels instances.
     */
    __constructor: function (items) {
        this.items = items;
    },

    /**
     * Returns info about blocks.
     *
     * @param {String} blockName
     * @returns {Object[]}
     */
    getBlocks: function (blockName) {
        var block,
            blocks = [];
        for (var i = 0, l = this.items.length; i < l; i++) {
            block = this.items[i].blocks[blockName];
            if (block) {
                blocks.push(block);
            }
        }
        return blocks;
    },

    /**
     * Returns info about elements.
     *
     * @param {String} blockName
     * @param {String} elemName
     * @returns {Object[]}
     */
    getElems: function (blockName, elemName) {
        var block,
            elements = [];
        for (var i = 0, l = this.items.length; i < l; i++) {
            block = this.items[i].blocks[blockName];
            if (block && block.elements[elemName]) {
                elements.push(block.elements[elemName]);
            }
        }
        return elements;
    },

    /**
     * Returns files and directories for block or modifier of block.
     *
     * @param {String} blockName
     * @param {String} modName
     * @param {String} modVal
     * @returns {{files: Object[], dirs: Object[]}}
     */
    getBlockEntities: function (blockName, modName, modVal) {
        var block,
            files = [],
            dirs = [],
            blocks = this.getBlocks(blockName);

        modVal || (modVal = '*');

        for (var i = 0, l = blocks.length; i < l; i++) {
            block = blocks[i];
            if (modName) {
                var mods = block.mods[modName],
                    res = mods && (mods[modVal] || mods['*']);

                if (res) {
                    files = files.concat(res.files);
                    dirs = dirs.concat(res.dirs);
                }
            } else {
                files = files.concat(block.files);
                dirs = dirs.concat(block.dirs);
            }
        }
        return { files: files, dirs: dirs };
    },

    /**
     * Returns files and directories for element or modifier of element.
     *
     * @param {String} blockName
     * @param {String} elemName
     * @param {String} modName
     * @param {String} modVal
     * @returns {{files: Object[], dirs: Object[]}}
     */
    getElemEntities: function (blockName, elemName, modName, modVal) {
        var elem,
            files = [],
            dirs = [],
            elems = this.getElems(blockName, elemName);

        modVal || (modVal = '*');

        for (var i = 0, l = elems.length; i < l; i++) {
            elem = elems[i];
            if (modName) {
                var mods = elem.mods[modName],
                    res = mods && (mods[modVal] || mods['*']);

                if (res) {
                    files = files.concat(res.files);
                    dirs = dirs.concat(res.dirs);
                }
            } else {
                files = files.concat(elem.files);
                dirs = dirs.concat(elem.dirs);
            }
        }
        return { files: files, dirs: dirs };
    },

    /**
     * Returns files for block or modifier of block.
     *
     * @param {String} blockName
     * @param {String} modName
     * @param {String} modVal
     * @returns {Object[]}
     */
    getBlockFiles: function (blockName, modName, modVal) {
        return this.getBlockEntities(blockName, modName, modVal).files;
    },

    /**
     * Returns files for element or modifier of element.
     *
     * @param {String} blockName
     * @param {String} elemName
     * @param {String} modName
     * @param {String} modVal
     * @returns {Object[]}
     */
    getElemFiles: function (blockName, elemName, modName, modVal) {
        return this.getElemEntities(blockName, elemName, modName, modVal).files;
    },

    /**
     * Returns files by declaration.
     *
     * @param {String} blockName
     * @param {String} elemName
     * @param {String} modName
     * @param {String} modVal
     * @returns {Object[]}
     */
    getFilesByDecl: function (blockName, elemName, modName, modVal) {
        if (elemName) {
            return this.getElemFiles(blockName, elemName, modName, modVal);
        } else {
            return this.getBlockFiles(blockName, modName, modVal);
        }
    },

    /**
     * Returns files by suffix.
     *
     * @param {String} suffix
     * @returns {Object[]}
     */
    getFilesBySuffix: function (suffix) {
        var files = [];
        this.items.forEach(function (level) {
            var blocks = level.blocks;
            Object.keys(blocks).forEach(function (blockName) {
                files = files.concat(getFilesInElementBySuffix(blocks[blockName], suffix));
            });
        });
        return files;
    },

    /**
     * Returns value of block modifier.
     *
     * @param {String} blockName
     * @param {String} modName
     * @returns {String[]}
     */
    getModValues: function (blockName, modName) {
        var modVals = [];
        this.items.forEach(function (level) {
            var blockInfo = level.blocks[blockName];
            if (blockInfo && blockInfo.mods && blockInfo.mods[modName]) {
                modVals = modVals.concat(Object.keys(blockInfo.mods[modName]));
            }
        });
        return modVals;
    }
});

function getFilesInElementBySuffix(element, suffix) {
    var files = element.files.filter(function (f) { return f.suffix === suffix; }),
        mods = element.mods,
        elements = element.elements;
    Object.keys(mods).forEach(function (modName) {
        var mod = mods[modName];
        Object.keys(mod).forEach(function (modVal) {
            files = files.concat(mod[modVal].files.filter(function (f) { return f.suffix === suffix; }));
        });
    });
    if (elements) {
        Object.keys(elements).forEach(function (elemName) {
            files = files.concat(getFilesInElementBySuffix(elements[elemName], suffix));
        });
    }
    return files;
}
