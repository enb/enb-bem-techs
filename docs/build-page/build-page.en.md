# Building a page

A page is a subtype of a [bundle](https://github.com/enb/enb/blob/master/docs/terms/terms.en.md). To build a page, you also need a list of the [BEM entities](https://en.bem.info/methodology/key-concepts/#bem-entities) and [levels](https://en.bem.info/methodology/redefinition-levels/)  with the source code for the blocks.

> To learn how to build a bundle, read [Building a bundle](../build-bundle.en.md).

The main difference is that pages are usually described in [BEMJSON](https://en.bem.info/platform/bemjson/) format, while [BEMDECL](https://en.bem.info/methodology/declarations/) is usually received automatically.

Example of a BEMJSON file:

```js
module.exports = {
    block: 'page',
    content: 'Hello BEM!'
};
```

## Example of a page build

Page build in the example project:

```sh
.enb/
└── make.js          # The ENB config file
blocks/              # blocks level
├── input/
    ├── input.deps.js
    ├── input.bemhtml
    ├── input.css
    └── input.js
├── button/
    ├── button.deps.js
    ├── button.bemhtml
    ├── button.css
    └── button.js
└── checkbox/
    ├── checkbox.deps.js
    ├── checkbox.bemhtml
    ├── checkbox.css
    └── checkbox.js
page/
└── page.bemjson.js  # page description
```

To build a page, you need to complete the following steps:

1. Get the list of source files to include in the build (for `css`  and `js`)

   To do this, you will need to:

   **a.** Scan the levels and find all the BEM entities in the project.

   **b.** Read the BEMJSON file.

   **c.** Make a list of BEM entities from the BEMJSON file (b).

   **d.** Complete and sort BEM entities (c) based on dependencies (`input.deps.js`, `button.deps.js` and `checkbox.deps.js`) between them (a).

   **e.** Get a list of files sorted by the list of BEM entities (c), as well as by the introspection of levels (a).

2. Use technologies to build `css` and `js`.

3. Compile the [templates](https://en.bem.info/platform/bem-xjst/8/) code (BEMHTML or BH) and apply it to the BEMJSON file to get an HTML file.

4. Declare [targets](https://github.com/enb/enb/blob/master/docs/terms/terms.en.md).

   The ENB config file (.enb/make.js) will look like this:

   ```js
   // Connect technology models
var techs = require('enb-bem-techs'),
    provide = require('enb/techs/file-provider'),
    bemhtml = require('enb-bemxjst/techs/bemhtml'), // npm install --save-dev enb-bemxjst
    html = require('enb-bemxjst/techs/bemjson-to-html'),
    css = require('enb-css/techs/css'), // npm install --save-dev enb-css
    js = require('enb-js/techs/browser-js'); // npm install --save-dev enb-js

module.exports = function(config) {
    // Configure the bundle build
    config.node('page', function(nodeConfig) {
        // Declare the technology modules
        // that can take part in building the targets.
        nodeConfig.addTechs([
            // Use basic technologies to get
            // the list of files to include in the build.
            [techs.levels, { levels: ['blocks'] }],   // (1) -> `?.levels`
            [provide, { target: '?.bemjson.js' }],    // (2) -> `?.bemjson.js`
            [techs.bemjsonToBemdecl],                 // (3) -> `?.bemdecl.js`
            [techs.deps],                             // (4) `?.bemdecl.js` -> `?.deps.js`
            [techs.files],                            // (5) `?.levels` + `?.deps.js` -> `?.files`

            // Technologies take the list of files as input. The target that stores the list of files
            // is set with the `filesTarget` option (`?.files` by default). The build will
            // use only the files that have suffixes specified with the `sourceSuffixes` option.
            [css],     // The `sourceSuffixes` option is set to `['css']` by default
            [js, { target: '?.js' }],      // The `sourceSuffixes` option is set to  `['vanilla.js', 'js', 'browser.js']` by default
            [bemhtml], // The `sourceSuffixes` option is set to `['bemhtml', 'bemhtml.xjst']` by default.

            // The technology takes the `?.bemjson.js` and `?.bemhtml.js` targets as input.
            [html]
        ]);

        // Declare targets you want to build.
        nodeConfig.addTargets(['?.css', '?.js', '?.html']);
    });
};
   ```

5. Launch the build in the console:

   ```sh
   $ enb make
   ```

6. Check the result.

   After the build, the `page` directory will contain `page.css`, `page.js` and `page.html` files, along with service files.

    ```sh
    .enb/
    blocks/
    page/
    ├── page.bemjson.js
        ...
    ├── page.html
    ├── page.css
    └── page.js
    ```
