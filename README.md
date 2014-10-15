enb-bem-techs
=============

[![NPM version](http://img.shields.io/npm/v/enb-bem-techs.svg?style=flat)](http://www.npmjs.org/package/enb-bem-techs) [![Build Status](http://img.shields.io/travis/enb-bem/enb-bem-techs/master.svg?style=flat)](https://travis-ci.org/enb-bem/enb-bem-techs) [![Coverage Status](https://img.shields.io/coveralls/enb-bem/enb-bem-techs.svg?style=flat)](https://coveralls.io/r/enb-bem/enb-bem-techs?branch=master) [![Dependency Status](http://img.shields.io/david/enb-bem/enb-bem-techs.svg?style=flat)](https://david-dm.org/enb-bem/enb-bem-techs)

Пакет для сборки проектов, в основе которых лежит [БЭМ-методология](http://ru.bem.info/method/).

Установка
----------

```sh
$ npm install --save-dev enb-bem-techs
```

Для работы модуля требуется зависимость от пакета `enb` версии `0.13.0` или выше.

Как устроены БЭМ-проекты?
-------------------------

БЭМ-методология предпологает разделение интерфейса на независимые блоки.

```sh
blocks/
├── head/
├── footer/
├── logo/
├── button/
└── link/
```

Каждый блок может быть реализован в одной или нескольких технологиях.

```sh
button/
├── button.css
└── button.js
```

Если в блоках есть элементы или модификаторы, которые используются не всегда, их реализация выносится в отдельные файлы.

```sh
button/
├── __text/
│   ├── button__text.css
│   └── button__text.js
├── _focused/
│   ├── button_focused.css
│   └── button_focused.js
├── _type/
│   ├── button_type_link.css
│   └── button_type_link.js
├── button.css
└── button.js
```

В проекте может быть несколько уровней с блоками, например, для разделения кода по платформам.

```sh
src/
├── common.blocks/
│   ├── button/
│   └── link/
├── desktop.blocks/
│   └── button/
└── touch.blocks/
    └── link/
```

Примеры из жизни:

* [bem-core](http://ru.bem.info/libs/bem-core/current/)
* [bem-components](http://ru.bem.info/libs/bem-components/current/)

Подробнее об организации БЭМ-проектов в файловой системе читайте в разделе [методология](http://ru.bem.info/method/filesystem/) на сайте [bem.info](http://ru.bem.info/).

С чего начать?
--------------

Воспользуйтесь [инструкцией по установке project-stub](http://ru.bem.info/tutorials/project-stub/), чтобы создать БЭМ-проект, настроенный для сборки с помощью ENB.

Для создания проекта, подходящего под ваши задачи, ответьте на&nbsp;вопросы [генератора БЭМ-проектов](http://ru.bem.info/tools/bem/bem-stub/), основанного&nbsp;на [Yeoman](http://yeoman.io/).

Технологии
----------

* [levels](#levels)
* [levels-to-bemdecl](#levels-to-bemdecl)
* [provide-bemdecl](#provide-bemdecl)
* [deps-by-tech-to-bemdecl](#deps-by-tech-to-bemdecl)
* [bemjson-to-bemdecl](#bemjson-to-bemdecl)
* [merge-bemdecl](#merge-bemdecl)
* [deps](#deps)
* [deps-old](#deps-old)
* [provide-deps](#provide-deps)
* [merge-deps](#merge-deps)
* [subtract-deps](#subtract-deps)
* [files](#files)

### levels

Собирает информацию об уровнях переопределения проекта и предоставляет `?.levels`. Результат выполнения этой технологии необходим следующим технологиям:

* `enb-bem-techs/techs/deps`
* `enb-bem-techs/techs/deps-old`
* `enb-bem-techs/techs/files`

**Опции**

* *String* **target** — результирующий таргет. По умолчанию — `?.levels`.
* *(String|Object)[]* **levels** — уровни переопределения. Полные пути к папкам с уровнями переопределения.
Вместо строки с путем к уровню может использоваться объект вида
`{path: '/home/user/www/proj/lego/blocks-desktop', check: false}` для того,
чтобы закэшировать содержимое тех уровней переопределения, которые не модифицируются в рамках проекта.

**Пример**

```javascript
nodeConfig.addTech([require('enb-bem-techs/techs/levels'), {
    levels: [
        {path: 'lego/blocks-desktop', check: false},
        'desktop.blocks'
    ].map(function (level) {
        return config.resolvePath(level);
    })
}]);
```

-------------------------------------------------------------------------------

### levels-to-bemdecl

Формирует BEMDECL, состоящий из всех сущностей, найденных на уровнях.

**Опции**

* *String* **target** — результирующий BEMDECL-таргет. По умолчанию — `?.bemdecl.js`.
* *String* **source** — исходный `levels`. По умолчанию — `?.levels`.

**Пример**

```javascript
nodeConfig.addTech(require('enb-bem-techs/techs/levels-to-bemdecl'));
```

-------------------------------------------------------------------------------

### provide-bemdecl

Копирует BEMDECL в текущую ноду под нужным именем из другой ноды. Может понадобиться, например, для объединения BEMDECL'ов.

**Опции**

* *String* **node** — путь исходной ноды с нужным BEMDECL'ом. Обязательная опция.
* *String* **source** — исходный BEMDECL, который будет копироваться. По умолчанию — `?.bemdecl.js` (демаскируется в рамках исходной ноды).
* *String* **target** — результирующий BEMDECL-таргет. По умолчанию — `?.bemdecl.js` (демаскируется в рамках текущей ноды).

**Пример**

```javascript
nodeConfig.addTech([require('enb-bem-techs/techs/provide-bemdecl'), {
    node: 'bundles/router',
    source: 'router.bemdecl.js',
    target: 'router.bemdecl.js'
}]);
```

-------------------------------------------------------------------------------

### deps-by-tech-to-bemdecl

Формирует BEMDECL на основе `depsByTech`-информации из `?.deps.js`.

**Опции**

* *String* **sourceTech** — имя исходной технологии. Обязательная опция.
* *String* **destTech** — имя конечной технологии.
* *String* **filesTarget** — `files`-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
* *String* **sourceSuffixes** — суффиксы файлов, по которым строится `files`-таргет. По умолчанию — `'deps.js'`.
* *String* **target** — результирующий BEMDECL-таргет. По умолчанию — `?.bemdecl.js`.

**Пример**

```javascript
nodeConfig.addTech(require('enb-bem-techs/techs/deps-by-tech-to-bemdecl'), {
  sourceTech: 'js',
  destTech: 'bemhtml'
});
```

-------------------------------------------------------------------------------

### bemjson-to-bemdecl

Формирует BEMDECL на основе `?.bemjson.js`.

**Опции**

* *String* **source** — исходный BEMJSON-таргет. По умолчанию — `?.bemjson.js`.
* *String* **target** — результирующий BEMDECL-таргет. По умолчанию — `?.bemdecl.js`.

**Пример**

```javascript
nodeConfig.addTech(require('enb-bem-techs/techs/bemdecl-from-bemjson'));
```
-------------------------------------------------------------------------------

### merge-bemdecl

Формирует BEMDECL с помощью объединения других BEMDECL-файлов.

**Опции**

* *String[]* **sources** — исходные BEMDECL-таргеты. Обязательная опция.
* *String* **target** — результирующий BEMDECL-таргет. По умолчанию — `?.bemdecl.js`.

**Пример**

```javascript
nodeConfig.addTech([require('enb-bem-techs/techs/merge-bemdecl'), {
  sources: ['search.bemdecl.js', 'router.bemdecl.js'],
  target: 'all.bemdecl.js'
}]);
```

-------------------------------------------------------------------------------

### deps

Раскрывает зависимости. Сохраняет в виде `?.deps.js`.

**Опции**

* *String* **bemdeclFile** — файл с исходными зависимостями. По умолчанию — `?.bemdecl.js`.
* *String* **levelsTarget** — исходный `levels`. По умолчанию — `?.levels`.
* *String* **target** — результирующий `deps`. По умолчанию — `?.deps.js`.

**Пример**

Обычное использование:

```javascript
nodeConfig.addTech(require('enb-bem-techs/techs/deps'));
```

Сборка специфического `deps`:

```javascript
nodeConfig.addTech([require('enb-bem-techs/techs/deps'), {
    sourceDepsFile: 'search.bemdecl.js',
    target: 'search.deps.js'
}]);
```

-------------------------------------------------------------------------------

### deps-old

Раскрывает зависимости. Сохраняет в виде `?.deps.js`. Использует алгоритм, заимствованный из [bem-tools](http://ru.bem.info/tools/bem/bem-tools/).

**Опции**

* *String* **bemdeclFile** — файл с исходными зависимостями. По умолчанию — `?.bemdecl.js`.
* *String* **levelsTarget** — исходный `levels`. По умолчанию — `?.levels`.
* *String* **target** — результирующий `deps`. По умолчанию — `?.deps.js`.

**Пример**

Обычное использование:

```javascript
nodeConfig.addTech(require('enb-bem-techs/techs/deps-old'));
```

Сборка специфического `deps`:

```javascript
nodeConfig.addTech([require('enb-bem-techs/techs/deps-old'), {
    sourceDepsFile: 'search.bemdecl.js',
    target: 'search.deps.js'
}]);
```

-------------------------------------------------------------------------------

### provide-deps

Копирует `deps` в текущую ноду под нужным именем из другой ноды.
Может понадобиться, например, для объединения `deps`'ов.

**Опции**

* *String* **node** — путь исходной ноды с нужным `deps`'ом. Обязательная опция.
* *String* **source** — исходный `deps`, который будет копироваться.
По умолчанию — `?.deps.js` (демаскируется в рамках исходной ноды).
* *String* **target** — результирующий `deps`-таргет.
По умолчанию — `?.deps.js` (демаскируется в рамках текущей ноды).

**Пример**

```javascript
nodeConfig.addTech([require('enb-bem-techs/techs/provide-deps'), {
    node: 'bundles/router',
    source: 'router.deps.js',
    target: 'router.deps.js'
}]);
```

-------------------------------------------------------------------------------

### merge-deps

Формирует `deps` с помощью объединения других `deps`-файлов.

**Опции**

* *String[]* **sources** — исходные `deps`-таргеты. Обязательная опция.
* *String* **target** — результирующий `deps`-таргет. По умолчанию — `?.deps.js`.

**Пример**

```javascript
nodeConfig.addTech([require('enb-bem-techs/techs/merge-deps'), {
    sources: ['search.deps.js', 'router.deps.js'],
    target: 'all.deps.js'
}]);
```

-------------------------------------------------------------------------------

### subtract-deps

Формирует `deps` с помощью вычитания одного `deps`-файла из другого.
Может применяться в паре с `provide-deps` для получения `deps` для `bembundle`.

**Опции**

* *String* **from** — таргет, из которого вычитать. Обязательная опция.
* *String* **what** — таргет, который вычитать. Обязательная опция.
* *String* **target** — результирующий `deps`-таргет. По умолчанию — `?.deps.js`.

**Пример**

```javascript
nodeConfig.addTechs([
    [require('enb-bem-techs/techs/deps'), { target: 'router.tmp.deps.js' }],
    [require('enb-bem-techs/techs/provide-deps'), {
        node: 'pages/index',
        target: 'index.deps.js'
    }],
    [require('enb-bem-techs/techs/subtract-deps'), {
        what: 'index.deps.js',
        from: 'router.tmp.deps.js',
        target: 'router.deps.js'
    }]
]);
```

-------------------------------------------------------------------------------

### files

Собирает список исходных файлов для сборки на основе `deps` и `levels`, предоставляет `?.files` и `?.dirs`.
Используется многими технологиями, которые объединяют множество файлов из различных уровней переопределения в один.

**Опции**

* *String* **depsFile** — исходный `deps`-таргет. По умолчанию — `?.deps.js`.
* *String* **levelsTarget** — исходный `levels`. По умолчанию — `?.levels`.
* *String* **filesTarget** — результирующий `files`-таргет. По умолчанию — `?.files`.
* *String* **dirsTarget** — результирующий `dirs`-таргет. По умолчанию — `?.dirs`.

**Пример**

```javascript
nodeConfig.addTech(require('enb-bem-techs/techs/files'));
```
