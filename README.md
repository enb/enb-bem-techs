enb-bem-techs
=============

[![NPM version](http://img.shields.io/npm/v/enb-bem-techs.svg?style=flat)](http://www.npmjs.org/package/enb-bem-techs) [![Build Status](http://img.shields.io/travis/enb-bem/enb-bem-techs/master.svg?style=flat&label=tests)](https://travis-ci.org/enb-bem/enb-bem-techs) [![Build status](http://img.shields.io/appveyor/ci/andrewblond/enb-bem-techs.svg?style=flat&label=windows)](https://ci.appveyor.com/project/andrewblond/enb-bem-techs) [![Coverage Status](https://img.shields.io/coveralls/enb-bem/enb-bem-techs.svg?style=flat)](https://coveralls.io/r/enb-bem/enb-bem-techs?branch=master) [![Dependency Status](http://img.shields.io/david/enb-bem/enb-bem-techs.svg?style=flat)](https://david-dm.org/enb-bem/enb-bem-techs)

Пакет предоставляет набор базовых [ENB](http://enb-make.info/)-технологий для сборки проектов, в основе которых лежит [БЭМ-методология](http://ru.bem.info/method/).

Основная задача базовых технологий — подготовить промежуточный результат для технологий, которые ничего не знают о методологии и о том, как устроен проект.

Большинство технологий в [ENB](http://enb-make.info/) ожидает на вход список файлов или директорий, а также информацию о требуемом порядке для их сборки.

Установка
---------

```sh
$ npm install --save-dev enb-bem-techs
```

Для работы модуля требуется зависимость от пакета `enb` версии `0.13.0` или выше.

Документация
------------

* [Как устроены БЭМ-проекты](docs/bem-project.md)
* [Сборка бандла](docs/build-bundle.md)
* [Сборка страницы](docs/build-page.md)
* [Сборка merged-бандла](docs/build-merged-bundle.md)
* [Сборка дистрибутива](docs/build-dist.md)

С чего начать?
--------------

Воспользуйтесь [инструкцией по установке project-stub](http://ru.bem.info/tutorials/project-stub/), чтобы создать БЭМ-проект, настроенный для сборки с помощью [ENB](http://enb-make.info/).

Для создания проекта, подходящего под ваши задачи, ответьте на вопросы [генератора БЭМ-проектов](http://ru.bem.info/tools/bem/bem-stub/), основанного на [Yeoman](http://yeoman.io/).

Пакеты
------

### Стили

* [enb-stylus](https://github.com/enb-make/enb-stylus) — сборка `stylus`-файлов.
* [enb-autoprefixer](https://github.com/enb-make/enb-autoprefixer) — поддержка `autoprefixer`.

### Шаблонизация

* [enb-bh](https://github.com/enb-bem/enb-bh) — сборка BH-шаблонов.
* [enb-xjst](https://github.com/enb-bem/enb-xjst) — сборка BEMHTML и BEMTREE на основе `xjst`.
* [enb-bemxjst](https://github.com/enb-bem/enb-bemxjst) — сборка BEMHTML и BEMTREE на основе `bem-xjst`.

### Инфраструктура

* [enb-bem-examples](https://github.com/enb-bem/enb-bem-examples) — сборка БЭМ-примеров.
* [enb-bem-docs](https://github.com/enb-bem/enb-bem-docs) — сборка БЭМ-документации.
* [enb-bem-specs](https://github.com/enb-bem/enb-bem-specs) — сборка и запуск тестов для клиентского JavaScript.
* [enb-bem-tmpl-specs](https://github.com/enb-bem/enb-bem-tmpl-specs) — сборка и запуск тестов для БЭМ-шаблонов.
* [enb-magic-platform](https://github.com/enb-bem/enb-magic-platform) — платформа и dev-сервер для сборки БЭМ-проектов.

### Остальное

* [enb-borschik](https://github.com/enb-make/enb-borschik) — поддержка `borschik`.
* [enb-modules](https://github.com/enb-make/enb-modules) — поддержка `ym`.
* [enb-diverse-js](https://github.com/enb-make/enb-diverse-js) — поддержка паттерна `vanilla.js` + `node.js` + `browser.js`.
* [enb-bem-i18n](https://github.com/enb-bem/enb-bem-i18n) — поддержка `BEM.I18N`.

Технологии
----------

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

### `levels`

Собирает информацию об уровнях переопределения проекта. Результат выполнения этой технологии необходим следующим технологиям:

* `levelsToBemdecl`
* `deps`
* `depsOld`
* `files`

#### Опции

##### target

Тип: `String`. По умолчанию: `?.levels`.

Результирующий таргет.

##### levels

Тип: `String[] | Object[]`.

Список путей до уровней переопределения.

Каждый путь может быть задан абсолютным или относительно корня проекта.

Вместо строки может использоваться объект вида `{ path: 'path/to/level', check: false }`.
Поле `path` является обязательным, а поле `check` по умолчанию равно `true`.

Значение `check: false` используется для того, чтобы закэшировать содержимое уровня.

Если указать `check: true` уровень будет сканироваться заново каждый раз при сборке, вне зависимости от наличия кэша.

#### Пример

```js
var techs = require('enb-bem-techs');

nodeConfig.addTech([techs.levels, { levels: [
    // На проекте не нужно менять код внешних библиотек,
    // достаточно один раз просканировать их уровни и использовать кэш.
    { path: 'libs/bem-core/common.blocks', check: false },
    { path: 'libs/bem-core/desktop.blocks', check: false },

    // Уровни проекта нужно сканировать перед каждой сборкой.
    { path: 'desktop.blocks', check: true },
] }]);
```

-------------------------------------------------------------------------------

### `levelsToBemdecl`

Формирует BEMDECL-файл, состоящий из всех БЭМ-сущностей, найденных в указанных уровнях.

#### Опции

##### target

Тип: `String`. По умолчанию: `?.bemdecl.js`.

Результирующий BEMDECL-файл.

##### source

Тип: `String`. По умолчанию: `?.levels`.

Таргет с интроспекцией уровней (результат сканирования `levels` технологией).

#### Пример

```js
var techs = require('enb-bem-techs');

nodeConfig.addTechs([
    // Сканируем уровни проекта.
    // Результат записываем в `?.levels`,
    // т.к. опция `target` по умолчанию — `?.levels`.
    [techs.levels, { levels: ['blocks'] }],

    // Строим BEMDECL-файл по результатам сканирования уровней.
    // Интроспекцию берём из `?.levels`,
    // т.к. опция `source` по умолчанию — `?.levels`.
    [techs.levelsToBemdecl]
]);
```

-------------------------------------------------------------------------------

### `bemjsonToBemdecl`

Формирует BEMDECL-файл из BEMJSON-файла.

#### Опции

##### target

Тип: `String`. По умолчанию: `?.bemdecl.js`.

Результирующий BEMDECL-файл.

##### source

Тип: `String`. По умолчанию: `?.bemjson.js`.

Исходный BEMJSON-файл.

#### Пример

```js
var techs = require('enb-bem-techs'),
    provide = require('enb/techs/file-provider');

nodeConfig.addTechs([
    // Предоставляет BEMJSON-файл, написанный вручную, для ENB.
    // В опции `target` путь до BEMJSON-файла.
    [provide, { target: '?.bemjson.js' }],

    // Строим BEMDECL-файл по полученному BEMJSON-файлу.
    // BEMJSON-файл берём из `?.bemjson.js`,
    // т.к. опция `source` по умолчанию — `?.bemjson.js`.
    [techs.bemjsonToBemdecl]
]);
```
-------------------------------------------------------------------------------

### `deps`

Дополняет декларацию БЭМ-сущностей на основе информации из технологий зависимостей (`deps.js` или `deps.yaml`) БЭМ-сущностей.

#### Опции

##### target

Тип: `String`. По умолчанию: `?.deps.js`.

Результирующий DEPS-файл.

##### bemdeclFile

Тип: `String`. По умолчанию: `?.bemdecl.js`.

Файл с декларацией БЭМ-сущностей.

##### levelsTarget

Тип: `String`. По умолчанию: `?.levels`.

Таргет с интроспекцией уровней (результат сканирования `levels` технологией).

#### Пример

Раскрытие зависимостей по BEMDECL-файлу.

```js
var techs = require('enb-bem-techs');

nodeConfig.addTech([techs.deps, {
    bemdeclFile: '?.bemdecl.js',
    target: '?.deps.js'
}]);
```

Раскрытие зависимостей по DEPS-файлу.

```js
var techs = require('enb-bem-techs');

nodeConfig.addTech([techs.deps, {
    bemdeclFile: 'source-decl.deps.js',
    target: '?.deps.js'
}]);
```

-------------------------------------------------------------------------------

### `depsOld`

Дополняет декларацию БЭМ-сущностей на основе информации из технологий зависимостей (`deps.js`) БЭМ-сущностей.

Использует алгоритм, заимствованный из [bem-tools](http://ru.bem.info/tools/bem/bem-tools/).

#### Опции

##### target

Тип: `String`. По умолчанию: `?.deps.js`.

Результирующий DEPS-файл.

##### bemdeclFile

Тип: `String`. По умолчанию: `?.bemdecl.js`.

Файл с декларацией БЭМ-сущностей.

##### levelsTarget

Тип: `String`. По умолчанию: `?.levels`.

Таргет с интроспекцией уровней (результат сканирования `levels` технологией).

#### Пример

Раскрытие зависимостей по BEMDECL-файлу.

```js
var techs = require('enb-bem-techs');

nodeConfig.addTech([techs.depsOld, {
    bemdeclFile: '?.bemdecl.js',
    target: '?.deps.js'
}]);
```

Раскрытие зависимостей по DEPS-файлу.

```js
var techs = require('enb-bem-techs');

nodeConfig.addTech([techs.depsOld, {
    bemdeclFile: 'source-decl.deps.js',
    target: '?.deps.js'
}]);
```

-------------------------------------------------------------------------------

### `depsByTechToBemdecl`

Формирует BEMDECL-файл на основе зависимостей по технологиям (depsByTech). Такие зависимости описываются в `deps.js` технологиях БЭМ-сущностей.

#### Опции

##### target

Тип: `String`. По умолчанию: `?.bemdecl.js`.

Результирующий BEMDECL-файл.

##### sourceTech

Тип: `String`. Обязательная опция.

Имя технологии для которой собираются зависимости.

##### destTech

Тип: `String`.

Имя технологии от которой зависит `sourceTech`.

##### filesTarget

Тип: `String`. По умолчанию: `?.files`.

Таргет со списоком `deps.js`-файлов (результат технологии `files`).

##### sourceSuffixes

Тип: `String[]`. По умолчанию: `['deps.js']`.

Суффиксы файлов с описанием зависимостей БЭМ-сущностей.

#### Пример

Частый случай, когда БЭМ-сущность в технологии клиенского JavaScript использует свою же технологию шаблонов.

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

В большинстве случаев схема построения BEMDECL-файла по `depsByTech` выглядит так:

```
(BEMJSON ->) BEMDECL (1) -> deps (2) -> files (3) -> BEMDECL (4)
```

1. Получаем BEMDECL-файл (?.bemdecl.js).
2. Дополняем декларацию БЭМ-сущностей из BEMDECL-файла и записываем результат в DEPS-файл (?.deps.js).
3. Получаем упорядоченный список `deps.js` файлов (?.files.js).
4. Получаем BEMDECL-файл на основе зависимостей по технологиям (?.tech.bemdecl.js).

```js
var techs = require('enb-bem-techs'),
    provide = require('enb/techs/file-provider');

nodeConfig.addTechs([
    [techs.levels, { levels: ['blocks'] }],
    [provide, { target: '?.bemdecl.js' }], // (1) `?.bemdecl.js`
    [techs.deps],                          // (2) `?.deps.js`
    [techs.files],                         // (3) `?.files.js`
    // Далее '?.bemhtml.bemdecl.js' можно использовать для сборки шаблонов,
    // которые используются в клиенском JavaScript.
    // Список `deps.js` файлов берём из `?.files`, т.к. опция filesTarget
    // по умолчанию — `?.files`.
    [techs.depsByTechToBemdecl, {          // (4) `?.bemhtml.bemdecl.js`
        target: '?.bemhtml.bemdecl.js',
        sourceTech: 'js',
        destTech: 'bemhtml'
    }]
]);
```

-------------------------------------------------------------------------------

### `files`

Собирает список исходных файлов и директорий для сборки на основе декларации БЭМ-сущностей, а также результате сканирования уровней `levels` технологией.

Предоставляет `?.files` и `?.dirs` таргеты.

Используется большинством технологиями в ENB (кроме базовых).

#### Опции

##### filesTarget

Тип: `String`. По умолчанию: `?.files`.

Результирующий `files`-таргет.

##### dirsTarget

Тип: `String`. По умолчанию: `?.dirs`.

Результирующий `dirs`-таргет.

##### depsFile

Тип: `String`. По умолчанию: `?.deps.js`.

Исходная декларация БЭМ-сущностей.

##### levelsTarget

Тип: `String`. По умолчанию: `?.levels`.

Таргет с интроспекцией уровней (результат сканирования `levels` технологией).

#### Пример

Формирование списка файлов и директорий по BEMDECL-файлу.

```js
var techs = require('enb-bem-techs'),
    provide = require('enb/techs/file-provider');

nodeConfig.addTechs([
    [techs.levels, { levels: ['blocks'] }],
    [provide, { target: '?.bemdecl.js' }]
    [techs.files, { depsFile: '?.bemdecl.js' }]
]);
```

Формирование списка файлов и директорий по DEPS-файлу.

```js
var techs = require('enb-bem-techs'),
    provide = require('enb/techs/file-provider');

nodeConfig.addTechs([
    [techs.levels, { levels: ['blocks'] }],
    [provide, { target: '?.bemdecl.js' }],
    [techs.deps],
    [techs.files]
]);
```

-------------------------------------------------------------------------------

### `provideBemdecl`

Копирует BEMDECL-файл в текущую ноду по указанному имени из указанной ноды.

Может понадобиться для объединения BEMDECL-файлов из разных нод.

#### Опции

##### target

Тип: `String`. По умолчанию: `?.bemdecl.js` (демаскируется в рамках текущей ноды).

Результирующий BEMDECL-файл.

##### node

Тип: `String`. Обязательная опция.

Путь ноды с исходным BEMDECL-файлом.

##### source

Тип: `String`. По умолчанию: `?.bemdecl.js` (демаскируется в рамках исходной ноды).

Исходный BEMDECL-файл, который будет скопирован.

#### Пример

```js
var techs = require('enb-bem-techs');

/**
 * Ноды в файловой системе до сборки:
 *
 * bundles/
 * ├── bundle-1/
 *     └── bundle-1.bemdecl.js
 * ├── bundle-2/
 *     └── bundle-1.bemdecl.js
 * └── bundle-3/
 *
 * Что должно получиться после сборки:
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
config.node('bundle-3', function (nodeConfig) {
    nodeConfig.addTechs([
        // Копируем BEMDECL-файл из ноды `bundle-1` в `bundle-3`
        [techs.provideBemdecl, {
            node: 'bundles/bundle-1',
            target: 'bundle-1.bemdecl.js'
        }],

        // Копируем BEMDECL-файл из ноды `bundle-2` в `bundle-3`
        [techs.provideBemdecl, {
            node: 'bundles/bundle-2',
            target: 'bundle-2.bemdecl.js'
        }]
    ]);
});
```

-------------------------------------------------------------------------------

### `provideDeps`

Копирует DEPS-файл в текущую ноду по указанному имени из указанной ноды.

Может понадобиться для объединения DEPS-таргетов из разных нод.

#### Опции

##### target

Тип: `String`. По умолчанию: `?.deps.js` (демаскируется в рамках текущей ноды).

Результирующий DEPS-файл.

##### node

Тип: `String`. Обязательная опция.

Путь ноды с исходным DEPS-файлом.

##### source

Тип: `String`. По умолчанию: `?.deps.js` (демаскируется в рамках исходной ноды).

Исходный DEPS-файл, который будет скопирован из указанной ноды.

#### Пример

```js
var techs = require('enb-bem-techs');

/**
 * Ноды в файловой системе до сборки:
 *
 * bundles/
 * ├── bundle-1/
 *     └── bundle-1.deps.js
 * ├── bundle-2/
 *     └── bundle-1.deps.js
 * └── bundle-3/
 *
 * Что должно получиться после сборки:
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
config.node('bundle-3', function (nodeConfig) {
    nodeConfig.addTechs([
        // Копируем DEPS-файл из ноды `bundle-1` в `bundle-3`
        [techs.provideBemdecl, {
            node: 'bundles/bundle-1',
            target: 'bundle-1.deps.js'
        }],

        // Копируем DEPS-файл из ноды `bundle-2` в `bundle-3`
        [techs.provideBemdecl, {
            node: 'bundles/bundle-2',
            target: 'bundle-2.deps.js'
        }]
    ]);
});
```

-------------------------------------------------------------------------------

### `mergeBemdecl`

Объединяет BEMDECL-файлы в результирующий.

Может понадобиться для формирования `merged`-бандла.

#### Опции

##### target

Тип: `String`. По умолчанию: `?.bemdecl.js`.

Результирующий BEMDECL-файл.

##### sources

Тип: `String[]`. Обязательная опция.

Исходные BEMDECL-файлы.

#### Пример

```js
var techs = require('enb-bem-techs');

/**
 * Ноды в файловой системе до сборки:
 *
 * merged-bundle/
 * ├── bundle-1.bemdecl.js
 * └── bundle-2.bemdecl.js
 *
 * Что должно получиться после сборки:
 *
 * merged-bundle/
 * ├── bundle-1.bemdecl.js
 * ├── bundle-2.bemdecl.js
 * └── merged-bundle.bemdecl.js
 */
nodeConfig.addTech([techs.mergeBemdecl, {
    sources: ['bundle-1.bemdecl.js', 'bundle-2.bemdecl.js'],
    target: 'merged-bundle.bemdecl.js'
}]);
```

-------------------------------------------------------------------------------

### `mergeDeps`

Объединяет DEPS-файлы и BEMDECL-файлы в результирующий DEPS-файл.

Может понадобиться для формирования `merged`-бандла.

#### Опции

##### target

Тип: `String`. По умолчанию: `?.deps.js`.

Результирующий DEPS-файл.

##### sources

Тип: `String[]`. Обязательная опция.

Исходные DEPS-файлы. Обязательная опция.

#### Пример

```js
var techs = require('enb-bem-techs');

/**
 * Ноды в файловой системе до сборки:
 *
 * merged-bundle/
 * ├── bundle-1.deps.js
 * └── bundle-2.deps.js
 *
 * Что должно получиться после сборки:
 *
 * merged-bundle/
 * ├── bundle-1.deps.js
 * ├── bundle-2.deps.js
 * └── merged-bundle.deps.js
 */
nodeConfig.addTech([techs.mergeDeps, {
    sources: ['bundle-1.deps.js', 'bundle-2.deps.js'],
    target: 'merged-bundle.deps.js'
}]);
```

-------------------------------------------------------------------------------

### `subtractDeps`

Формирует DEPS-файл, вычитая один DEPS-файл из другого.

#### Опции

##### target

Тип: `String`. По умолчанию: `?.deps.js`.

Результирующий DEPS-файл.

##### from

Тип: `String`. Обязательная опция.

DEPS-файл, из которого вычитают.

##### what

Тип: `String`. Обязательная опция.

DEPS-файл, который вычитают.

#### Пример

```js
var techs = require('enb-bem-techs');

nodeConfig.addTech([techs.subtractDeps, {
    from: 'bundle-1.deps.js',
    what: 'bundle-2.deps.js',
    target: 'bundle.deps.js'
} ]);
```

Лицензия
--------

© 2014 YANDEX LLC. Код лицензирован [Mozilla Public License 2.0](LICENSE.txt).
