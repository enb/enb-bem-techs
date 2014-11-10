Сборка дистрибутива
===================

Дистрибутив представляет собой набор бандлов, где каждый бандл — это сборка всех БЭМ-сущностей платформы проекта.

```sh
dist/
├── desktop/
├── touch-phone/
└── touch-pad/
```

О том, как собирать бандлы, читайте в разделе «[Сборка бандла](build-bundle.md)».

Наш проект состоит из трёх платформ: `desktop`, `touch-phone` и `touch-pad`:

* `desktop` включает в себя `common.blocks` и `desktop.blocks`
* `touch-phone` включает в себя `common.blocks`, `touch.blocks` и `touch-phone.blocks`
* `touch-pad` включает в себя `common.blocks`, `touch.blocks` и `touch-pad.blocks`

В файловой системе проект будет выглядеть так:

```sh
.enb/
└── make.js          # ENB-конфиг
common.blocks/       # общий уровень
desktop.blocks/      # уровень для десктопов
touch.blocks/        # общий уровень для тачей
touch-phone.blocks/  # уровень для тач-падов
touch-pad.blocks/    # уровень для тач-фонов
```

Чтобы собрать дистрибутив из `css` и `js` для каждой платформы нужно:

1. Просканировать уровни платформы, чтобы узнать, какие БЭМ-сущности существуют.
2. Сформировать BEMDECL-файл из всех БЭМ-сущностей, найденных в уровнях платформы (1).
3. Упорядочить список БЭМ-сущностей.
4. Получить упорядоченный список файлов по упорядоченному списку БЭМ-сущностей (3).

После это нужно воспользоваться технологиями для сборки `css` и `js`, и не забыть объявить таргеты, которые хотим собрать.

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
        // если её ещё не существует.
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

Запускаем сборку в консоли:

```sh
$ enb make
```

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

Аналогично можно собрать любые другие необходимые бандлы, например, включающие в себя шаблоны.
