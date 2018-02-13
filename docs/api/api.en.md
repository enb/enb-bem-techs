Technologies API
==============

The package includes the following technologies:

* [levels](#levels)
* [levelsToBemdecl](#levelstobemdecl)
* [bemjsonToBemdecl](#bemjsontobemdecl)
* [deps](#deps)
* [depsOld](#depsold)
* [depsByTechToBemdecl](#depsbytechtobemdecl)
* [files](#files)
* [provideBemdecl](#providebemdecl)
* [provideDeps](#providedeps)
* [mergeBemdecl](#mergebemdecl)
* [mergeDeps](#mergedeps)
* [subtractDeps](#subtractdeps)

levels
------

Collects information about BEM entities on redefinition levels. These results are used by the following technologies:

* [levelsToBemdecl](#levelstobemdecl)
* [deps](#deps)
* [depsOld](#depsold)
* [files](#files)

The information is represented as an instance of the [Levels](../../lib/levels/levels.js) class.

### Options

* [target](#target)
* [levels](#levels-1)

#### target

Type: `String`. Default: `?.levels`.

The name of the target file for saving the result of scanning the redefinition levels.

#### levels

Type: `String[] | Object[]`.

A list of paths to the redefinition levels.

Each path can be either absolute or relative to the project root.

Instead of a string, an object can be used: `{ path: 'path/to/level', check: false }`.
The `path` field is required, and the `check` field is set to `true` by default.

Possible values of the `check` field:

* `false` — Used for caching the level content.
* `true` — The level will be rescanned during each build, whether there is a cache or not.

--------------------------------------

**Example**


```js
var bemTechs = require('enb-bem-techs');

module.exports = function (config) {
    config.node('bundle', function (node) {
        node.addTech([bemTechs.levels, {
            levels: [
                // You don't have to change the code of external libraries in the project.
                // Just scan their levels once and use the cache.
                { path: 'libs/bem-core/common.blocks', check: false },
                { path: 'libs/bem-core/desktop.blocks', check: false },

                // You need to scan the project levels before each build.
                { path: 'desktop.blocks', check: true },
            ]
        }]);
        node.addTarget('?.levels');
    });
}
```

levelsToBemdecl
---------------

Generates a BEMDECL file consisting of all BEM entities found on the specified levels.

### Options

* [source](#source)
* [target](#target-1)
* [bemdeclFormat](#bemdeclformat)

#### source

Type: `String`. Default: `?.levels`.

The name of the target for accessing the result of scanning the redefinition levels ([Levels](../../lib/levels/levels.js)). Information about the redefinition levels is provided by the [levels](#levels) technology.

#### target

Type: `String`. Default: `? .bemdecl.js`.

The name of the file for saving the BEMDECL file with all BEM entities found in the redefinition levels.

#### bemdeclFormat

Type: `String`. Default: `bemdecl`.

Format of the resulting declaration. Possible values:

* `bemdecl` — The standard BEMDECL format.

   Example

   ```js
   { blocks: [{ name: 'b', elems: [{ name: 'e', mods: [{ name: 'm', vals: [{ name: 'v' }] }] }] }]}
   ```

* `deps` — The format of the `deps` and `depsOld` results.

   Example

   ```js
   { deps: [{ block: 'b', elem: 'e', mod: 'm', val: 'v' }] }
   ```

--------------------------------------

**Example**

```js
var bemTechs = require('enb-bem-techs');

module.exports = function (config) {
    config.node('bundle', function (node) {
        node.addTechs([
            // Scan the project levels.
            // Write the result in `?.levels`,
            // because the `target` option is set to `?.levels` by default.
            [bemTechs.levels, { levels: ['blocks'] }],

            // Make a BEMDECL file from the result of level scanning.
            // Use introspection from `?.levels`,
            // because the `source` option is set to `?.levels` by default.
            [bemTechs.levelsToBemdecl]
        ]);
        node.addTarget('?.bemdecl.js');
    });
};
```

bemjsonToBemdecl
----------------

Generates a BEMDECL file from the [BEMJSON](https://www.bem.info/technology/bemjson/) file.

### Options

* [source](#source-1)
* [target](#target-2)
* [bemdeclFormat](#bemdeclformat-1)

#### source

Type: `String`. Default: `?.bemjson.js`.

The name of the [BEMJSON](https://ru.bem.info/technology/bemjson/) file to build the declaration from.

#### target

Type: `String`. Default: `? .bemdecl.js`.

The name of the BEMDECL file being created.

#### bemdeclFormat

Type: `String`. Default: `bemdecl`.

Format of the resulting declaration. Possible values:

* `bemdecl` — The standard BEMDECL format.

   Example

   ```js
   { blocks: [{ name: 'b', elems: [{ name: 'e', mods: [{ name: 'm', vals: [{ name: 'v' }] }] }] }]}
   ```

* `deps` — The format of the `deps` and `depsOld` results.

   Example

   ```js
   { deps: [{ block: 'b', elem: 'e', mod: 'm', val: 'v' }] }
   ```

--------------------------------------

**Example**

```js
var bemTechs = require('enb-bem-techs'),
    FileProviderTech = require('enb/techs/file-provider');

module.exports = function (config) {
    config.node('bundle', function (node) {
        node.addTechs([
            // Provides the manually created BEMJSON file for ENB.
            // The `target` option contains the name of the BEMJSON file.
            [FileProviderTech, { target: '?.bemjson.js' }],

            // Create a BEMDECL file from the received BEMJSON file.
            // Take the BEMJSON file from `?.bemjson.js`,
            //because the `source` option is set to `?.bemjson.js` by default.
            [bemTechs.bemjsonToBemdecl]
        ]);
        node.addTarget('?.bemdecl.js');
    });
};
```

deps
----

Completes the BEM entities declaration based on information from the dependency technologies (`deps.js` or `deps.yaml`).

### Options

* [target](#target-3)
* [bemdeclFile](#bemdeclfile)
* [levelsTarget](#levelstarget)

#### target

Type: `String`. Default: `?.deps.js`.

The name of the file to build with the extended and ordered declaration of BEM entities.

#### bemdeclFile

Type: `String`. Default: `? .bemdecl.js`.

The name of the file with the original declaration of BEM entities.

#### levelsTarget

Type: `String`. Default: `?.levels`.

The name of the target for accessing the result of scanning the redefinition levels ([Levels](../../lib/levels/levels.js)). Information about the redefinition levels is provided by the [levels](#levels) technology.

--------------------------------------

**Example**

Resolving dependencies using the BEMDECL file.

```js
var bemTechs = require('enb-bem-techs');

module.exports = function (config) {
    config.node('bundle', function (node) {
        node.addTech([bemTechs.deps, {
            bemdeclFile: '?.bemdecl.js',
            target: '?.deps.js'
        }]);
        node.addTarget('?.deps.js');
    });
};
```

Resolving dependencies using the DEPS file.

```js
var bemTechs = require('enb-bem-techs');

module.exports = function (config) {
    config.node('bundle', function (node) {
        node.addTech([bemTechs.deps, {
            bemdeclFile: 'source-decl.deps.js',
            target: '?.deps.js'
        }]);
        node.addTarget('?.deps.js');
    });
};
```

depsOld
-------

Extends the declaration of BEM entities based on the dependency technology (`deps.js`).

Uses the algorithm from [bem-tools](https://en.bem.info/tools/bem/bem-tools/).

### Options

* [target](#target-4)
* [bemdeclFile](#bemdeclfile-1)
* [levelsTarget](#levelstarget-1)

#### target

Type: `String`. Default: `?.deps.js`.

The name of the file to build with the extended and ordered declaration of BEM entities.

#### bemdeclFile

Type: `String`. Default: `? .bemdecl.js`.

The name of the file with the original declaration of BEM entities.

#### levelsTarget

Type: `String`. Default: `?.levels`.

The name of the target for accessing the result of scanning the redefinition levels ([Levels](../../lib/levels/levels.js)). Information about the redefinition levels is provided by the [levels](#levels) technology.

#### strict

Type: `Boolean`. Default: `false`.

Turns on a strict resolve mode. If a `mustDeps` circular dependency (A ← B ← A) is found, the build is interrupted with an error.

--------------------------------------

**Example**

Resolving dependencies using the BEMDECL file.

```js
var bemTechs = require('enb-bem-techs');

module.exports = function (config) {
    config.node('bundle', function (node) {
        node.addTech([bemTechs.depsOld, {
            bemdeclFile: '?.bemdecl.js',
            target: '?.deps.js'
        }]);
        node.addTarget('?.deps.js');
    });
};
```

Resolving dependencies using the DEPS file.

```js
var bemTechs = require('enb-bem-techs');

module.exports = function (config) {
    config.node('bundle', function (node) {
        node.addTech([bemTechs.depsOld, {
            bemdeclFile: 'source-decl.deps.js',
            target: '?.deps.js'
        }]);
        node.addTarget('?.deps.js');
    });
};
```

depsByTechToBemdecl
-------------------

Generates a BEMDECL file using technology-specific dependencies (depsByTech). Such dependencies are described in the `deps.js`technologies.

### Options

* [target](#target-5)
* [sourceTech](#sourcetech)
* [destTech](#desttech)
* [filesTarget](#filestarget)
* [sourceSuffixes](#sourcesuffixes)
* [bemdeclFormat](#bemdeclformat-2)

#### target

Type: `String`. Default: `? .bemdecl.js`.

The name of the BEMDECL file being created.

#### sourceTech

Type: `String`. Required option.

The name of the technology to build dependencies for.

#### destTech

Type: `String`.

The name of the technology that ` sourceTech` depends on.

#### filesTarget

Type: `String`. Default: `?.files`.

The name of the target for accessing the list of `deps.js`  source files for the build. The file list is provided by the [files](#files) technology.

#### sourceSuffixes

Type: `String[]`. Default: `['deps.js']`.

Suffixes of files to use for filtering source files of dependencies for the build.

#### bemdeclFormat

Type: `String`. Default: `bemdecl`.

Format of the resulting declaration. Possible values:

* `bemdecl` — The standard BEMDECL format.

   Example

   ```js
   { blocks: [{ name: 'b', elems: [{ name: 'e', mods: [{ name: 'm', vals: [{ name: 'v' }] }] }] }]}
   ```

* `deps` — The format of the `deps` and `depsOld` results.

   Example

   ```js
   { deps: [{ block: 'b', elem: 'e', mod: 'm', val: 'v' }] }
   ```

--------------------------------------

**Example**

A frequent case when a BEM entity in the client JavaScript technology uses its own template technology.

`button.deps.js`

```js
{
    block: 'button'
    tech: 'js'          // sourceTech
    shouldDeps: {
        tech: 'bemhtml' // destTech
    }
}
```

In most cases, using `depsByTech` to build the BEMDECL file looks like this:

```
(BEMJSON ->) BEMDECL (1) -> deps (2) -> files (3) -> BEMDECL (4)
```

1. Get the BEMDECL file (?.bemdecl.js).
2. Extend the BEM entities declaration from the BEMDECL file and write the result in the DEPS file (?.deps.js).
3. Get the ordered list of `deps.js`  files (?.files.js).
4. Get the BEMDECL file from dependencies by technology (?.tech.bemdecl.js).

```js
var bemTechs = require('enb-bem-techs'),
    FileProviderTech = require('enb/techs/file-provider');

module.exports = function (config) {
    config.node('bundle', function () {
        node.addTechs([
            [bemTechs.levels, { levels: ['blocks'] }],
            [FileProviderTech, { target: '?.bemdecl.js' }], // (1) `?.bemdecl.js`
            [bemTechs.deps],                          // (2) `?.deps.js`
            [bemTechs.files],                         // (3) `?.files.js`
            //  Later, '?.bemhtml.bemdecl.js' can be used to build templates
            // that are used in the client JavaScript.
            // The list of `deps.js` files is taken from `?.files` because the filesTarget option is set to
            // `?.files` by default.
            [bemTechs.depsByTechToBemdecl, {          // (4) `?.bemhtml.bemdecl.js`
                target: '?.bemhtml.bemdecl.js',
                sourceTech: 'js',
                destTech: 'bemhtml'
            }]
        ]);
        node.addTarget('?.bemdecl.js');
    });
};
```

files
-----

Makes a list of source files and directories for the build based on the BEM entities declaration, as well as level scanning ([Levels](../../lib/levels/levels.js)).

The result is saved in two target files:

1. The file list — The `?.files` target. Configured with the [filesTarget](#filestarget) option.
2. The directory list — The `?.dirs` target. Configured with the [dirsTarget](#dirstarget) option.

Each list is an instance of the [FileList](https://github.com/enb-make/enb/blob/master/lib/file-list.js) class.

Most technologies from other packages accept the result of this technology as input.

### Options

* [filesTarget](#filestarget-1)
* [dirsTarget](#dirstarget)
* [depsFile](#depsfile)
* [levelstarget](#levelstarget-2)

#### filesTarget

Type: `String`. Default: `?.files`.

The name of the target for saving the file list.

#### dirsTarget

Type: `String`. Default: `?.dirs`.

The name of the target for saving the list of directories.

#### depsFile

Type: `String`. Default: `?.deps.js`.

The name of the file with the BEM entities declaration.

#### levelsTarget

Type: `String`. Default: `?.levels`.

The name of the target for accessing the result of scanning the redefinition levels ([Levels](../../lib/levels/levels.js)). Information about the redefinition levels is provided by the [levels](#levels) technology.

--------------------------------------

**Example**

Creating the list of files and directories from the BEMDECL file.

```js
var bemTechs = require('enb-bem-techs'),
    FileProviderTech = require('enb/techs/file-provider');

module.exports = function (config) {
    config.node('bundle', function (node) {
        node.addTechs([
            [bemTechs.levels, { levels: ['blocks'] }],
            [FileProviderTech, { target: '?.bemdecl.js' }]
            [bemTechs.files, { depsFile: '?.bemdecl.js' }]
        ]);
        node.addTargets(['?.files', '?.dirs']);
    });
};
```

Creating the list of files and directories from the DEPS file.

```js
var bemTechs = require('enb-bem-techs'),
    FileProviderTech = require('enb/techs/file-provider');

module.exports = function (config) {
    config.node('bundle', function (node) {
        node.addTechs([
            [bemTechs.levels, { levels: ['blocks'] }],
            [FileProviderTech, { target: '?.bemdecl.js' }]
            [bemTechs.deps],
            [bemTechs.files]
        ]);
        node.addTargets(['?.files', '?.dirs']);
    });
};
```

provideBemdecl
--------------

Copies the BEMDECL file into the current [node](https://github.com/enb-make/enb#Terminology) by the specified name from the specified [node](https://github.com/enb-make/enb#Terminology).

Can be used for merging BEMDECL files from different [nodes](https://github.com/enb-make/enb#Terminology).

### Options

* [node](#node)
* [source](#source-2)
* [target](#target-6)

#### node

Type: `String`. Required option.

Path to the [node](https://github.com/enb-make/enb#Terminology) with the source BEMDECL file.

#### source

Type: `String`. Default: `?.bemdecl.js` (unmasked within the source node).

The name of the source BEMDECL file to be copied.

#### target

Type: `String`. Default: `?.bemdecl.js` (unmasked within the current node).

The name of the BEMDECL file being created.

--------------------------------------

**Example**

```js
/**
 * Nodes in the file system before the build:
 *
 * bundles/
 * ├── bundle-1/
 *     └── bundle-1.bemdecl.js
 * ├── bundle-2/
 *     └── bundle-1.bemdecl.js
 * └── bundle-3/
 *
 * What you should get after the build:
 *
 * bundles/
 * ├── bundle-1/
 *     └── bundle-1.bemdecl.js
 * ├── bundle-2/
 *     └── bundle-2.bemdecl.js
 * └── bundle-3/
 *     ├── bundle-1.bemdecl.js
 *     └── bundle-2.bemdecl.js
 */

var bemTechs = require('enb-bem-techs');

module.exports = function (config) {
    config.node('bundle-3', function (node) {
        node.addTechs([
            // Copy the BEMDECL file from the `bundle-1` node to the `bundle-3` node
            [bemTechs.provideBemdecl, {
                node: 'bundles/bundle-1',
                source: 'bundle-1.bemdecl.js',
                target: 'bundle-1.bemdecl.js'
            }],

            // Copy the BEMDECL file from the `bundle-2` node to `bundle-3`
            [bemTechs.provideBemdecl, {
                node: 'bundles/bundle-2',
                source: 'bundle-2.bemdecl.js',
                target: 'bundle-2.bemdecl.js'
            }]
        ]);
        node.addTargets(['bundle-1.bemdecl.js', 'bundle-2.bemdecl.js']);
    })
};
```

provideDeps
-----------

Copies the DEPS file into the current [node](https://github.com/enb-make/enb#Terminology) with the specified name from the specified [node](https://github.com/enb-make/enb#Terminology).

Can be used for merging the DEPS files from different [nodes](https://github.com/enb-make/enb#Terminology).

### Options

* [node](#node)
* [source](#source-3)
* [target](#target-7)

#### node

Type: `String`. Required option.

Path to the [node](https://github.com/enb-make/enb#Terminology) with the source DEPS file.

#### source

Type: `String`. Default: `?.deps.js` (unmasked within the source node).

The name of the source DEPS file to be copied from the specified [node](https://github.com/enb-make/enb#Terminology).

#### target

Type: `String`. Default: `?.deps.js` (unmasked within the current node).

The name of the DEPS file to be created.

--------------------------------------

**Example**

```js
/**
 * Nodes in the file system before the build:
 *
 * bundles/
 * ├── bundle-1/
 *     └── bundle-1.deps.js
 * ├── bundle-2/
 *     └── bundle-1.deps.js
 * └── bundle-3/
 *
 * What you should get after the build:
 *
 * bundles/
 * ├── bundle-1/
 *     └── bundle-1.deps.js
 * ├── bundle-2/
 *     └── bundle-2.deps.js
 * └── bundle-3/
 *     ├── bundle-1.deps.js
 *     └── bundle-2.deps.js
 */

var bemTechs = require('enb-bem-techs');

module.exports = function (config) {
    config.node('bundle-3', function (node) {
        node.addTechs([
            // Copy the DEPS file from the `bundle-1` node to `bundle-3`
            [bemTechs.provideDeps, {
                node: 'bundles/bundle-1',
                target: 'bundle-1.deps.js'
            }],

            // Copy the DEPS file from the `bundle-2` node to `bundle-3`
            [bemTechs.provideDeps, {
                node: 'bundles/bundle-2',
                target: 'bundle-2.deps.js'
            }]
        ]);
        node.addTargets(['bundle-1.deps.js', 'bundle-2.deps.js'])
    });
};
```

mergeBemdecl
------------

Merges all BEMDECL files in one file.

Can be used for generating the `merged` bundle.

### Options

* [sources](#sources)
* [target](#target-8)

#### sources

Type: `String[]`. Required option.

The list of source BEMDECL files to be merged.

#### target

Type: `String`. Default: `? .bemdecl.js`.

The name of the BEMDECL file to build.

--------------------------------------

**Example**

```js
/**
 * Nodes in the file system before the build:
 *
 * merged-bundle/
 * ├── bundle-1.bemdecl.js
 * └── bundle-2.bemdecl.js
 *
 * What you should get after the build:
 *
 * merged-bundle/
 * ├── bundle-1.bemdecl.js
 * ├── bundle-2.bemdecl.js
 * └── merged-bundle.bemdecl.js
 */

var bemTechs = require('enb-bem-techs');

module.exports = function (config) {
    config.node('merged-bundle', function (node) {
        node.addTech([bemTechs.mergeBemdecl, {
            sources: ['bundle-1.bemdecl.js', 'bundle-2.bemdecl.js'],
            target: 'merged-bundle.bemdecl.js'
        }]);
        node.addTarget('merged-bundle.bemdecl.js');
    });
};
```

mergeDeps
---------

Merges DEPS files and BEMDECL files in the resulting DEPS file.

Can be used for generating the `merged` bundle.

### Options

* [sources](#sources-1)
* [target](#target-9)

#### sources

Type: `String[]`. Required option.

The list of source DEPS files to be merged.

#### target

Type: `String`. Default: `? .bemdecl.js`.

The name of the DEPS file to build.

--------------------------------------

**Example**

```js
/**
 * Nodes in the file system before the build:
 *
 * merged-bundle/
 * ├── bundle-1.deps.js
 * └── bundle-2.deps.js
 *
 * What you should get after the build:
 *
 * merged-bundle/
 * ├── bundle-1.deps.js
 * ├── bundle-2.deps.js
 * └── merged-bundle.deps.js
 */

var bemTechs = require('enb-bem-techs');

module.exports = function (config) {
    config.node('merged-bundle', function (node) {
        node.addTech([bemTechs.mergeDeps, {
            sources: ['bundle-1.deps.js', 'bundle-2.deps.js'],
            target: 'merged-bundle.deps.js'
        }]);
        node.addTarget('merged-bundle.deps.js');
    });
};
```

subtractDeps
------------

Generates the DEPS file by subtracting one DEPS file from another one.

### Options

* [target](#target-10)
* [from](#from)
* [what](#what)

#### target

Type: `String`. Default: `?.deps.js`.

The name of the DEPS file to build.

#### from

Type: `String`. Required option.

The name of the DEPS file from which another file is subtracted.

#### what

Type: `String`. Required option.

The name of the file that is subtracted.

--------------------------------------

**Example**

```js
var bemTechs = require('enb-bem-techs');

module.exports = function (config) {
    config.node('bundle', function () {
        node.addTech([bemTechs.subtractDeps, {
            from: 'bundle-1.deps.js',
            what: 'bundle-2.deps.js',
            target: 'bundle.deps.js'
        } ]);
        node.addTarget('bundle.deps.js');
    });
};
```
