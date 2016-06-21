Сборка бандла
=============

Для сборки бандла понадобится список БЭМ-сущностей и уровни с исходным кодом блоков. О том, как устроены уровни переопределения, читайте в [БЭМ-методологии](https://ru.bem.info/methodology/filesystem/).

Обычно список БЭМ-сущностей принято описывают в формате BEMDECL, например:

```js
exports.blocks = [
    { name: 'input' },
    { name: 'button' },
    { name: 'checkbox' }
];
```

В файловой системе наш проект будет выглядеть так:

```sh
.enb/
└── make.js          # ENB-конфиг
blocks/              # уровень блоков
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
└── bundle.bemdecl.js # список БЭМ-сущностей
```

Перед сборкой `css` и `js` нужно получить список исходных файлов, которые будут участвовать в сборке.
Для этого нам понадобится:

1. Просканировать уровни, чтобы узнать, какие БЭМ-сущности существуют.
2. Прочитать список БЭМ-сущностей, записанный в BEMDECL-файле.
3. Дополнить и упорядочить список БЭМ-сущностей (2) на основе информации о зависимостях (`input.deps.js`, `button.deps.js` и `checkbox.deps.js`) между БЭМ-сущностями (1).
4. Получить упорядоченный список файлов по упорядоченному списку БЭМ-сущностей (3), а также по интроспекции уровней (1).

После этого нужно воспользоваться технологиями для сборки `css` и `js`, и не забыть объявить таргеты, которые хотим собрать.

ENB-конфиг (.enb/make.js) будет выглядеть следующим образом:

```js
// Подключаем модули технологий
var techs = require('enb-bem-techs'),
    provide = require('enb/techs/file-provider'),
    css = require('enb-css/techs/css'),
    js = require('enb-js/techs/browser-js');

module.exports = function(config) {
    // Настраиваем сборку бандла
    config.node('bundle', function(nodeConfig) {
        // Декларируем модули технологий,
        // которые могут участвовать в сборке таргетов.
        nodeConfig.addTechs([
            // Используем базовые технологии, чтобы получить
            // список файлов, которые будут участвовать в сборке.
            [techs.levels, { levels: ['blocks'] }],   // (1) -> `?.levels`
            [provide, { target: '?.bemdecl.js' }],    // (2) -> `?.bemdecl.js`
            [techs.deps],                             // (3) `?.bemdecl.js` -> `?.deps.js`
            [techs.files],                            // (4) `?.levels` + `?.deps.js` -> `?.files`

            // Технологии принимают на вход список файлов. Таргет, в котором хранится список файлов,
            // задается опцией `filesTarget` (по умолчанию — `?.files`). Для сборки будут
            // использоваться только файлы, суффиксы которых указаны опцией `sourceSuffixes`.
            [css],     // Опция `sourceSuffixes` по умолчанию равна `['css']`
            [js, { target: '?.js' }]
        ]);

        // Объявляем таргеты, которые хотим собрать.
        nodeConfig.addTargets(['?.css', '?.js']);
    });
};
```

Запускаем сборку в консоли:

```sh
$ enb make
```

После сборки в директории `bundle` будут созданы `bundle.css` и `bundle.js`, а также служебные файлы.

```sh
.enb/
blocks/
bundle/
├── bundle.bemdecl.js
    ...
├── bundle.css
└── bundle.js
```
