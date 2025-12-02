# Руководство по очистке базы данных и созданию билдов

## Очистка базы данных

База данных приложения хранится в пользовательской директории. Путь зависит от операционной системы:

### Расположение базы данных

- **Linux**: `~/.config/electronic-journal-teacher/journal.db`
- **Windows**: `%APPDATA%/electronic-journal-teacher/journal.db`
- **macOS**: `~/Library/Application Support/electronic-journal-teacher/journal.db`

### Способы очистки

#### 1. Полное удаление базы данных (удалит все данные)

**Linux (Fedora):**
```bash
rm ~/.config/electronic-journal-teacher/journal.db
```

**Windows (PowerShell):**
```powershell
Remove-Item "$env:APPDATA\electronic-journal-teacher\journal.db"
```

**Windows (CMD):**
```cmd
del "%APPDATA%\electronic-journal-teacher\journal.db"
```

#### 2. Удаление через интерфейс приложения

1. Откройте приложение
2. Перейдите в меню **Файл** → **Создать резервную копию** (опционально, для сохранения данных)
3. Закройте приложение
4. Удалите файл базы данных по пути выше
5. При следующем запуске приложение создаст новую пустую базу данных

#### 3. Программная очистка через SQLite

Если у вас установлен SQLite CLI:

```bash
sqlite3 ~/.config/electronic-journal-teacher/journal.db
```

Затем выполните:
```sql
-- Удалить все данные из всех таблиц
DELETE FROM attendance;
DELETE FROM grades;
DELETE FROM lessons;
DELETE FROM students;
DELETE FROM courses;

-- Или удалить все таблицы и пересоздать их
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS grades;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS courses;
```

После этого закройте приложение и откройте снова - таблицы будут пересозданы автоматически.

#### 4. Удаление всей директории приложения

Для полной очистки всех данных приложения (включая резервные копии и экспорты):

**Linux:**
```bash
rm -rf ~/.config/electronic-journal-teacher
```

**Windows:**
```powershell
Remove-Item -Recurse -Force "$env:APPDATA\electronic-journal-teacher"
```

## Создание запускаемых файлов

### Предварительные требования

1. **Node.js** (версия 16 или выше)
2. **npm** (обычно устанавливается вместе с Node.js)
3. Для Windows: **Visual Studio Build Tools** (для компиляции нативных модулей)
4. Для Linux: **build-essential** и другие инструменты разработки

### Установка зависимостей

```bash
npm install
```

### Создание билдов

#### Для Linux (Fedora и другие дистрибутивы)

```bash
npm run build
npm run package
```

Результат будет в директории `dist/`:
- **AppImage**: `ЭЖП Электронный Журнал Преподавателя-1.0.0.AppImage`

AppImage - это самодостаточный исполняемый файл, который можно запускать напрямую:

```bash
chmod +x "dist/ЭЖП Электронный Журнал Преподавателя-1.0.0.AppImage"
./dist/ЭЖП\ Электронный\ Журнал\ Преподавателя-1.0.0.AppImage
```

#### Для Windows

**Вариант 1: Установщик (NSIS)**
```bash
npm run build
npm run package-win-installer
```

**Вариант 2: Портативная версия (Portable EXE)**
```bash
npm run build
npm run package-win-portable
```

**Вариант 3: Оба варианта (установщик + portable)**
```bash
npm run build
npm run package-win
```

Результат будет в директории `dist/`:
- **Установщик NSIS**: `ЭЖП: Электронный Журнал Преподавателя-Setup-1.0.0.exe`
- **Портативная версия**: `ЭЖП: Электронный Журнал Преподавателя-Portable-1.0.0.exe`

Установщик можно распространять для установки приложения. Портативная версия не требует установки - достаточно запустить exe файл.

### Настройка electron-builder

Конфигурация находится в `package.json` в секции `"build"`. Вы можете настроить:

- **appId**: Идентификатор приложения
- **productName**: Название продукта
- **icon**: Путь к иконке
- **artifactName**: Шаблон имени файла

### Создание билдов для конкретной платформы

#### Только Linux:
```bash
npm run build
npx electron-builder --linux
```

#### Только Windows:
```bash
npm run build
npx electron-builder --win
```

#### Только macOS:
```bash
npm run build
npx electron-builder --mac
```

### Создание билдов для другой платформы (кроссплатформенная сборка)

#### С Linux для Windows:
```bash
npm run build
npx electron-builder --win --x64
```

**Примечание**: Для создания Windows-билдов на Linux может потребоваться установка Wine и других инструментов.

#### С Windows для Linux:
```bash
npm run build
npx electron-builder --linux
```

### Оптимизация размера билда

1. Убедитесь, что в `package.json` в секции `build.files` указаны только необходимые файлы
2. Используйте `asar` архивацию (включена по умолчанию)
3. Исключите ненужные зависимости из `node_modules`

### Отладка проблем сборки

1. **Проверьте логи**: electron-builder выводит подробные логи при сборке
2. **Очистите кэш**: `rm -rf node_modules dist && npm install`
3. **Проверьте зависимости**: убедитесь, что все зависимости установлены
4. **Проверьте права доступа**: на Linux может потребоваться `sudo` для некоторых операций

### Распространение билдов

#### Linux (AppImage):
- Файл AppImage можно распространять напрямую
- Пользователи могут запускать его без установки
- Для интеграции в систему можно использовать `appimagetool`

#### Windows (NSIS):
- Распространяйте `.exe` файл установщика
- Пользователи запускают установщик и следуют инструкциям
- Приложение будет установлено в `Program Files` или выбранную директорию

### Дополнительные команды

```bash
# Показать конфигурацию electron-builder
npx electron-builder --help

# Создать билд без упаковки (только сборка)
npm run build

# Очистить директорию dist
rm -rf dist
```

## Резервное копирование перед очисткой

Перед очисткой базы данных рекомендуется создать резервную копию:

1. В приложении: **Файл** → **Создать резервную копию**
2. Или вручную скопируйте файл `journal.db` в безопасное место

Резервные копии хранятся в:
- **Linux**: `~/Documents/EJP-Exports/` (для экспортов) и `~/.config/electronic-journal-teacher/backups/` (для бэкапов)
- **Windows**: `%USERPROFILE%\Documents\EJP-Exports\` и `%APPDATA%\electronic-journal-teacher\backups\`

## Восстановление из резервной копии

1. В приложении: **Файл** → **Восстановить из резервной копии**
2. Выберите файл `.db` или `.backup`
3. Приложение перезапустится автоматически

