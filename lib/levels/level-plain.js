var bemNaming = require('bem-naming'),
    vow = require('vow'),
    path = require('path'),
    fs = require('fs');

/**
 * Plain scheme for level.
 *
 * @namespace level-plain
 * @see {@link Level}
 */
module.exports = {
    buildLevel: function (levelPath, levelBuilder) {
        return vow.when(addPlainFiles(levelPath, levelBuilder)).then(function () {
            levelBuilder.build();
        });
    },

    buildFilePath: function (levelPath, blockName, elemName, modName, modVal) {
        return path.join(levelPath, blockName) +
            (elemName ? '__' + elemName : '') +
            (modName ? '_' + modName : '') +
            (modVal ? '_' + modVal : '');
    }
};

function addPlainFiles(directory, levelBuilder) {
    filterFiles(fs.readdirSync(directory)).forEach(function (filename) {
        var fullname = path.join(directory, filename),
            stat = fs.statSync(fullname),
            bem;
        if (stat.isDirectory()) {
            if (filename.indexOf('.') !== -1) {
                bem = parseFilename(filename);
                levelBuilder.addFile(fullname, bem.block, bem.elem, bem.modName, bem.modVal);
            } else {
                addPlainFiles(fullname, levelBuilder);
            }
        } else {
            bem = parseFilename(filename);
            levelBuilder.addFile(fullname, bem.block, bem.elem, bem.modName, bem.modVal);
        }
    });
}

function filterFiles(filenames) {
    return filenames.filter(function (filename) {
        return filename.charAt(0) !== '.';
    });
}

function parseFilename(filename) {
    return bemNaming.parse(filename.split('.')[0]);
}
