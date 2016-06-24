Сборка страницы
===============

Страница — это частный случай бандла, и для её сборки также нужны список БЭМ-сущностей и уровни с исходным кодом блоков. О том, как собирать бандлы, читайте в разделе «[Сборка бандла](build-bundle.md)».

Основное отличие заключается в том, что страницы принято описывать в BEMJSON формате, а BEMDECL получать автоматически.

Пример BEMJSON-файла:

```js
module.exports = {
    block: 'page',
    content: 'Hello BEM!'
};
```

В файловой системе наш проект будет выглядеть так:

```sh
.enb/
└── make.js          # ENB-конфиг
blocks/              # уровень блоков
├── input/
    ├── input.deps.js
    ├── input.bemhtml.js
    ├── input.css
    └── input.js
├── button/
    ├── button.deps.js
    ├── button.bemhtml.js
    ├── button.css
    └── button.js
└── checkbox/
    ├── checkbox.deps.js
    ├── checkbox.bemhtml.js
    ├── checkbox.css
    └── checkbox.js
page/
└── page.bemjson.js  # описание страницы
```

Перед сборкой `css`, `js` и `html` нужно получить список исходных файлов, которые будут учавствовать в сборке.
Для этого нам понадобится:

1. Просканировать уровни, чтобы узнать, какие БЭМ-сущности существуют.
2. Прочитать BEMJSON-файл.
3. Составить список БЭМ-сущностей по BEMJSON-файлу (2).
4. Дополнить и упорядочить список БЭМ-сущностей (3) на основе информации о зависимостях (`input.deps.js`, `button.deps.js` и `checkbox.deps.js`) между БЭМ-сущностями (1).
5. Получить упорядоченный список файлов по упорядоченному списку БЭМ-сущностей (3), а также по интроспекции уровней (1).

После этого нужно воспользоваться технологиями для сборки `css` и `js`. А также собрать код шаблонов (BEMHTML или BH) и применить его к BEMJSON-файлу, чтобы получить HTML-файл.

И, как всегда, не забыть объявить таргеты, которые хотим собрать.

ENB-конфиг (.enb/make.js) будет выглядить следующим образом:

```js
// Подключаем модули технологий
var techs = require('enb-bem-techs'),
    provide = require('enb/techs/file-provider'),
    bemhtml = require('enb-bemxjst/techs/bemhtml'),
    html = require('enb-bemxjst/techs/html-from-bemjson'),
    css = require('enb/techs/css'),
    js = require('enb/techs/js');

module.exports = function(config) {
    // Настраиваем сборку бандла
    config.node('page', function(nodeConfig) {
        // Декларируем модули технологий,
        // которые могут учавствовать в сборке таргетов.
        nodeConfig.addTechs([
            // Используем базовые технологии, чтобы получить
            // список файлов, которые будут учавствовать в сборке.
            [techs.levels, { levels: ['blocks'] }],   // (1) -> `?.levels`
            [provide, { target: '?.bemjson.js' }],    // (2) -> `?.bemjson.js`
            [techs.bemjsonToBemdecl],                 // (3) -> `?.bemdecl.js`
            [techs.deps],                             // (4) `?.bemdecl.js` -> `?.deps.js`
            [techs.files],                            // (5) `?.levels` + `?.deps.js` -> `?.files`

            // Технологии принимают на вход список файлов. Таргет, в котором хранится список файлов,
            // задается опцией `filesTarget` (по умолчанию — `?.files`). Для сборки будут
            // использоваться только файлы, суффиксы которых указаны опцией `sourceSuffixes`.
            [css],     // Опция `sourceSuffixes` по умолчанию равна `['css']`
            [js],      // Опция `sourceSuffixes` по умолчанию равна `['js']`
            [bemhtml], // Опция `sourceSuffixes` по умолчанию равна `['bemhtml', 'bemhtml.xjst']`.

            // Технология принимает на вход `?.bemjson.js` и `?.bemhtml.js` таргеты.
            [html]
        ]);

        // Объявляем таргеты, которые хотим собрать.
        nodeConfig.addTargets(['?.css', '?.js', '?.html']);
    });
};
```

Запускаем сборку в консоли:

```sh
$ enb make
```

После сборки в директории `page` будут созданы `page.css`, `page.js` и `page.html`, а также служебные файлы.

```sh
.enb/
blocks/
page/
├── page.bemjson.js
    ...
├── page.html
├── page.css
└── page.js
```
