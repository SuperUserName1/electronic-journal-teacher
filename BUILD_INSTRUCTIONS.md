# Инструкции по сборке приложения

## Предварительные требования

### Для Linux (Fedora):
```bash
sudo dnf install -y nodejs npm
```

### Для Windows:
- Установите Node.js с официального сайта: https://nodejs.org/
- Установите Visual Studio Build Tools (для компиляции нативных модулей)

## Сборка приложения

### 1. Установка зависимостей
```bash
npm install
```

### 2. Сборка frontend (React)
```bash
npm run build
```

Это создаст файлы в `renderer/dist/`:
- `index.html`
- `bundle.js`

### 3. Создание запускаемых файлов

#### Для Linux (Fedora):
```bash
npm run package
```

Результат будет в `dist/`:
- **AppImage**: `ЭЖП Электронный Журнал Преподавателя-1.0.0.AppImage`

Для запуска:
```bash
chmod +x "dist/ЭЖП Электронный Журнал Преподавателя-1.0.0.AppImage"
./dist/ЭЖП\ Электронный\ Журнал\ Преподавателя-1.0.0.AppImage
```

#### Для Windows:
```bash
npm run package
```

Результат будет в `dist/`:
- **Установщик**: `ЭЖП Электронный Журнал Преподавателя-Setup-1.0.0.exe`

Запустите установщик и следуйте инструкциям.

## Решение проблем

### Белый экран при запуске

Если при запуске собранного приложения виден белый экран:

1. **Проверьте, что frontend собран:**
   ```bash
   npm run build
   ```

2. **Проверьте наличие файлов:**
   - `renderer/dist/index.html`
   - `renderer/dist/bundle.js`

3. **Откройте DevTools для отладки:**
   - В `main/main.js` временно добавьте `mainWindow.webContents.openDevTools();` даже в production
   - Или используйте горячую клавишу: `Ctrl+Shift+I` (Linux) / `F12` (Windows)

4. **Проверьте консоль на ошибки:**
   - Ошибки загрузки файлов обычно связаны с неправильными путями
   - Убедитесь, что `publicPath` в `webpack.config.js` установлен в `'./'` для production

### Проблемы с путями к файлам

Если файлы не загружаются:

1. **Проверьте `webpack.config.js`:**
   ```javascript
   publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
   ```

2. **Проверьте `main/main.js`:**
   ```javascript
   await mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
   ```

### Проблемы с зависимостями

Если возникают ошибки при сборке:

1. **Очистите кэш:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Пересоберите:**
   ```bash
   npm run build
   npm run package
   ```

## Создание билдов для разных платформ

### С Linux для Windows:
```bash
npm run build
npx electron-builder --win --x64
```

**Примечание**: Может потребоваться Wine для создания Windows-билдов на Linux.

### С Windows для Linux:
```bash
npm run build
npx electron-builder --linux
```

## Структура файлов после сборки

```
dist/
├── ЭЖП Электронный Журнал Преподавателя-1.0.0.AppImage  (Linux)
└── ЭЖП Электронный Журнал Преподавателя-Setup-1.0.0.exe  (Windows)
```

## Проверка работоспособности

После сборки проверьте:

1. ✅ Приложение запускается без белого экрана
2. ✅ Все страницы загружаются корректно
3. ✅ База данных создается в правильной директории
4. ✅ Экспорт файлов работает
5. ✅ Импорт студентов работает

## Отладка в production

Для отладки собранного приложения:

1. Добавьте в `main/main.js` после `createWindow()`:
   ```javascript
   if (process.env.NODE_ENV !== 'development') {
     mainWindow.webContents.openDevTools();
   }
   ```

2. Пересоберите и запустите приложение

3. Проверьте консоль на ошибки

