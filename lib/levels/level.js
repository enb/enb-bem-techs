var inherit = require('inherit'),
    fs = require('fs'),
    vow = require('vow'),
    path = require('path'),
    LevelBuilder = require('./level-builder');

module.exports = inherit(/** @lends Level.prototype */{
    /**
     * @constructs Level
     * @classdesc Model of level.
     *
     * @param {String} levelPath — path to level.
     * @param {Function} [schemeBuilder]
     */
    __constructor: function (levelPath, schemeBuilder) {
        this._path = levelPath;
        this.blocks = {};
        this._loadDeferred = vow.defer();
        this._schemeBuilder = schemeBuilder;
    },

    /**
     * Load level from cache.
     */
    loadFromCache: function (data) {
        this.blocks = data;
        this._loadDeferred.resolve(this);
    },

    /**
     * Returns blocks info.
     *
     * @returns {Object}
     */
    getBlocks: function () {
        return this.blocks;
    },

    /**
     * Checks whether there is a block with the specified name.
     *
     * @param {String} blockName
     * @returns {Boolean}
     */
    hasBlock: function (blockName) {
        return this.blocks[blockName];
    },

    /**
     * Returns absolute path to level.
     *
     * @returns {String}
     */
    getPath: function () {
        return this._path;
    },

    /**
     * Processes file, adds it to `blocks` filed.
     *
     * @param {String} filename
     * @param {Object} stat node.js Stat
     * @param {String} parentElementName
     * @param {String} elementName
     * @param {String} modName
     * @private
     */
    _processFile: function (filename, stat, parentElementName, elementName, modName) {
        var requiredBaseNameWithoutExt = (parentElementName ? parentElementName + '__' : '') +
                elementName + (modName ? '_' + modName : ''),
            baseName = filename.split(path.sep).slice(-1)[0],
            baseNameParts = baseName.split('.'),
            baseNameWithoutExt = stat.isDirectory() ?
                baseNameParts.slice(0, baseNameParts.length - 1).join('.') :
                baseNameParts[0],
            rl = requiredBaseNameWithoutExt.length,
            modVal,
            processFile = baseNameWithoutExt.indexOf(requiredBaseNameWithoutExt) === 0 && (
                modName ?
                    (rl === baseNameWithoutExt.length) || baseNameWithoutExt.charAt(rl) === '_' :
                    baseNameWithoutExt === requiredBaseNameWithoutExt
            );
        if (processFile) {
            var suffix = stat.isDirectory() ? baseNameParts.pop() : baseNameParts.slice(1).join('.'),
                fileInfo = {
                    name: baseName,
                    fullname: filename,
                    suffix: suffix,
                    mtime: stat.mtime.getTime(),
                    isDirectory: stat.isDirectory()
                };
            if (fileInfo.isDirectory) {
                fileInfo.files = filterFiles(fs.readdirSync(filename)).map(function (subFilename) {
                    var subFullname = path.join(filename, subFilename),
                        subStat = fs.statSync(subFullname);
                    return {
                        name: subFilename,
                        fullname: subFullname,
                        suffix: subFilename.split('.').slice(1).join('.'),
                        mtime: subStat.mtime.getTime(),
                        isDirectory: subStat.isDirectory()
                    };
                });
            }
            var blockName = parentElementName || elementName,
                block = this.blocks[blockName] || (this.blocks[blockName] = {
                    name: blockName,
                    files: [],
                    dirs: [],
                    elements: {},
                    mods: {}
                }),
                destElement;
            if (parentElementName) {
                destElement = block.elements[elementName] || (block.elements[elementName] = {
                    name: elementName,
                    files: [],
                    dirs: [],
                    mods: {}
                });
            } else {
                destElement = block;
            }
            var collectionKey = fileInfo.isDirectory ? 'dirs' : 'files';
            if (modName) {
                if (!modVal) {
                    if (rl !== baseNameWithoutExt.length) {
                        modVal = baseNameWithoutExt.substr(rl + 1);
                    } else {
                        modVal = '*';
                    }
                }
                var mod = destElement.mods[modName] || (destElement.mods[modName] = {}),
                    modValueFiles = (mod[modVal] || (mod[modVal] = { files: [], dirs: [] }))[collectionKey];
                modValueFiles.push(fileInfo);
            } else {
                destElement[collectionKey].push(fileInfo);
            }
        }
    },

    /**
     * Loads files and directories in modifier directory.
     *
     * @param {String} parentElementName
     * @param {String} elementName
     * @param {String} modName
     * @param {String} modDirPath
     * @private
     */
    _loadMod: function (parentElementName, elementName, modName, modDirPath) {
        var _this = this;
        filterFiles(fs.readdirSync(modDirPath)).forEach(function (filename) {
            var fullname = path.join(modDirPath, filename),
                stat = fs.statSync(fullname);
            _this._processFile(fullname, stat, parentElementName, elementName, modName);
        });
    },

    /**
     * Loads files and directories in element or block directory (if `parentElementName` is not specifed).
     *
     * @param {String} parentElementName
     * @param {String} elementName
     * @param {String} elementDirPath
     * @param {String} containsElements
     * @private
     */
    _loadElement: function (parentElementName, elementName, elementDirPath, containsElements) {
        var _this = this,
            requiredBaseNameWithoutExt = (parentElementName ? parentElementName + '__' : '') + elementName;
        filterFiles(fs.readdirSync(elementDirPath)).forEach(function (filename) {
            var fullname = path.join(elementDirPath, filename),
                stat = fs.statSync(fullname);
            if (stat.isDirectory()) {
                if (containsElements && filename.substr(0, 2) === '__') {
                    _this._loadElement(elementName, filename.substr(2), fullname, false);
                } else if (filename.charAt(0) === '_') {
                    _this._loadMod(parentElementName, elementName, filename.substr(1), fullname);
                } else if (filename.indexOf('.') !== -1 && filename.indexOf(requiredBaseNameWithoutExt + '.') === 0) {
                    _this._processFile(fullname, stat, parentElementName, elementName);
                } else if (containsElements) {
                    _this._loadElement(elementName, filename, fullname, false);
                }
            } else if (stat.isFile()) {
                _this._processFile(fullname, stat, parentElementName, elementName);
            }
        });
    },

    /**
     * Loads a level.
     *
     * The structure of blocks, elements and modifiers stored in `blocks` filed.
     */
    load: function () {
        var deferred = this._loadDeferred,
            promise = deferred.promise();
        if (promise.isFulfilled()) {
            return promise;
        }

        var _this = this;
        if (this._schemeBuilder) {
            var levelBuilder = new LevelBuilder();
            vow.when(this._schemeBuilder.buildLevel(this._path, levelBuilder)).then(function () {
                _this.blocks = levelBuilder.getBlocks();
                deferred.resolve(_this);
            });
        } else {
            var levelPath = this._path;
            filterFiles(fs.readdirSync(levelPath)).forEach(function (blockDir) {
                var blockDirPath = path.join(levelPath, blockDir);
                if (fs.statSync(blockDirPath).isDirectory()) {
                    _this._loadElement(null, blockDir, blockDirPath, true);
                }
            });
            deferred.resolve(this);
        }

        return promise;
    }
});

function filterFiles(filenames) {
    return filenames.filter(function (filename) {
        return filename.charAt(0) !== '.';
    });
}
