# enb-bem-techs

[![NPM version](https://img.shields.io/npm/v/enb-bem-techs.svg?style=flat)](https://www.npmjs.org/package/enb-bem-techs) [![Build Status](https://img.shields.io/travis/enb/enb-bem-techs/master.svg?style=flat&label=tests)](https://travis-ci.org/enb/enb-bem-techs) [![Build status](https://img.shields.io/appveyor/ci/blond/enb-bem-techs.svg?style=flat&label=windows)](https://ci.appveyor.com/project/blond/enb-bem-techs) [![Coverage Status](https://img.shields.io/coveralls/enb/enb-bem-techs.svg?style=flat)](https://coveralls.io/r/enb/enb-bem-techs?branch=master) [![Dependency Status](https://img.shields.io/david/enb/enb-bem-techs.svg?style=flat)](https://david-dm.org/enb/enb-bem-techs)

`enb-bem-techs` is the main technology package for working with projects created with the BEM methodology.

The package provides a set of basic [ENB](https://github.com/enb/enb) technologies. Their main purpose is to form an intermediate result for technologies that don't know anything about [BEM methodology](https://en.bem.info/method/) and the project structure.

Most technologies from other packages in [ENB](https://github.com/enb/enb) expect to receive a list of files or directories, as well as information about the building order.

**Technologies in the `enb-bem-techs` package:**

* [levels](docs/api/api.en.md#levels) - Collects information about BEM entities on the redefinition levels.
* [levelsToBemdecl](docs/api/api.en.md#levelstobemdecl) — Generates a BEMDECL file from BEM entities on the specified levels.
* [bemjsonToBemdecl](docs/api/api.en.md#bemjsontobemdecl) — Generates a BEMDECL file from the BEMJSON file.
* [deps](docs/api/api.en.md#deps) — Adds necessary dependencies to the declaration of BEM entities.
* [depsOld](docs/api/api.en.md#depsold) — Adds necessary dependencies to the declaration of BEM entities. Uses the algorithm from [bem-tools](https://github.com/bem/bem-tools/tree/support/0.10.x).
* [depsByTechToBemdecl](docs/api/api.en.md#depsbytechtobemdecl) — Generates a BEMDECL file from dependencies by technology.
* [files](docs/api/api.en.md#files) — Composes a list of source files and directories for the build.
* [provideBemdecl](docs/api/api.en.md#providebemdecl) — Copies the BEMDECL file from the specified node to the current one.
* [provideDeps](docs/api/api.en.md#providedeps) — Copies the DEPS file from the specified node to the current one.
* [mergeBemdecl](docs/api/api.en.md#mergebemdecl) — Merges all BEMDECL files into one file.
* [mergeDeps](docs/api/api.en.md#mergedeps) — Merges all DEPS files into one file.
* [subtractDeps](docs/api/api.en.md#subtractdeps) — Generates a DEPS file by subtracting one DEPS file from another.

The principles of the technologies and their APIs are described in the [Technologies API](docs/api/api.en.md) document.

Installation
---------

```sh
$ npm install --save-dev enb-bem-techs
```

**Requirements**: dependency from the `enb` package version `0.13.0` or higher.

Documentation
------------

* [API](docs/api/api.en.md)
* [File structure organization](https://en.bem.info/methodology/filesystem/)
* [Building a bundle](docs/build-bundle/build-bundle.en.md)
* [Building a page](docs/build-page/build-page.en.md)
* [Building a merged bundle](docs/build-merged-bundle/build-merged-bundle.en.md)
* [Building a distribution file](docs/build-dist/build-dist.en.md)

License
--------

© 2014 YANDEX LLC. The code is released under the [Mozilla Public License 2.0](LICENSE.txt).

