Сборка merged-бандла
====================

`Merged`-бандл содержит в себе набор всех БЭМ-сущностей из всех бандлов платформы. Основное отличие от обычного бандла заключается в том, что BEMDECL-файл создается автоматически из BEMDECL-файлов остальных бандлов.

О том, как собирать обычные бандлы, читайте в разделе «[Сборка бандла](build-bundle.md)».

Предположим, что у нас есть несколько бандлов, каждый из которых содержит BEMDECL-файл.

```sh
.enb/
└── make.js          # ENB-конфиг
desktop.blocks/       # уровень блоков
desktop.bundles/
├── index/
    └── index.bemdecl.js
├── price/
    └── price.bemdecl.js
├── blog/
    └── blog.bemdecl.js
└── contacts/
    └── contacts.bemdecl.js
```

Чтобы собрать `merged`-бандл следует:

1. Создать директорию для `merged`-бандла.
2. Найти все BEMDECL-файлы во всех бандлах, кроме `merged`.
3. Скопировать BEMDECL-файлы в `merged`-бандл.
4. Объединить скопированные BEMDECL-файлы.
5. Настроить сборку так же, как и в обычном бандле на основе объединенного BEMDECL-файла (3).

```js
var fs = require('fs'),
    path = require('path'),
    techs = require('enb-bem-techs'),
    provide = require('enb/techs/file-provider'),
    css = require('enb-css/techs/css'),
    js = require('enb-js/techs/browser-js.js')
    platforms = ['desktop'];

module.exports = function (config) {
    // Создаем директории для merged-бандлов (1)
    platforms.forEach(function (platform) {
        var node = path.join(platform + '.bundles', 'merged');

        if (!fs.existsSync(node)) {
            fs.mkdirSync(node);
        }
    });

    // Предоставляем BEMDECL-файлы из бандлов (2)
    config.nodes('*.bundles/*', function (nodeConfig) {
        var node = path.basename(nodeConfig.getPath());

        if (node !== 'merged') {
            nodeConfig.addTechs([
                [provide, { target: '?.bemdecl.js' }]
            ]);
        }
    });

    // Настраиваем сборку merged-бандла
    config.nodes('*.bundles/merged', function (nodeConfig) {
        var dir = path.dirname(nodeConfig.getPath()),
            bundles = fs.readdirSync(dir),
            bemdeclFiles = [];

        // Копируем BEMDECL-файлы в merged-бандл (3)
        bundles.forEach(function (bundle) {
            if (bundle === 'merged') return;

            var node = path.join(dir, bundle),
                target = bundle + '.bemdecl.js';

            nodeConfig.addTech([techs.provideBemdecl, {
                node: node,
                target: target
            }]);

            bemdeclFiles.push(target);
        });

        // Объединяем скопированные BEMDECL-файлы (4)
        nodeConfig.addTech([techs.mergeBemdecl, { sources: bemdeclFiles }]);

        // Обычная сборка бандла (5)
        nodeConfig.addTechs([
            [techs.levels, { levels: ['desktop.blocks'] }],
            [techs.deps],
            [techs.files],

            [css, { target: '?.css' }],
            [js, { target: '?.js' }]
        ]);

        nodeConfig.addTargets(['?.css', '?.js']);
    });
};
```

Запускаем сборку в консоли:

```sh
$ enb make
```

После сборки в директории `merged` будут созданы `merged.css` и `merged.js`, а также служебные файлы.

```sh
.enb/
desktop.blocks/
desktop.bundles/
├── index/
├── price/
├── blog/
├── contacts/
└── merged/
    ├── merged.bemdecl.js
        ...
    ├── merged.css
    └── merged.js
```
