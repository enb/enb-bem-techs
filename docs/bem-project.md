Как устроены БЭМ-проекты
========================

БЭМ-методология предпологает разделение интерфейса на независимые блоки.

```sh
blocks/
├── head/
├── footer/
├── logo/
├── button/
└── link/
```

Каждый блок может быть реализован в одной или нескольких технологиях.

```sh
button/
├── button.css
└── button.js
```

Элементы и модификаторы можно выносить в отдельные файлы. Например, это позволяет не собирать неиспользуемые сущности.

```sh
button/
├── __text/
│   ├── button__text.css
│   └── button__text.js
├── _focused/
│   ├── button_focused.css
│   └── button_focused.js
├── _type/
│   ├── button_type_link.css
│   ├── button_type_link.css
│   ├── button_type_submit.css
│   └── button_type_submit.js
├── button.css
└── button.js
```

В проекте может быть несколько уровней с блоками, например, для разделения кода по платформам.

```sh
src/
├── common.blocks/
│   ├── button/
│   └── link/
├── desktop.blocks/
│   └── button/
└── touch.blocks/
    └── link/
```

Примеры из жизни
----------------

* [bem-core](https://ru.bem.info/libs/bem-core/)
* [bem-components](https://ru.bem.info/libs/bem-components/)

Подробнее об организации БЭМ-проектов в файловой системе читайте в разделе [методология](https://ru.bem.info/method/filesystem/) на сайте [bem.info](https://ru.bem.info/).
