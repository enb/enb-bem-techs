enb-bem
=======

[![NPM version](https://badge.fury.io/js/enb-bem.svg)](http://badge.fury.io/js/enb-bem) [![Build Status](https://travis-ci.org/enb-bem/enb-bem.svg?branch=master)](https://travis-ci.org/enb-bem/enb-bem) [![Coverage Status](https://img.shields.io/coveralls/enb-bem/enb-bem.svg)](https://coveralls.io/r/enb-bem/enb-bem?branch=master) [![Dependency Status](https://david-dm.org/enb-bem/enb-bem.svg)](https://david-dm.org/enb-bem/enb-bem)

Установка:
----------

```sh
$ npm install --save-dev enb-bem
```
Для работы модуля требуется зависимость от пакета enb версии `0.13.0` или выше.

Технологии
----------

* [`bemdecl-from-bemjson`](#bemdecl-from-bemjson)
* [`bemdecl-from-deps-by-tech`](#bemdecl-from-deps-by-tech)
* [`bemdecl-merge`](#bemdecl-merge)
* [`bemdecl-provider`](#bemdecl-provider)
* [`deps`](#deps)
* [`deps-merge`](#deps-merge)
* [`deps-old`](#deps-old)
* [`deps-provider`](#deps-provider)
* [`deps-subtract`](#deps-subtract)
* [`files`](#files)
* [`levels`](#levels)

### bemdecl-from-bemjson

Формирует `bemdecl` на основе `?.bemjson.js`.

**Опции**

* *String* **source** — Исходный bemjson-таргет. По умолчанию — `?.bemjson.js`.
* *String* **target** — Результирующий bemdecl-таргет. По умолчанию — `?.bemdecl.js`.

**Пример**

```javascript
nodeConfig.addTech(require('enb-bem/techs/bemdecl-from-bemjson'));
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

### bemdecl-merge

Формирует `bemdecl` с помощью объединения других bemdecl-файлов.

**Опции**

* *String[]* **sources** — Исходные bemdecl-таргеты. Обязательная опция.
* *String* **target** — Результирующий bemdecl-таргет. По умолчанию — `?.bemdecl.js`.

**Пример**

```javascript
nodeConfig.addTech([require('enb-bem/techs/bemdecl-merge'), {
  sources: ['search.bemdecl.js', 'router.bemdecl.js'],
  target: 'all.bemdecl.js'
}]);
```

-------------------------------------------------------------------------------

### bemdecl-provider

Копирует `bemdecl` в текущую ноду под нужным именем из другой ноды. Может понадобиться, например, для объединения bemdecl'ов.

**Опции**

* *String* **node** — Путь исходной ноды с нужным bemdecl'ом. Обязательная опция.
* *String* **source** — Исходный bemdecl, который будет копироваться. По умолчанию — `?.bemdecl.js` (демаскируется в рамках исходной ноды).
* *String* **target** — Результирующий bemdecl-таргет. По умолчанию — `?.bemdecl.js` (демаскируется в рамках текущей ноды).

**Пример**

```javascript
nodeConfig.addTech([require('enb-bem/techs/bemdecl-provider'), {
    node: 'bundles/router',
    source: 'router.bemdecl.js',
    target: 'router.bemdecl.js'
}]);
```

-------------------------------------------------------------------------------

### deps

Раскрывает зависимости. Сохраняет в виде `?.deps.js`.

**Опции**

* *String* **sourceDepsFile** — Файл с исходными зависимостями. По умолчанию — `?.bemdecl.js`.
* *String* **format** — Формат исходных зависимостей. По умолчанию — `bemdecl`.
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

### deps-merge

Формирует `deps` с помощью объединения других deps-файлов.

**Опции**

* *String[]* **sources** — Исходные deps-таргеты. Обязательная опция.
* *String* **target** — Результирующий deps-таргет. По умолчанию — `?.deps.js`.

**Пример**

```javascript
nodeConfig.addTech([require('enb-bem/techs/deps-merge'), {
    sources: ['search.deps.js', 'router.deps.js'],
    target: 'all.deps.js'
}]);
```

-------------------------------------------------------------------------------

### deps-old

Раскрывает зависимости. Сохраняет в виде `?.deps.js`. Использует алгоритм, заимствованный из bem-tools.

**Опции**

* *String* **sourceDepsFile** — Файл с исходными зависимостями. По умолчанию — `?.bemdecl.js`.
* *String* **format** — Формат исходных зависимостей. По умолчанию — `bemdecl`.
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

### deps-provider

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
nodeConfig.addTech([require('enb/techs/deps-provider'), {
    node: 'bundles/router',
    source: 'router.deps.js',
    target: 'router.deps.js'
}]);
```

-------------------------------------------------------------------------------

### deps-subtract

Формирует `deps` с помощью вычитания одного deps-файла из другого.
Может применяться в паре с `deps-provider` для получения deps для bembundle.

**Опции**

* *String* **from** — Таргет, из которого вычитать. Обязательная опция.
* *String* **what** — Таргет, который вычитать. Обязательная опция.
* *String* **target** — Результирующий deps-таргет. По умолчанию — `?.deps.js`.

**Пример**

```javascript
nodeConfig.addTechs([
    [require('enb-bem/techs/deps'), { target: 'router.tmp.deps.js' }],
    [require('enb-bem/techs/deps-provider'), {
        node: 'pages/index',
        target: 'index.deps.js'
    }],
    [require('enb-bem/techs/deps-subtract'), {
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

-------------------------------------------------------------------------------

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
