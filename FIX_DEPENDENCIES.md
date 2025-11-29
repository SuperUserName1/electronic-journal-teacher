# Исправление проблемы с зависимостями в electron-builder

## Проблема
При запуске собранного приложения возникает ошибка:
```
Error: Cannot find module 'knex'
```

## Решение

### Вариант 1: Пересборка с правильной конфигурацией

1. Убедитесь, что все зависимости установлены:
```bash
npm install
```

2. Соберите frontend:
```bash
npm run build
```

3. Создайте билд:
```bash
npm run package
```

### Вариант 2: Если проблема сохраняется

Electron-builder должен автоматически включать зависимости из `package.json`. Если проблема сохраняется:

1. Проверьте, что в `package.json` все зависимости указаны в `dependencies` (не в `devDependencies`)

2. Попробуйте явно указать зависимости в конфигурации:

Добавьте в `package.json` в секцию `build`:
```json
"build": {
  ...
  "nodeGypRebuild": false,
  "buildDependenciesFromSource": false
}
```

3. Очистите и пересоберите:
```bash
rm -rf dist node_modules/.cache
npm install
npm run build
npm run package
```

### Вариант 3: Использование electron-rebuild

Если проблема с нативными модулями (sqlite3):

1. Установите electron-rebuild:
```bash
npm install --save-dev electron-rebuild
```

2. Добавьте в `package.json` в секцию `scripts`:
```json
"postinstall": "electron-rebuild"
```

3. Переустановите зависимости:
```bash
npm install
```

### Проверка

После сборки проверьте структуру `dist/linux-unpacked/resources/app.asar` или распакуйте asar:
```bash
npx asar extract dist/linux-unpacked/resources/app.asar extracted
ls extracted/node_modules | grep knex
```

Если `knex` отсутствует, проблема в конфигурации electron-builder.

