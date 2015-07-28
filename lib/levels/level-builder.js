var inherit = require('inherit'),
    fs = require('fs'),
    path = require('path'),
    vow = require('vow');

module.exports = inherit(/** @lends LevelBuilder.prototype */{
    /**
     * @constructs LevelBuilder
     * @classdesc Builder of redefinition level structure.
     * @see {@link Level}
     */
    __constructor: function () {
        this._blocks = {};
    },
    /**
     * Adds a file declaration.
     *
     * @param {String} filename
     * @param {String} blockName
     * @param {String} elemName
     * @param {String} modName
     * @param {String} modVal
     */
    addFile: function (filename, blockName, elemName, modName, modVal) {
        var baseName = filename.split(path.sep).slice(-1)[0],
            baseNameParts = baseName.split('.'),
            stat = fs.statSync(filename),
            suffix = baseNameParts.slice(1).join('.'),
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

        var block = this._blocks[blockName] || (this._blocks[blockName] = {
                name: blockName,
                files: [],
                dirs: [],
                elements: {},
                mods: {}
            }),
            destElement;
        if (elemName) {
            destElement = block.elements[elemName] || (block.elements[elemName] = {
                name: elemName,
                files: [],
                dirs: [],
                mods: {}
            });
        } else {
            destElement = block;
        }
        var collectionKey = fileInfo.isDirectory ? 'dirs' : 'files';
        if (modName) {
            var mod = destElement.mods[modName] || (destElement.mods[modName] = {}),
                modValueFiles = (mod[modVal] || (mod[modVal] = { files: [], dirs: [] }))[collectionKey];
            modValueFiles.push(fileInfo);
        } else {
            destElement[collectionKey].push(fileInfo);
        }
    },
    /**
     * Returns structure of blocks, elements and modifiers.
     *
     * @returns {Object}
     */
    getBlocks: function () {
        return this._blocks;
    },
    /**
     * Builds level.
     *
     * @returns {Promise}
     */
    build: function () {
        return vow.fulfill();
    }
});

function filterFiles(filenames) {
    return filenames.filter(function (filename) {
        return filename.charAt(0) !== '.';
    });
}
