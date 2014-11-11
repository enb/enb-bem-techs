Миграция
========

Во время перехода на новые версии следует:

1. Очистить результаты прошлых сборок `enb make clean`.
2. Собирать с новыми технологиями без учета кэша `enb make -n`.

Это нужно для того, чтобы технологии отработали правильно, не опираясь на результаты предыдущих сборок.

1.0.0
-----

Для версии `1.0.0` миграция подразумевается с пакета `enb` версии `0.13.x`.

### Обязательные требования

* [Технологии](#%D0%A2%D0%B5%D1%85%D0%BD%D0%BE%D0%BB%D0%BE%D0%B3%D0%B8%D0%B8)
* [Манипуляции с BEMDECL- и DEPS-файлами](#%D0%9C%D0%B0%D0%BD%D0%B8%D0%BF%D1%83%D0%BB%D1%8F%D1%86%D0%B8%D0%B8-%D1%81-bemdecl--%D0%B8-deps-%D1%84%D0%B0%D0%B9%D0%BB%D0%B0%D0%BC%D0%B8)
* [Получение BEMDECL-файла из BEMJSON и BEMDECL-файлов](#%D0%9F%D0%BE%D0%BB%D1%83%D1%87%D0%B5%D0%BD%D0%B8%D0%B5-bemdecl-%D1%84%D0%B0%D0%B9%D0%BB%D0%B0-%D0%B8%D0%B7-bemjson-%D0%B8-bemdecl-%D1%84%D0%B0%D0%B9%D0%BB%D0%BE%D0%B2)
* [Объединение BEMDECL-файлов из разных нод](#%D0%9E%D0%B1%D1%8A%D0%B5%D0%B4%D0%B8%D0%BD%D0%B5%D0%BD%D0%B8%D0%B5-bemdecl-%D1%84%D0%B0%D0%B9%D0%BB%D0%BE%D0%B2-%D0%B8%D0%B7-%D1%80%D0%B0%D0%B7%D0%BD%D1%8B%D1%85-%D0%BD%D0%BE%D0%B4)

#### Технологии

Вместо технологий из пакета `enb` следует использовать технологии из пакета `enb-bem-techs`.

**Внимание:** Из-за того, что некоторые технологии стали возвращать и принимать результаты в BEMDECL-формате,
необходимо перейти на новые технологии разом, а не постепенно.

* `enb/techs/levels` → `enb-bem-techs/techs/levels`
* `enb/techs/bemdecl-from-bemjson` → `enb-bem-techs/techs/bemjson-to-bemdecl`
* `enb/techs/deps` → `enb-bem-techs/techs/deps`
* `enb/techs/deps-old` → `enb-bem-techs/techs/deps-old`
* `enb/techs/bemdecl-from-deps-by-tech` → `enb-bem-techs/techs/deps-by-tech-to-bemdecl`
* `enb/techs/files` → `enb-bem-techs/techs/files`
* `enb/techs/bemdecl-provide` → `enb-bem-techs/techs/provide-bemdecl`
* `enb/techs/deps-provide` → `enb-bem-techs/techs/provide-deps`
* `enb/techs/bemdecl-merge` → `enb-bem-techs/techs/merge-bemdecl`
* `enb/techs/deps-merge` → `enb-bem-techs/techs/merge-deps`
* `enb/techs/deps-subtract` → `enb-bem-techs/techs/subtract-deps`

#### Манипуляции с BEMDECL- и DEPS-файлами

Чтобы объединить несколько BEMDECL-файлов, каждый из них должен быть представлен в BEMDECL-формате. Для формирования BEMDECL-файлов на основе других файлов следует использовать технологии, которые возвращают результат в BEMDECL-формате: `bemjson-to-bemdecl`, `deps-by-tech-to-bemdecl`, `merge-bemdecl` и `provide-bemdecl`.

Чтобы объединить несколько DEPS-файлов или вычесть один DEPS-файл из другого, каждый из них должен быть представлен в DEPS-формате. Для формирования DEPS-файлов на основе других файлов следует использовать технологии, которые возвращают результат в DEPS-формате: `merge-deps` и `provide-deps`.

#### Получение BEMDECL-файла из BEMJSON и BEMDECL-файлов

Дополняем BEMDECL-файл, построенный по BEMJSON-файлу, другим BEMDECL-файлом.

##### Было

```js
module.exports = function (config) {
    config.node('page', function (nodeConfig) {
        nodeConfig.addTechs([
            [require('enb/techs/file-provider'), { target: '?.bemjson.js' }],

            // Результат может быть как в DEPS-формате, так и в BEMDECL-формате
            [require('enb/techs/file-provider'), { target: 'required.bemdecl.js' }],

            // Результат в DEPS-формате, но по пути `?.bemdecl.js`
            [require('enb-bem-techs/techs/bemjson-to-bemdecl')],

            // Результат в DEPS-формате, но по пути `?.bemdecl.js`
            [require('enb-bem-techs/techs/bemdecl-merge'), {
                bemdeclSources: ['?.bemdecl.js', 'required.bemdecl.js'],
                bemdeclTarget: 'all.bemdecl.js'
            }],
            /* ... */
        ]);
    }
};
```

##### Стало

```js
var techs = require('enb-bem-techs'),
    provide = require('enb/techs/file-provider');

module.exports = function (config) {
    config.node('page', function (nodeConfig) {
        nodeConfig.addTechs([
            [provide, { target: '?.bemjson.js' }],

            // Результат должен быть в BEMDECL-формате
            [provide, { target: 'required.bemdecl.js' }],

            // Результат в BEMDECL-формате по пути `?.bemdecl.js`
            [techs.bemdeclToBemjson],

            // Результат в BEMDECL-формате по пути `?.bemdecl.js`
            [techs.mergeBemdecl, {
                sources: ['?.bemdecl.js', 'required.bemdecl.js'],
                target: 'all.bemdecl.js'
            }],
            /* ... */
        ]);
    }
};
```

#### Объединение BEMDECL-файлов из разных нод

Дополняем BEMDECL-файл текущей ноды (index) BEMDECL-файлом из другой ноды (common).

##### Было

```js
module.exports = function (config) {
    config.node('bundles/index', function (nodeConfig) {
        nodeConfig.addTechs([
            // Результат может быть как в DEPS-формате, так и в BEMDECL-формате
            [require('enb/techs/file-provider'), { target: '?.bemdecl.js' }],

            // Результат в DEPS-формате, но по пути `common.bemdecl.js`
            [require('enb-bem-techs/techs/bemdecl-provider'), {
                sourceNodePath: 'bundles/common',
                sourceTarget: 'common.bemdecl.js',
                depsTarget: 'common.bemdecl.js'
            }],

            // Результат в DEPS-формате, но по пути `all.bemdecl.js`
            [require('enb-bem-techs/techs/deps-bemdecl'), {
                depsSources: ['common.bemdecl.js', '?.bemdecl.js'],
                depsTarget: 'all.bemdecl.js'
            }],
            /* ... */
        ]);
    }
};
```

##### Стало

```js
var techs = require('enb-bem-techs'),
    provide = require('enb/techs/file-provider');

module.exports = function (config) {
    config.node('bundles/index', function (nodeConfig) {
        nodeConfig.addTechs([
            // Результат должен быть в BEMDECL-формате
            [provide, { target: '?.bemdecl.js' }],

            // Результат в BEMDECL-формате по пути `common.bemdecl.js`
            [techs.provideBemdecl, {
                node: 'bundles/common',
                source: 'common.bemdecl.js',
                target: 'common.bemdecl.js'
            }],

            // Результат в BEMDECL-формате по пути `all.bemdecl.js`
            [techs.mergeBemdecl, {
                sources: ['common.bemdecl.js', '?.bemdecl.js'],
                target: 'all.bemdecl.js'
            }],
            /* ... */
        ]);
    }
};
```

### Рекомендации

* [Подключение модулей технологий](#%D0%9F%D0%BE%D0%B4%D0%BA%D0%BB%D1%8E%D1%87%D0%B5%D0%BD%D0%B8%D0%B5-%D0%BC%D0%BE%D0%B4%D1%83%D0%BB%D0%B5%D0%B9-%D1%82%D0%B5%D1%85%D0%BD%D0%BE%D0%BB%D0%BE%D0%B3%D0%B8%D0%B9)
* [Сканирование уровней](#%D0%A1%D0%BA%D0%B0%D0%BD%D0%B8%D1%80%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5-%D1%83%D1%80%D0%BE%D0%B2%D0%BD%D0%B5%D0%B9)
* [Декларация бандлов](#%D0%94%D0%B5%D0%BA%D0%BB%D0%B0%D1%80%D0%B0%D1%86%D0%B8%D1%8F-%D0%B1%D0%B0%D0%BD%D0%B4%D0%BB%D0%BE%D0%B2)

#### Подключение модулей технологий

Вместо подключения каждого модуля технологии по принципу `require('enb/techs/tech-name')` следует получать
все базовые БЭМ-технологии с помощью `require('enb-bem-techs')`.

##### Было

```js
module.exports = function (config) {
    config.node('node', function (nodeConfig) {
        nodeConfig.addTechs([
            [require('enb/techs/levels'), { levels: getLevels(config) }],
            [require('enb/techs/file-provider'), { target: '?.bemjson.js' }],
            [require('enb/techs/bemjson-to-bemdecl')],
            [require('enb/techs/deps')],
            [require('enb/techs/files')],
            /* ... */
        ]);
    }
};
```

##### Стало

```js
var techs = require('enb-bem-techs'),
    provide = require('enb/techs/file-provider');

module.exports = function (config) {
    config.node('node', function (nodeConfig) {
        nodeConfig.addTechs([
            [techs.levels, { levels: getLevels(config) }],
            [provide, { target: '?.bemjson.js' }],
            [techs.bemjsonToBemdecl],
            [techs.deps],
            [techs.files],
            /* ... */
        ]);
    }
};
```

#### Сканирование уровней

Вместо абсолютных путей до уровней переопределения можно использовать пути относительно корня проекта.

##### Было

```js
module.exports = function (config) {
    config.node('node', function (nodeConfig) {
        nodeConfig.addTech([require('enb/techs/levels'), {
            levels: getLevels(config)
        }]);

        nodeConfig.addTarget('?.levels');
    });
};

function getLevels(config) {
    return [
        'common.blocks',
        'desktop.blocks'
    ].map(function(level) {
        return config.resolvePath(level);
    });
}
```

##### Стало

```js
var techs = require('enb-bem-techs');

module.exports = function (config) {
    config.node('node', function (nodeConfig) {
        nodeConfig.addTech([techs.levels, {
            levels: ['common.blocks', 'desktop.blocks']
        }]);

        nodeConfig.addTarget('?.levels');
    });
}
```

#### Декларация бандлов

Формировать список БЭМ-сущностей для бандла следует в BEMDECL-, а не в DEPS-формате.

##### Было

**bundle.bemdecl.js**

```js
exports.deps = [
    { block: 'input' },
    { block: 'input', mod: 'size', val: 's' },
    { block: 'input', mod: 'size', val: 'm' }
];
```

##### Стало

**bundle.bemdecl.js**

```js
exports.blocks = [
    {
        name: 'input',
        mods: [{ name: 'size', vals: [{ name: 's' }, { name: 'm' }]]
    }
];
```
