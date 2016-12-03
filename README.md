enb-bem-techs
=============

[![NPM version](https://img.shields.io/npm/v/enb-bem-techs.svg?style=flat)](https://www.npmjs.org/package/enb-bem-techs) [![Build Status](https://img.shields.io/travis/enb/enb-bem-techs/master.svg?style=flat&label=tests)](https://travis-ci.org/enb/enb-bem-techs) [![Build status](https://img.shields.io/appveyor/ci/blond/enb-bem-techs.svg?style=flat&label=windows)](https://ci.appveyor.com/project/blond/enb-bem-techs) [![Coverage Status](https://img.shields.io/coveralls/enb/enb-bem-techs.svg?style=flat)](https://coveralls.io/r/enb/enb-bem-techs?branch=master) [![Dependency Status](https://img.shields.io/david/enb/enb-bem-techs.svg?style=flat)](https://david-dm.org/enb/enb-bem-techs)

`enb-bem-techs` — это основной пакет технологий для работы с проектами, созданными по БЭМ-методологии.

Пакет предоставляет набор базовых [ENB](http://enb-make.info/)-технологий, основная задача которых — подготовить промежуточный результат для технологий, которые ничего не знают о [БЭМ-методологии](https://ru.bem.info/method/) и о том, как устроен проект.

Большинство технологий из других пакетов в [ENB](http://enb-make.info/) ожидает на вход список файлов или директорий, а также информацию о требуемом порядке для их сборки.

**Технологии пакета `enb-bem-techs`:**

* [levels](docs/api.ru.md#levels) — cобирает информацию о БЭМ-сущностях на уровнях переопределения.
* [levelsToBemdecl](docs/api.ru.md#levelstobemdecl) — формирует BEMDECL-файл из БЭМ-сущностей с указанных уровней.
* [bemjsonToBemdecl](docs/api.ru.md#bemjsontobemdecl) — формирует BEMDECL-файл из BEMJSON-файла.
* [deps](docs/api.ru.md#deps) — дополняет декларацию БЭМ-сущностей необходимыми зависимостями.
* [depsOld](docs/api.ru.md#depsold) — дополняет декларацию БЭМ-сущностей необходимыми зависимостями. Использует алгоритм, заимствованный из [bem-tools](https://github.com/bem/bem-tools/tree/support/0.10.x).
* [depsByTechToBemdecl](docs/api.ru.md#depsbytechtobemdecl) — формирует BEMDECL-файл на основе зависимостей по технологиям.
* [files](docs/api.ru.md#files) — собирает список исходных файлов и директорий для сборки.
* [provideBemdecl](docs/api.ru.md#providebemdecl) — копирует BEMDECL-файл из указанной ноды (node) в текущую.
* [provideDeps](docs/api.ru.md#providedeps) — копирует DEPS-файл из указанной ноды (node) в текущую.
* [mergeBemdecl](docs/api.ru.md#mergebemdecl) — объединяет BEMDECL-файлы в один файл.
* [mergeDeps](docs/api.ru.md#mergedeps) — объединяет DEPS-файлы в один файл.
* [subtractDeps](docs/api.ru.md#subtractdeps) — формирует DEPS-файл, вычитая один DEPS-файл из другого.

Принципы работы технологий и их API описаны в документе [API технологий](docs/api.ru.md).

Установка
---------

```sh
$ npm install --save-dev enb-bem-techs
```

**Требования**: зависимость от пакета `enb` версии `0.13.0` или выше.

Документация
------------

* [API технологий](docs/api.ru.md)
* [Организация файловой структуры](https://ru.bem.info/methodology/filesystem/)
* [Сборка бандла](docs/build-bundle.md)
* [Сборка страницы](docs/build-page.md)
* [Сборка merged-бандла](docs/build-merged-bundle.md)
* [Сборка дистрибутива](docs/build-dist.md)

Лицензия
--------

© 2014 YANDEX LLC. Код лицензирован [Mozilla Public License 2.0](LICENSE.txt).
