# Сборка дистрибутива

Дистрибутив — это набор [бандлов](https://github.com/enb/enb/blob/master/docs/terms.ru.md), где каждый бандл — это сборка всех БЭМ-сущностей для отдельной платформы проекта.

```sh
dist/
├── desktop/
├── touch-phone/
└── touch-pad/
```

> Как собирать бандлы, читайте в разделе [Сборка бандла](build-bundle.md).

## Пример сборки дистрибутива

Проект состоит из трех платформ:

* `desktop` — включает уровни `common.blocks` и `desktop.blocks`;
* `touch-phone` — включает уровни `common.blocks`, `touch.blocks` и `touch-phone.blocks`;
* `touch-pad` — включает уровни `common.blocks`, `touch.blocks` и `touch-pad.blocks`.

Файловая система проекта:

```sh
.enb/
└── make.js          # ENB-конфиг
common.blocks/       # общий уровень
desktop.blocks/      # уровень для десктопов
touch.blocks/        # общий уровень для тачей
touch-phone.blocks/  # уровень для тач-падов
touch-pad.blocks/    # уровень для тач-фонов
```

Чтобы собрать дистрибутив из `css` и `js` для каждой платформы необходимо:

1. Просканировать уровни платформы и узнать, какие БЭМ-сущности существуют в проекте.
2. Сформировать BEMDECL-файл из всех БЭМ-сущностей, найденных в уровнях платформы (1).
3. Упорядочить список БЭМ-сущностей.
4. Получить упорядоченный список файлов по упорядоченному списку БЭМ-сущностей (3).
5. Воспользоваться технологиями для сборки `css` и `js` и объявить [таргеты](https://github.com/enb/enb/blob/master/docs/terms.ru.md).

    ENB-конфиг (.enb/make.js) будет выглядеть следующим образом:

    ```js
    var techs = require('enb-bem-techs'),
        css = require('enb/techs/css'),
        js = require('enb/techs/js'),
        levels = {
            'desktop': ['common.blocks', 'desktop.blocks'],
            'touch-phone': ['common.blocks', 'touch.blocks', 'touch-phone.blocks'],
            'touch-pad': ['common.blocks', 'touch.blocks', 'touch-pad.blocks']
        },
        platforms = Object.keys(levels);

    module.exports = function (config) {
        platforms.forEach(function(platform) {
            var node = path.join('dist', platform);

            // Настраиваем сборку дистрибутива для конкретной платформы.
            // Метод `config.node` создаст директорию `dist/platform-name`,
            // если ее еще не существует.
            config.node(node, function(nodeConfig) {
                nodeConfig.addTechs([
                    [techs.levels, {
                        levels: levels[platform]  // (1) -> `?.levels`
                    }],
                    [techs.levelsToBemdecl],      // (2) `?.levels` -> `?.bemdecl.js`
                    [techs.deps],                 // (3) `?.bemdecl.js` -> `?.deps.js`
                    [techs.files],                // (4) `?.levels` + `?.deps.js` -> `?.files`

                    [css],
                    [js]
                ]);

                nodeConfig.addTargets(['?.css', '?.js']);
            }
        }
    };
    ```
6. Запустить сборку в консоли:

    ```sh
    $ enb make
    ```
7. Проверить результат.

    После сборки будет создана директория `dist` с поставками проекта по платформам.
    Для каждой платформы будет создана директория, содержащая в себе `css` и `js`, а также служебные файлы.

    ```sh
    .enb/
    common.blocks/
    desktop.blocks/
    touch.blocks/
    touch-phone.blocks/
    touch-pad.blocks/
    dist/
    ├── desktop/
            ...
        ├── desktop.css
        └── desktop.js
    ├── touch-phone/
            ...
        ├── touch-phone.css
        └── touch-phone.js
    └── touch-pad/
            ...
        ├── touch-pad.css
        └── touch-pad.js
    ```

Аналогично можно собрать другие необходимые бандлы, например, включающие в себя шаблоны.
