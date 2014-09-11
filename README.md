enb-bem
=======

[![NPM version](http://img.shields.io/npm/v/enb-bem.svg?style=flat)](http://www.npmjs.org/package/enb-bem) [![Build Status](http://img.shields.io/travis/enb-bem/enb-bem/master.svg?style=flat)](https://travis-ci.org/enb-bem/enb-bem) [![Coverage Status](https://img.shields.io/coveralls/enb-bem/enb-bem.svg?style=flat)](https://coveralls.io/r/enb-bem/enb-bem?branch=master) [![Dependency Status](http://img.shields.io/david/enb-bem/enb-bem.svg?style=flat)](https://david-dm.org/enb-bem/enb-bem)

Установка:
----------

```sh
$ npm install --save-dev enb-bem
```
Для работы модуля требуется зависимость от пакета enb версии `0.13.0` или выше.

Технологии
----------

* [`levels`](#levels)
* [`provide-bemdecl`](#provide-bemdecl)
* [`bemdecl-from-deps-by-tech`](#bemdecl-from-deps-by-tech)
* [`bemjson-to-bemdecl`](#bemjson-to-bemdecl)
* [`merge-bemdecl`](#merge-bemdecl)
* [`deps`](#deps)
* [`deps-old`](#deps-old)
* [`provide-deps`](#provide-deps)
* [`merge-deps`](#merge-deps)
* [`subtract-deps`](#subtract-deps)
* [`files`](#files)

### levels

Собирает информацию об уровнях переопределения проекта, предоставляет `?.levels`. Результат выполнения этой
технологии необходим технологиям `enb/techs/deps`, `enb/techs/deps-old` и `enb/techs/files`.

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию — `?.levels`.
* *(String|Object)[]* **levels** — Уровни переопределения. Полные пути к папкам с уровнями переопределения.
Вместо строки с путем к уровню может использоваться объект вида
`{path: '/home/user/www/proj/lego/blocks-desktop', check: false}` для того,
чтобы закэшировать содержимое тех уровней переопределения, которые не модифицируются в рамках проекта.

**Пример**

```javascript
nodeConfig.addTech([require('enb/techs/levels'), {
    levels: [
        {path: 'lego/blocks-desktop', check: false},
        'desktop.blocks'
    ].map(function (level) {
        return config.resolvePath(level);
    })
}]);
```

-------------------------------------------------------------------------------

### provide-bemdecl

Копирует `bemdecl` в текущую ноду под нужным именем из другой ноды. Может понадобиться, например, для объединения bemdecl'ов.

**Опции**

* *String* **node** — Путь исходной ноды с нужным bemdecl'ом. Обязательная опция.
* *String* **source** — Исходный bemdecl, который будет копироваться. По умолчанию — `?.bemdecl.js` (демаскируется в рамках исходной ноды).
* *String* **target** — Результирующий bemdecl-таргет. По умолчанию — `?.bemdecl.js` (демаскируется в рамках текущей ноды).

**Пример**

```javascript
nodeConfig.addTech([require('enb-bem/techs/provide-bemdecl'), {
    node: 'bundles/router',
    source: 'router.bemdecl.js',
    target: 'router.bemdecl.js'
}]);
```

-------------------------------------------------------------------------------

### bemdecl-from-deps-by-tech

Формирует `bemdecl` на основе depsByTech-информации из `?.deps.js`.

**Опции**

* *String* **sourceTech** — Имя исходной технологии. Обязательная опция.
* *String* **destTech** — Имя конечной технологии. Обязательная опция.
* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
* *String* **sourceSuffixes** — суффиксы файлов, по которым строится `files`-таргет. По умолчанию — `'deps.js'`.
* *String* **target** — Результирующий bemdecl-таргет. По умолчанию — `?.bemdecl.js`.

**Пример**

```javascript
nodeConfig.addTech(require('enb-bem/techs/bemdecl-from-deps-by-tech'), {
  sourceTech: 'js',
  destTech: 'bemhtml'
});
```

-------------------------------------------------------------------------------

### bemjson-to-bemdecl

Формирует `bemdecl` на основе `?.bemjson.js`.

**Опции**

* *String* **source** — Исходный bemjson-таргет. По умолчанию — `?.bemjson.js`.
* *String* **target** — Результирующий bemdecl-таргет. По умолчанию — `?.bemdecl.js`.

**Пример**

```javascript
nodeConfig.addTech(require('enb-bem/techs/bemdecl-from-bemjson'));
```
-------------------------------------------------------------------------------

### merge-bemdecl

Формирует `bemdecl` с помощью объединения других bemdecl-файлов.

**Опции**

* *String[]* **sources** — Исходные bemdecl-таргеты. Обязательная опция.
* *String* **target** — Результирующий bemdecl-таргет. По умолчанию — `?.bemdecl.js`.

**Пример**

```javascript
nodeConfig.addTech([require('enb-bem/techs/merge-bemdecl'), {
  sources: ['search.bemdecl.js', 'router.bemdecl.js'],
  target: 'all.bemdecl.js'
}]);
```

-------------------------------------------------------------------------------

### deps

Раскрывает зависимости. Сохраняет в виде `?.deps.js`.

**Опции**

* *String* **bemdeclFile** — Файл с исходными зависимостями. По умолчанию — `?.bemdecl.js`.
* *String* **levelsTarget** — Исходный levels. По умолчанию — `?.levels`.
* *String* **target** — Результирующий deps. По умолчанию — `?.deps.js`.

**Пример**

Обычное использование:
```javascript
nodeConfig.addTech(require('enb-bem/techs/deps'));
```

Сборка специфического deps:
```javascript
nodeConfig.addTech([require('enb-bem/techs/deps'), {
    sourceDepsFile: 'search.bemdecl.js',
    target: 'search.deps.js'
}]);
```

-------------------------------------------------------------------------------

### deps-old

Раскрывает зависимости. Сохраняет в виде `?.deps.js`. Использует алгоритм, заимствованный из bem-tools.

**Опции**

* *String* **bemdeclFile** — Файл с исходными зависимостями. По умолчанию — `?.bemdecl.js`.
* *String* **levelsTarget** — Исходный levels. По умолчанию — `?.levels`.
* *String* **target** — Результирующий deps. По умолчанию — `?.deps.js`.

**Пример**

Обычное использование:
```javascript
nodeConfig.addTech(require('enb-bem/techs/deps-old'));
```

Сборка специфического deps:
```javascript
nodeConfig.addTech([require('enb-bem/techs/deps-old'), {
    sourceDepsFile: 'search.bemdecl.js',
    target: 'search.deps.js'
}]);
```

-------------------------------------------------------------------------------

### provide-deps

Копирует `deps` в текущую ноду под нужным именем из другой ноды.
Может понадобиться, например, для объединения deps'ов.

**Опции**

* *String* **node** — Путь исходной ноды с нужным deps'ом. Обязательная опция.
* *String* **source** — Исходный deps, который будет копироваться.
По умолчанию — `?.deps.js` (демаскируется в рамках исходной ноды).
* *String* **target** — Результирующий deps-таргет.
По умолчанию — `?.deps.js` (демаскируется в рамках текущей ноды).

**Пример**

```javascript
nodeConfig.addTech([require('enb/techs/provide-deps'), {
    node: 'bundles/router',
    source: 'router.deps.js',
    target: 'router.deps.js'
}]);
```

-------------------------------------------------------------------------------

### merge-deps

Формирует `deps` с помощью объединения других deps-файлов.

**Опции**

* *String[]* **sources** — Исходные deps-таргеты. Обязательная опция.
* *String* **target** — Результирующий deps-таргет. По умолчанию — `?.deps.js`.

**Пример**

```javascript
nodeConfig.addTech([require('enb-bem/techs/merge-deps'), {
    sources: ['search.deps.js', 'router.deps.js'],
    target: 'all.deps.js'
}]);
```

-------------------------------------------------------------------------------

### subtract-deps

Формирует `deps` с помощью вычитания одного deps-файла из другого.
Может применяться в паре с `provide-deps` для получения deps для bembundle.

**Опции**

* *String* **from** — Таргет, из которого вычитать. Обязательная опция.
* *String* **what** — Таргет, который вычитать. Обязательная опция.
* *String* **target** — Результирующий deps-таргет. По умолчанию — `?.deps.js`.

**Пример**

```javascript
nodeConfig.addTechs([
    [require('enb-bem/techs/deps'), { target: 'router.tmp.deps.js' }],
    [require('enb-bem/techs/provide-deps'), {
        node: 'pages/index',
        target: 'index.deps.js'
    }],
    [require('enb-bem/techs/subtract-deps'), {
        what: 'index.deps.js',
        from: 'router.tmp.deps.js',
        target: 'router.deps.js'
    }]
]);
```

-------------------------------------------------------------------------------

### files

Собирает список исходных файлов для сборки на основе *deps* и *levels*, предоставляет `?.files` и `?.dirs`.
Используется многими технологиями, которые объединяют множество файлов из различных уровней переопределения в один.

**Опции**

* *String* **depsFile** — Исходный deps-таргет. По умолчанию — `?.deps.js`.
* *String* **levelsTarget** — Исходный levels. По умолчанию — `?.levels`.
* *String* **filesTarget** — Результирующий files-таргет. По умолчанию — `?.files`.
* *String* **dirsTarget** — Результирующий dirs-таргет. По умолчанию — `?.dirs`.

**Пример**

```javascript
nodeConfig.addTech(require('enb-bem/techs/files'));
```
