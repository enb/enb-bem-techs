# Building a bundle

[Bundle](https://github.com/enb/enb/blob/master/docs/terms.en.md) Is the file obtained as a result of the assembly of the project source files.

To build a bundle, you need a list of the [BEM entities](https://en.bem.info/methodology/key-concepts/#bem-entity) and [levels](https://en.bem.info/methodology/redefinition-levels/)  with the source code for the blocks.

The list of BEM entities is commonly referred to as the [declaration](https://en.bem.info/methodology/declarations/) and described in the BEMDECL format, for example:

```js
exports.blocks = [
    { name: 'input' },
    { name: 'button' },
    { name: 'checkbox' }
];
```

## Example of building a bundle

The example shows how to build a bundle for a project:

```sh
.enb/
└── make.js          # The ENB config file
blocks/              # blocks level
├── input/
    ├── input.deps.js
    ├── input.css
    └── input.js
├── button/
    ├── button.deps.js
    ├── button.css
    └── button.js
└── checkbox/
    ├── checkbox.deps.js
    ├── checkbox.css
    └── checkbox.js
bundle/
└── bundle.bemdecl.js # List of BEM entities
```

To build a bundle, you need to complete the following steps:

1. Get a list of source files that will take part in the build (for `css` and `js`).

   To do that, you need to:

   **a.** Scan the levels and find all the BEM entities in the project.

   **b.** Go through the list of BEM entities in the BEMDECL file.

   **c.** Extend and sort the list of BEM entities (b) based on dependencies (`input.deps.js`, `button.deps.js`and`checkbox.deps.js`) between them (a).

   **d.** Get an ordered list of files sorted by the list of BEM entities (c), as well as by the introspection of levels (a).

2. Apply build technologies (`css`  and ` js`) and declare [targets](https://github.com/enb/enb/blob/master/docs/terms.en.md).

   [The ENB make file](https://github.com/enb/enb/blob/master/docs/terms.en.md) (.enb/make.js) will look like this:

   ```js
   // Connect the technology modules
   var techs = require('enb-bem-techs'),
       provide = require('enb/techs/file-provider'),
       css = require('enb-css/techs/css'), // npm install --save-dev enb-css
       js = require('enb-js/techs/browser-js'); // npm install --save-dev enb-js

   module.exports = function(config) {
       // Configure the bundle build
       config.node('bundle', function(nodeConfig) {
           // Declare the technology modules
           // that can take part in building the targets.
           nodeConfig.addTechs([
               // Use basic technologies to get
               // the list of files to include in the build.
               [techs.levels, { levels: ['blocks'] }],   // (1) -> `?.levels`
               [provide, { target: '?.bemdecl.js' }],    // (2) -> `?.bemdecl.js`
               [techs.deps],                             // (3) `?.bemdecl.js` -> `?.deps.js`
               [techs.files],                            // (4) `?.levels` + `?.deps.js` -> `?.files`

               // Technologies take the list of files as input. The target that stores the list of files
               // is set with the `filesTarget` option (`?.files` by default). The build will
               // use only the files that have suffixes set with the `sourceSuffixes` option.
               [css],     // The `sourceSuffixes` option is set to `['css']` by default
               [js, { target: '?.js' }],       // The `sourceSuffixes` option is set to `['vanilla.js', 'js', 'browser.js']` by default
           ]);

           // Declare targets to be built.
           nodeConfig.addTargets(['?.css', '?.js']);
       });
   };
   ```

3. Launch the build in the console:

   ```sh
   $ enb make
   ```

4. Check the result

   After the build, `bundle.css` and `bundle.js` files are created in the `bundle` directory along with some service files.

   ```sh
   .enb/
   blocks/
   bundle/
   ├── bundle.bemdecl.js
     ...
   ├── bundle.css
   └── bundle.js
   ```

