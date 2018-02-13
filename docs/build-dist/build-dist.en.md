# Building a distribution

A distribution is a set of [bundles](https://github.com/enb/enb/blob/master/docs/terms/terms.en.md). Each bundle is a build of all BEM entities for a project platform.

```sh
dist/
├── desktop/
├── touch-phone/
└── touch-pad/
```

> To learn how to build a bundle, read [Building a bundle](../build-bundle/build-bundle.en.md).

## Example of a distribution build

The project consists of three platforms:

* `desktop` — Includes the `common.blocks` and `desktop.blocks` levels.
* `touch-phone` — Includes the `common.blocks`, `touch.blocks` and `touch-phone.blocks` levels.
* `touch-pad` — Includes the `common.blocks`, `touch.blocks` and `touch-pad.blocks` levels.

Project file system:

```sh
.enb/
└── make.js          # The ENB config file
common.blocks/       # common level
desktop.blocks/      # desktop level
touch.blocks/        # common level for touch interfaces
touch-phone.blocks/  # touch pad level
touch-pad.blocks/    # touch phones level
```

To build a distribution from `css` and `js` for each platform, you need to:

1. Scan the platform levels and find all BEM entities in the project.

2. Generate a BEMDECL file from all BEM entities found on the platform levels (1).

3. Sort the list of BEM entities.

4. Get a list of files sorted by the list of BEM entities (3).

5. Use technologies to build `css` and `js` and declare [targets](https://github.com/enb/enb/blob/master/docs/terms.en.md).

   The ENB config file (.enb/make.js) will look like this:

   ```js
   var techs = require('enb-bem-techs'),
    css = require('enb/techs/css'),
    js = require('enb/techs/js'),
    levels = {
        'desktop': ['common.blocks', 'desktop.blocks'],
        'touch-phone': ['common.blocks', 'touch.blocks', 'touch-phone.blocks'],
        'touch-pad': ['common.blocks', 'touch.blocks', 'touch-pad.blocks']
    },
    platforms = Object.keys(levels);

module.exports = function (config) {
    platforms.forEach(function(platform) {
        var node = path.join('dist', platform);

        // Configure a distribution build for a certain platform.
        // The `config.node` method creates the `dist/platform-name` directory,
        // if it doesn't exist yet.
        config.node(node, function(nodeConfig) {
            nodeConfig.addTechs([
                [techs.levels, {
                    levels: levels[platform]  // (1) -> `?.levels`
                }],
                [techs.levelsToBemdecl],      // (2) `?.levels` -> `?.bemdecl.js`
                [techs.deps],                 // (3) `?.bemdecl.js` -> `?.deps.js`
                [techs.files],                // (4) `?.levels` + `?.deps.js` -> `?.files`

                [css],
                [js]
            ]);

            nodeConfig.addTargets(['?.css', '?.js']);
        }
    }
};
   ```

6. Launch the build in the console:

   ```sh
   $ enb make
   ```

7. Check the result.

   After the build, the `dist` directory is created with platform-specific project deliveries.
A directory is created for each platform that contains `css` and `js`, along with the service files.

    ```sh
    .enb/
    common.blocks/
    desktop.blocks/
    touch.blocks/
    touch-phone.blocks/
    touch-pad.blocks/
    dist/
    ├── desktop/
            ...
        ├── desktop.css
        └── desktop.js
    ├── touch-phone/
            ...
        ├── touch-phone.css
        └── touch-phone.js
    └── touch-pad/
            ...
        ├── touch-pad.css
        └── touch-pad.js
    ```

You can build other necessary bundles in the same way, such as bundles of templates.

