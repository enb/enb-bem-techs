    # Сборка бандла

[Бандл](https://github.com/enb/enb/blob/master/docs/terms/terms.ru.md) — это файл, полученный в результате сборки исходных файлов проекта.

Для сборки бандла необходим список [БЭМ-сущностей](https://ru.bem.info/methodology/key-concepts/#БЭМ-сущность) и [уровни](https://ru.bem.info/methodology/redefinition-levels/) с исходным кодом блоков.

Список БЭМ-сущностей принято называть [декларацией](https://ru.bem.info/methodology/declarations/) и описывать в формате BEMDECL, например:

```js
exports.blocks = [
    { name: 'input' },
    { name: 'button' },
    { name: 'checkbox' }
];
```

## Пример сборки бандла

Сборка бандла рассмотрена на примере проекта:

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

Для сборки бандла необходимо выполнить следующие шаги:

1. Получить список исходных файлов, которые будут участвовать в сборке (для `css` и `js`).

    Для этого необходимо:

    **a.** Просканировать уровни и узнать, какие БЭМ-сущности существуют в проекте.

    **b.** Прочитать список БЭМ-сущностей, записанный в BEMDECL-файле.

    **c.** Дополнить и упорядочить список БЭМ-сущностей (b) на основе информации о зависимостях (`input.deps.js`, `button.deps.js` и `checkbox.deps.js`) между БЭМ- сущностями (a).

    **d.** Получить упорядоченный список файлов по упорядоченному списку БЭМ-сущностей (c), а также по интроспекции уровней (a).

2. Применить технологии для сборки (`css` и `js`) и объявить [таргеты](https://github.com/enb/enb/blob/master/docs/terms/terms.ru.md).

    [Make-файл](https://github.com/enb/enb/blob/master/docs/terms/terms.ru.md) ENB (.enb/make.js) будет выглядеть так:

    ```js
    // Подключаем модули технологий
    var techs = require('enb-bem-techs'),
        provide = require('enb/techs/file-provider'),
        css = require('enb-css/techs/css'), // npm install --save-dev enb-css
        js = require('enb-js/techs/browser-js'); // npm install --save-dev enb-js

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
                [js, { target: '?.js' }],      // Опция `sourceSuffixes` по умолчанию равна `['vanilla.js', 'js', 'browser.js']`
            ]);

            // Объявляем таргеты, которые нужно собрать.
            nodeConfig.addTargets(['?.css', '?.js']);
        });
    };
    ```

3. Запустить сборку в консоли:

    ```sh
    $ enb make
    ```

4. Проверить результат

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
