История изменений
=================

0.1.0
-----

Для версии `0.1.0` история изменений описана по отношению к пакету `enb@0.13.x`.

### Изменения, ломающие обратную совместимость

* Удалена вся логика, связанная с `BEViS` методологией.
* Технологии `bemjson-to-bemdecl`, `bemdecl-from-deps-by-tech` и `bemdecl-merge` теперь предоставляют результат в `bemdecl` формате, вместо `deps` формата.

### Крупные изменения

* Опция `levels` из `levels` технологии теперь может принимать пути относительно корня, вместо абсолютных.
* Технология `bemdecl-from-bemjson` переименована в `bemjson-to-bemdecl`.
* Технология `bemdecl-merge` переименована в `merge-bemdecl`.
* Технология `deps-merge` переименована в `merge-deps`.
* Технология `deps-subtract` переименована в `subtract-deps`.
* Технология `bemdecl-provider` переименована в `provide-bemdecl`.
* Технология `deps-provider` переименована в `provide-deps`.
* Опции `sourceTarget` и `destTarget` из `bemdecl-from-bemjson` технологии объявлены **deprecated**, вместо них следует использовать `source` и `target` соответственно.
* Опции `bemdeclSources` и `bemdeclTarget` из `merge-bemdecl` технологии объявлены **deprecated**, вместо них следует использовать `sources` и `target` соответственно.
* Опции `sourceNodePath`, `sourceTarget` и `bemdeclTarget` из `provide-bemdecl` технологии объявлены **deprecated**, вместо них следует использовать `node`, `source` и `target` соответственно.
* Опции `bemdeclTarget` и `depsTarget` из `deps` технологии объявлены **deprecated**, вместо них следует использовать `sourceDepsFile` и `target` соответственно.
* Опции `depsSources` и `depsTarget` из `merge-deps` технологии объявлены **deprecated**, вместо них следует использовать `sources` и `target` соответственно.
* Опции `bemdeclTarget` и `depsTarget` из `deps-old` технологии объявлены **deprecated**, вместо них следует использовать `sourceDepsFile` и `target` соответственно.
* Опции `sourceNodePath`, `sourceTarget` и `depsTarget` из `provide-deps` технологии объявлены **deprecated**, вместо них следует использовать `node`, `source` и `target` соответственно.
* Опции `subtractFromTarget`, `subtractWhatTarget` и `depsTarget` из `subtract-deps` технологии объявлены **deprecated**, вместо них следует использовать `from`, `what` и `target` соответственно.
* Опция `depsTarget` из `files` технологии объявлена **deprecated**, вместо неё следует использовать `depsFile`.

### Также в релиз вошли следующие изменения

* Модуль `vow` обновлён до версии `0.4.5`.
* Модуль `inherit` обновлён до версии `2.2.2`.
* Модуль `js-yaml` обновлён до версии `3.2.1`.
* Исправлена ошибка в `deps` и `deps-old` технологиях, из-за которой было невозможно выразить булевый модификатор со значением `true` в `deps` формате.
* Исправлена ошибка в `bemdecl-from-bemjson` технологии, связанная с `undefined` в `bemjson` формате.
