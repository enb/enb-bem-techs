# Сборка страницы

Страница — это частный случай [бандла](https://github.com/enb/enb/blob/master/docs/terms/terms.ru.md). Для сборки страницы также нужны список [БЭМ-сущностей](https://ru.bem.info/methodology/key-concepts/#БЭМ-сущность) и [уровни](https://ru.bem.info/methodology/redefinition-levels/) с исходным кодом блоков.

> Как собирать бандлы, читайте в разделе [Сборка бандла](../build-bundle/build-bundle.ru.md).

Основное отличие заключается в том, что страницы принято описывать в формате [BEMJSON](https://ru.bem.info/platform/bemjson/), а [BEMDECL](https://ru.bem.info/methodology/declarations/) получать автоматически.

Пример BEMJSON-файла:

```js
module.exports = {
    block: 'page',
    content: 'Hello BEM!'
};
```

## Пример сборки страницы

Сборка страницы рассмотрена на примере проекта:

```sh
.enb/
└── make.js          # ENB-конфиг
blocks/              # уровень блоков
├── input/
    ├── input.deps.js
    ├── input.bemhtml
    ├── input.css
    └── input.js
├── button/
    ├── button.deps.js
    ├── button.bemhtml
    ├── button.css
    └── button.js
└── checkbox/
    ├── checkbox.deps.js
    ├── checkbox.bemhtml
    ├── checkbox.css
    └── checkbox.js
page/
└── page.bemjson.js  # описание страницы
```

Для сборки страницы необходимо выполнить следующие шаги:

1. Получить список исходных файлов, которые будут участвовать в сборке (для `css` и `js`)

    Для этого нам понадобится:

    **a.** Просканировать уровни и узнать, какие БЭМ-сущности существуют в проекте.

    **b.** Прочитать BEMJSON-файл.

    **c.** Составить список БЭМ-сущностей по BEMJSON-файлу (b).

    **d.** Дополнить и упорядочить список БЭМ-сущностей (c) на основе информации о зависимостях (`input.deps.js`, `button.deps.js` и `checkbox.deps.js`) между БЭМ-сущностями (a).

    **e.** Получить упорядоченный список файлов по упорядоченному списку БЭМ-сущностей (c), а также по интроспекции уровней (a).

2. Воспользоваться технологиями для сборки `css` и `js`.

3. Собрать код [шаблонов](https://ru.bem.info/platform/bem-xjst/8/) (BEMHTML или BH) и применить его к BEMJSON-файлу, чтобы получить HTML-файл.

4. Объявить [таргеты](https://github.com/enb/enb/blob/master/docs/terms/terms.ru.md).

    ENB-конфиг (.enb/make.js) будет выглядить следующим образом:

    ```js
    // Подключаем модули технологий
    var techs = require('enb-bem-techs'),
        provide = require('enb/techs/file-provider'),
        bemhtml = require('enb-bemxjst/techs/bemhtml'), // npm install --save-dev enb-bemxjst
        html = require('enb-bemxjst/techs/bemjson-to-html'),
        css = require('enb-css/techs/css'), // npm install --save-dev enb-css
        js = require('enb-js/techs/browser-js'); // npm install --save-dev enb-js

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
                [js, { target: '?.js' }],      // Опция `sourceSuffixes` по умолчанию равна `['vanilla.js', 'js', 'browser.js']`
                [bemhtml], // Опция `sourceSuffixes` по умолчанию равна `['bemhtml', 'bemhtml.xjst']`.

                // Технология принимает на вход `?.bemjson.js` и `?.bemhtml.js` таргеты.
                [html]
            ]);

            // Объявляем таргеты, которые хотим собрать.
            nodeConfig.addTargets(['?.css', '?.js', '?.html']);
        });
    };
    ```

5. Запустить сборку в консоли:

    ```sh
    $ enb make
    ```

6. Проверить результат.

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
