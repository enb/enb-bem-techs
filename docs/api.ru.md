API технологий
==============

Пакет предоставляет следующие технологии:

* [levels](#levels)
* [levelsToBemdecl](#levelstobemdecl)
* [bemjsonToBemdecl](#bemjsontobemdecl)
* [deps](#deps)
* [depsByTechToBemdecl](#depsbytechtobemdecl)
* [files](#files)
* [provideBemdecl](#providebemdecl)
* [provideDeps](#providedeps)
* [mergeBemdecl](#mergebemdecl)
* [mergeDeps](#mergedeps)
* [subtractDeps](#subtractdeps)

levels
------

Собирает информацию о БЭМ-сущностях на уровнях переопределения. Результат выполнения этой технологии необходим следующим технологиям:

* [levelsToBemdecl](#levelstobemdecl)
* [deps](#deps)
* [files](#files)

Информация представляет собой экземпляр класса [Levels](../lib/levels/levels.js).

### Опции

* [target](#target)
* [levels](#levels-1)

#### target

Тип: `String`. По умолчанию: `?.levels`.

Имя таргета, в который будет записан результат сканирования уровней переопределения.

#### levels

Тип: `String[] | Object[]`.

Список путей до уровней переопределения.

Каждый путь может быть абсолютным или задаваться относительно корня проекта.

Вместо строки может использоваться объект вида `{ path: 'path/to/level', check: false }`.
Поле `path` является обязательным, а поле `check` по умолчанию равно `true`.

Допустимые значения поля `check`:

* `false` — используется, чтобы закэшировать содержимое уровня.
* `true` — уровень будет сканироваться заново каждый раз при сборке вне зависимости от наличия кэша.

--------------------------------------

**Пример**

```js
var bemTechs = require('enb-bem-techs');

module.exports = function (config) {
    config.node('bundle', function (node) {
        node.addTech([bemTechs.levels, {
            levels: [
                // В проекте не нужно менять код внешних библиотек,
                // достаточно один раз просканировать их уровни и использовать кэш.
                { path: 'libs/bem-core/common.blocks', check: false },
                { path: 'libs/bem-core/desktop.blocks', check: false },

                // Уровни проекта нужно сканировать перед каждой сборкой.
                { path: 'desktop.blocks', check: true },
            ]
        }]);
        node.addTarget('?.levels');
    });
}
```

levelsToBemdecl
---------------

Формирует BEMDECL-файл, состоящий из всех БЭМ-сущностей, найденных в указанных уровнях.

### Опции

* [source](#source)
* [target](#target-1)
* [bemdeclFormat](#bemdeclformat)

#### source

Тип: `String`. По умолчанию: `?.levels`.

Имя таргета, из которого будет доступен результат сканирования уровней переопределения ([Levels](../lib/levels/levels.js)). Информацию об уровнях переопределения предоставляет технология [levels](#levels).

#### target

Тип: `String`. По умолчанию: `?.bemdecl.js`.

Имя файла, в который будет записан BEMDECL-файл со всеми БЭМ-сущностями, найденными в уровнях переопределения.

#### bemdeclFormat

Тип: `String`. По умолчанию: `bemdecl`.

Формат результирующей декларации. Возможные значения:

* `bemdecl` — стандартный BEMDECL-формат.

  Пример:

  ```js
  { blocks: [{ name: 'b', elems: [{ name: 'e', mods: [{ name: 'm', vals: [{ name: 'v' }] }] }] }]}
  ```

* `deps` — формат результата `deps` техннологии.

  Пример:

  ```js
  { deps: [{ block: 'b', elem: 'e', mod: 'm', val: 'v' }] }
  ```

--------------------------------------

**Пример**

```js
var bemTechs = require('enb-bem-techs');

module.exports = function (config) {
    config.node('bundle', function (node) {
        node.addTechs([
            // Сканируем уровни проекта.
            // Результат записываем в `?.levels`,
            // т.к. опция `target` по умолчанию — `?.levels`.
            [bemTechs.levels, { levels: ['blocks'] }],

            // Строим BEMDECL-файл по результатам сканирования уровней.
            // Интроспекцию берем из `?.levels`,
            // т.к. опция `source` по умолчанию — `?.levels`.
            [bemTechs.levelsToBemdecl]
        ]);
        node.addTarget('?.bemdecl.js');
    });
};
```

bemjsonToBemdecl
----------------

Формирует BEMDECL-файл из [BEMJSON](https://ru.bem.info/technology/bemjson/)-файла.

### Опции

* [source](#source-1)
* [target](#target-2)
* [bemdeclFormat](#bemdeclformat-1)

#### source

Тип: `String`. По умолчанию: `?.bemjson.js`.

Имя [BEMJSON](https://ru.bem.info/technology/bemjson/)-файла, по которому будет построена декларация.

#### target

Тип: `String`. По умолчанию: `?.bemdecl.js`.

Имя создоваемого BEMDECL-файла.

#### bemdeclFormat

Тип: `String`. По умолчанию: `bemdecl`.

Формат результирующей декларации. Возможные значения:

* `bemdecl` — стандартный BEMDECL-формат.

  Пример:

  ```js
  { blocks: [{ name: 'b', elems: [{ name: 'e', mods: [{ name: 'm', vals: [{ name: 'v' }] }] }] }]}
  ```

* `deps` — формат результата `deps` техннологии.

  Пример:

  ```js
  { deps: [{ block: 'b', elem: 'e', mod: 'm', val: 'v' }] }
  ```

--------------------------------------

**Пример**

```js
var bemTechs = require('enb-bem-techs'),
    FileProviderTech = require('enb/techs/file-provider');

module.exports = function (config) {
    config.node('bundle', function (node) {
        node.addTechs([
            // Предоставляет BEMJSON-файл, написанный вручную, для ENB.
            // В опции `target` имя BEMJSON-файла.
            [FileProviderTech, { target: '?.bemjson.js' }],

            // Строим BEMDECL-файл по полученному BEMJSON-файлу.
            // BEMJSON-файл берем из `?.bemjson.js`,
            // т.к. опция `source` по умолчанию — `?.bemjson.js`.
            [bemTechs.bemjsonToBemdecl]
        ]);
        node.addTarget('?.bemdecl.js');
    });
};
```

deps
----

Дополняет декларацию БЭМ-сущностей на основе информации из технологий зависимостей (`deps.js` или `deps.yaml`).

### Опции

* [target](#target-3)
* [bemdeclFile](#bemdeclfile)
* [levelsTarget](#levelstarget)

#### target

Тип: `String`. По умолчанию: `?.deps.js`.

Имя собираемого файла с дополненной и упорядоченной декларацией БЭМ-сущностей.

#### bemdeclFile

Тип: `String`. По умолчанию: `?.bemdecl.js`.

Имя файла с исходной декларацией БЭМ-сущностей.

#### levelsTarget

Тип: `String`. По умолчанию: `?.levels`.

Имя таргета, из которого будет доступен результат сканирования уровней переопределения ([Levels](../lib/levels/levels.js)). Информацию об уровнях переопределения предоставляет технология [levels](#levels).

--------------------------------------

**Пример**

Раскрытие зависимостей по BEMDECL-файлу.

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

Раскрытие зависимостей по DEPS-файлу.

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

depsByTechToBemdecl
-------------------

Формирует BEMDECL-файл на основе зависимостей по технологиям (depsByTech). Такие зависимости описываются в `deps.js`-технологиях.

### Опции

* [target](#target-5)
* [sourceTech](#sourcetech)
* [destTech](#desttech)
* [filesTarget](#filestarget)
* [sourceSuffixes](#sourcesuffixes)
* [bemdeclFormat](#bemdeclformat-2)

#### target

Тип: `String`. По умолчанию: `?.bemdecl.js`.

Имя создоваемого BEMDECL-файла.

#### sourceTech

Тип: `String`. Обязательная опция.

Имя технологии, для которой собираются зависимости.

#### destTech

Тип: `String`.

Имя технологии, от которой зависит `sourceTech`.

#### filesTarget

Тип: `String`. По умолчанию: `?.files`.

Имя таргета, из которого будет доступен список исходных `deps.js` файлов для сборки. Список файлов предоставляет технология [files](#files).

#### sourceSuffixes

Тип: `String[]`. По умолчанию: `['deps.js']`.

Суффиксы файлов, по которым отбираются исходные файлы зависимостей для дальнейшей сборки.

#### bemdeclFormat

Тип: `String`. По умолчанию: `bemdecl`.

Формат результирующей декларации. Возможные значения:

* `bemdecl` — стандартный BEMDECL-формат.

  Пример:

  ```js
  { blocks: [{ name: 'b', elems: [{ name: 'e', mods: [{ name: 'm', vals: [{ name: 'v' }] }] }] }]}
  ```

* `deps` — формат результата `deps` техннологии.

  Пример:

  ```js
  { deps: [{ block: 'b', elem: 'e', mod: 'm', val: 'v' }] }
  ```

--------------------------------------

**Пример**

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
4. Получаем BEMDECL-файл на основании зависимостей по технологиям (?.tech.bemdecl.js).

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
            // Далее '?.bemhtml.bemdecl.js' можно использовать для сборки шаблонов,
            // которые используются в клиенском JavaScript.
            // Список `deps.js` файлов берем из `?.files`, т.к. опция filesTarget
            // по умолчанию — `?.files`.
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

Собирает список исходных файлов и директорий для сборки на основе декларации БЭМ-сущностей, а также результате сканирования уровней ([Levels](../lib/levels/levels.js)).

Результат будет записан в два таргета:
1. Список файлов — `?.files` таргет. Настраивается опцией [filesTarget](#filestarget).
2. Список директорий — `?.dirs` таргет. Настраивается опцией [dirsTarget](#dirstarget).

Каждый список представлен экземпляром класса [FileList](https://github.com/enb-make/enb/blob/master/lib/file-list.js).

Большинство технологий из других пакетов принимают на вход результат этой технологии.

### Опции

* [filesTarget](#filestarget-1)
* [dirsTarget](#dirstarget)
* [depsfile](#depsfile)
* [levelstarget](#levelstarget-2)

#### filesTarget

Тип: `String`. По умолчанию: `?.files`.

Имя таргета, в который будет записан список файлов.

#### dirsTarget

Тип: `String`. По умолчанию: `?.dirs`.

Имя таргета, в который будет записан список директорий.

#### depsFile

Тип: `String`. По умолчанию: `?.deps.js`.

Имя файла с декларацией БЭМ-сущностей.

#### levelsTarget

Тип: `String`. По умолчанию: `?.levels`.

Имя таргета, из которого будет доступен результат сканирования уровней переопределения ([Levels](../lib/levels/levels.js)). Информацию об уровнях переопределения предоставляет технология [levels](#levels).

--------------------------------------

**Пример**

Формирование списка файлов и директорий по BEMDECL-файлу.

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

Формирование списка файлов и директорий по DEPS-файлу.

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

Копирует BEMDECL-файл в текущую [ноду](#https://github.com/enb-make/enb#Терминология) (node) по указанному имени из указанной [ноды](#https://github.com/enb-make/enb#Терминология) (node) .

Может понадобиться для объединения BEMDECL-файлов из разных [нод](#https://github.com/enb-make/enb#Терминология) (node) .

### Опции

* [node](#node)
* [source](#source-2)
* [target](#target-6)

#### node

Тип: `String`. Обязательная опция.

Путь к [ноде](#https://github.com/enb-make/enb#Терминология) (node) с исходным BEMDECL-файлом.

#### source

Тип: `String`. По умолчанию: `?.bemdecl.js` (демаскируется в рамках исходной ноды).

Имя исходного BEMDECL-файла, который будет скопирован.

#### target

Тип: `String`. По умолчанию: `?.bemdecl.js` (демаскируется в рамках текущей ноды).

Имя создоваемого BEMDECL-файла.

--------------------------------------

**Пример**

```js
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

var bemTechs = require('enb-bem-techs');

module.exports = function (config) {
    config.node('bundle-3', function (node) {
        node.addTechs([
            // Копируем BEMDECL-файл из ноды `bundle-1` в `bundle-3`
            [bemTechs.provideBemdecl, {
                node: 'bundles/bundle-1',
                source: 'bundle-1.bemdecl.js',
                target: 'bundle-1.bemdecl.js'
            }],

            // Копируем BEMDECL-файл из ноды `bundle-2` в `bundle-3`
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

Копирует DEPS-файл в текущую [ноду](#https://github.com/enb-make/enb#Терминология) (node) по указанному имени из указанной [ноды](#https://github.com/enb-make/enb#Терминология) (node) .

Может понадобиться для объединения DEPS-файлов из разных [нод](#https://github.com/enb-make/enb#Терминология) (node) .

### Опции

* [node](#node)
* [source](#source-3)
* [target](#target-7)

#### node

Тип: `String`. Обязательная опция.

Путь к [ноде](#https://github.com/enb-make/enb#Терминология) (node) с исходным DEPS-файлом.

#### source

Тип: `String`. По умолчанию: `?.deps.js` (демаскируется в рамках исходной ноды).

Имя исходного DEPS-файла, который будет скопирован из указанной [ноды](#https://github.com/enb-make/enb#Терминология) (node).

#### target

Тип: `String`. По умолчанию: `?.deps.js` (демаскируется в рамках текущей ноды).

Имя создоваемого DEPS-файла.

--------------------------------------

**Пример**

```js
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

var bemTechs = require('enb-bem-techs');

module.exports = function (config) {
    config.node('bundle-3', function (node) {
        node.addTechs([
            // Копируем DEPS-файл из ноды `bundle-1` в `bundle-3`
            [bemTechs.provideDeps, {
                node: 'bundles/bundle-1',
                target: 'bundle-1.deps.js'
            }],

            // Копируем DEPS-файл из ноды `bundle-2` в `bundle-3`
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

Объединяет BEMDECL-файлы в один файл.

Может понадобиться для формирования `merged`-бандла.

### Опции

* [sources](#sources)
* [target](#target-8)

#### sources

Тип: `String[]`. Обязательная опция.

Список имен исходных BEMDECL-файлов, которые будут объединены.

#### target

Тип: `String`. По умолчанию: `?.bemdecl.js`.

Имя собираемого BEMDECL-файла.

--------------------------------------

**Пример**

```js
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

Объединяет DEPS-файлы и BEMDECL-файлы в результирующий DEPS-файл.

Может понадобиться для формирования `merged`-бандла.

### Опции

* [sources](#sources-1)
* [target](#target-9)

#### sources

Тип: `String[]`. Обязательная опция.

Список имен исходных DEPS-файлов, которые будут объединены.

#### target

Тип: `String`. По умолчанию: `?.bemdecl.js`.

Имя собираемого DEPS-файла.

--------------------------------------

**Пример**

```js
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

Формирует DEPS-файл, вычитая один DEPS-файл из другого.

### Опции

* [target](#target-10)
* [from](#from)
* [what](#what)

#### target

Тип: `String`. По умолчанию: `?.deps.js`.

Имя собираемого DEPS-файла.

#### from

Тип: `String`. Обязательная опция.

Имя DEPS-файла, из которого вычитают.

#### what

Тип: `String`. Обязательная опция.

Имя DEPS-файла, который вычитают.

--------------------------------------

**Пример**

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
