enb-bem-techs
=============

[![NPM version](https://img.shields.io/npm/v/enb-bem-techs.svg?style=flat)](https://www.npmjs.org/package/enb-bem-techs) [![Build Status](https://img.shields.io/travis/enb-bem/enb-bem-techs/master.svg?style=flat&label=tests)](https://travis-ci.org/enb-bem/enb-bem-techs) [![Build status](https://img.shields.io/appveyor/ci/blond/enb-bem-techs.svg?style=flat&label=windows)](https://ci.appveyor.com/project/blond/enb-bem-techs) [![Coverage Status](https://img.shields.io/coveralls/enb-bem/enb-bem-techs.svg?style=flat)](https://coveralls.io/r/enb-bem/enb-bem-techs?branch=master) [![Dependency Status](https://img.shields.io/david/enb-bem/enb-bem-techs.svg?style=flat)](https://david-dm.org/enb-bem/enb-bem-techs)

Пакет предоставляет набор базовых [ENB](http://enb-make.info/)-технологий, основная задача которых — подготовить промежуточный результат для технологий, которые ничего не знают о [БЭМ-методологии](https://ru.bem.info/method/) и о том, как устроен проект.

Большинство технологий из других пакетов в [ENB](http://enb-make.info/) ожидает на вход список файлов или директорий, а также информацию о требуемом порядке для их сборки.

**Технологии пакета `enb-bem-techs`:**

* [levels](docs/api.ru.md#levels)
* [levelsToBemdecl](docs/api.ru.md#levelstobemdecl)
* [bemjsonToBemdecl](docs/api.ru.md#bemjsontobemdecl)
* [deps](docs/api.ru.md#deps)
* [depsOld](docs/api.ru.md#depsold)
* [depsByTechToBemdecl](docs/api.ru.md#depsbytechtobemdecl)
* [files](docs/api.ru.md#files)
* [provideBemdecl](docs/api.ru.md#providebemdecl)
* [provideDeps](docs/api.ru.md#providedeps)
* [mergeBemdecl](docs/api.ru.md#mergebemdecl)
* [mergeDeps](docs/api.ru.md#mergedeps)
* [subtractDeps](docs/api.ru.md#subtractdeps)

Принципы работы технологий и их API описаны в документе [API технологий](docs/api.ru.md).

С чего начать?
--------------

Для создания проекта есть несколько способов:

* [project-stub](#project-stub)
* [генератор БЭМ-проектов](#Генератор-бэм-проектов)

### project-stub

Репозиторий для создания БЭМ-проектов. Содержит необходимый минимум конфигурационных файлов и директорий: собрано все самое необходимое и подключено по умолчанию.

Воспользуйтесь [инструкцией по установке project-stub](https://ru.bem.info/tutorials/project-stub/).

### Генератор БЭМ-проектов

[Генератор БЭМ-проектов](https://ru.bem.info/tools/bem/bem-stub/) осован на [Yeoman](http://yeoman.io/).

Вы можете сгенерировать проект, ответив на вопросы генератора, и получить проект точно, отвечающий вашим требованиям.

Документация
------------

* [API технологий](docs/api.ru.md)
* [Как устроены БЭМ-проекты](docs/bem-project.md)
* [Сборка бандла](docs/build-bundle.md)
* [Сборка страницы](docs/build-page.md)
* [Сборка merged-бандла](docs/build-merged-bundle.md)
* [Сборка дистрибутива](docs/build-dist.md)

Установка
---------

```sh
$ npm install --save-dev enb-bem-techs
```

**Требования**: зависимость от пакета `enb` версии `0.13.0` или выше.

Пакеты
------

### Стили

* [enb-stylus](https://github.com/enb-make/enb-stylus) — сборка `stylus`-файлов.
* [enb-autoprefixer](https://github.com/enb-make/enb-autoprefixer) — поддержка `autoprefixer`.

### Шаблонизация

* [enb-bh](https://github.com/enb-bem/enb-bh) — сборка BH-шаблонов.
* [enb-xjst](https://github.com/enb-bem/enb-xjst) — сборка BEMHTML и BEMTREE на основе `xjst`.
* [enb-bemxjst](https://github.com/enb-bem/enb-bemxjst) — сборка BEMHTML и BEMTREE на основе `bem-xjst`.

### Инфраструктура

* [enb-bem-examples](https://github.com/enb-bem/enb-bem-examples) — сборка БЭМ-примеров.
* [enb-bem-docs](https://github.com/enb-bem/enb-bem-docs) — сборка БЭМ-документации.
* [enb-bem-specs](https://github.com/enb-bem/enb-bem-specs) — сборка и запуск тестов для клиентского JavaScript.
* [enb-bem-tmpl-specs](https://github.com/enb-bem/enb-bem-tmpl-specs) — сборка и запуск тестов для БЭМ-шаблонов.
* [enb-magic-platform](https://github.com/enb-bem/enb-magic-platform) — платформа и dev-сервер для сборки БЭМ-проектов.

### Остальное

* [enb-borschik](https://github.com/enb-make/enb-borschik) — поддержка `borschik`.
* [enb-modules](https://github.com/enb-make/enb-modules) — поддержка `ym`.
* [enb-diverse-js](https://github.com/enb-make/enb-diverse-js) — поддержка паттерна `vanilla.js` + `node.js` + `browser.js`.
* [enb-bem-i18n](https://github.com/enb-bem/enb-bem-i18n) — поддержка `BEM.I18N`.

Лицензия
--------

© 2014 YANDEX LLC. Код лицензирован [Mozilla Public License 2.0](LICENSE.txt).
