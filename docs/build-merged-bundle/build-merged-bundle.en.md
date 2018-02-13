# Building a merged bundle

A merged bundle contains all BEM entities from all bundles of the platform. The main difference from a common bundle is that the BEMDECL file is created automatically from the BEMDECL files of other bundles.

> To learn how to build a bundle, read [Building a bundle](../build-bundle/build-bundle.en.md).

## Example of a merged bundle build

The project contains individual bundles, each of them containing a BEMDECL file.

```sh
.enb/
└── make.js           # The ENB config file
desktop.blocks/       # blocks level
desktop.bundles/
├── index/
    └── index.bemdecl.js
├── price/
    └── price.bemdecl.js
├── blog/
    └── blog.bemdecl.js
└── contacts/
    └── contacts.bemdecl.js
```

To build a merged bundle, you need to:

1. Create a directory for a `merged` bundle.

2. Find all BEMDECL files in all bundles except for `merged` files.

3. Copy the BEMDECL files to the `merged` bundle.

4. Merge the copied BEMDECL files.

5. Configure the build the same way as for a common bundle using the merged BEMDECL file (3).

   ```js
   var fs = require('fs'),
    path = require('path'),
    techs = require('enb-bem-techs'),
    provide = require('enb/techs/file-provider'),
    css = require('enb-css/techs/css'),
    js = require('enb-js/techs/browser-js.js')
    platforms = ['desktop'];

module.exports = function (config) {
    // Create a directory for the merged bundles (1)
    platforms.forEach(function (platform) {
        var node = path.join(platform + '.bundles', 'merged');

        if (!fs.existsSync(node)) {
            fs.mkdirSync(node);
        }
    });

    // Provide the BEMDECL files from bundles (2)
    config.nodes('*.bundles/*', function (nodeConfig) {
        var node = path.basename(nodeConfig.getPath());

        if (node !== 'merged') {
            nodeConfig.addTechs([
                [provide, { target: '?.bemdecl.js' }]
            ]);
        }
    });

    // Configure the build of the merged bundle
    config.nodes('*.bundles/merged', function (nodeConfig) {
        var dir = path.dirname(nodeConfig.getPath()),
            bundles = fs.readdirSync(dir),
            bemdeclFiles = [];

        // Copy the BEMDECL files to the merged bundle (3)
        bundles.forEach(function (bundle) {
            if (bundle === 'merged') return;

            var node = path.join(dir, bundle),
                target = bundle + '.bemdecl.js';

            nodeConfig.addTech([techs.provideBemdecl, {
                node: node,
                target: target
            }]);

            bemdeclFiles.push(target);
        });

        // Merge the copied BEMDECL files (4)
        nodeConfig.addTech([techs.mergeBemdecl, { sources: bemdeclFiles }]);

        // Normal bundle build (5)
        nodeConfig.addTechs([
            [techs.levels, { levels: ['desktop.blocks'] }],
            [techs.deps],
            [techs.files],

            [css, { target: '?.css' }],
            [js, { target: '?.js' }]
        ]);

        nodeConfig.addTargets(['?.css', '?.js']);
    });
};
   ```

6. Launch the build in the console:

   ```sh
   $ enb make
   ```

7. Check the result.

   After the build, the `merged` directory will contain the `merged.css` and `merged.js` files, along with service files.

    ```sh
    .enb/
    desktop.blocks/
    desktop.bundles/
    ├── index/
    ├── price/
    ├── blog/
    ├── contacts/
    └── merged/
        ├── merged.bemdecl.js
            ...
        ├── merged.css
        └── merged.js
    ```

