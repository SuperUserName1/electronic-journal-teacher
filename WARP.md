# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is an Electron-based desktop application for teachers in higher education institutions. The application is called "ЭЖП: Электронный Журнал Преподавателя" (Electronic Journal Teacher) and helps manage student records, attendance, grades, courses, and generate analytics.

**Tech Stack:**
- **Frontend**: React 18 with React Router for navigation
- **Backend**: Electron main process with IPC communication
- **Database**: SQLite3 with Knex.js query builder
- **Bundling**: Webpack 5 with webpack-dev-server
- **UI**: Tailwind CSS (implied from class names) with Heroicons
- **Data Export**: XLSX and PDFKit for generating reports

## Development Commands

### Starting Development
```bash
npm start
```
This runs both the Electron app and webpack dev server concurrently. The dev server runs on port 3000, and Electron waits for it to be ready before loading.

### Build for Production
```bash
npm run build
```
Compiles the React renderer into production-ready static files at `renderer/dist/`.

### Package Application
```bash
npm run package
```
Uses electron-builder to create distributable packages:
- Windows: NSIS installer (x64)
- Linux: AppImage
- macOS: DMG

### Development Server Only
```bash
npm run dev
```
Runs webpack-dev-server without launching Electron. Useful for testing renderer UI changes.

## Project Architecture

### Directory Structure

```
electronic-journal-teacher/
├── main/                    # Electron main process
│   ├── main.js             # Entry point, window management, IPC setup
│   ├── database.js         # SQLite database operations with Knex
│   ├── backup.js           # Backup/restore and data export (XLSX/PDF)
│   ├── preload.js          # Context bridge for secure IPC
│   └── wait-for-server.js  # Dev server readiness check
├── renderer/               # React application
│   ├── src/
│   │   ├── index.js        # React entry point
│   │   ├── App.js          # Main app with routing
│   │   ├── components/     # Reusable components (Sidebar)
│   │   └── pages/          # Page components (Dashboard, Students, Courses, Analytics, Reports)
│   ├── public/
│   └── dist/               # Built output (git-ignored)
├── assets/                 # Application icons
└── scripts/                # Build and dev scripts
    └── start-electron.js   # Electron launcher for development
```

### Main Process (Electron)

**`main/main.js`**: Application entry point
- Creates the BrowserWindow with preload script
- Sets up application menu (File, Edit, View, Help)
- Handles backup/restore through menu actions
- Loads dev server URL in development or static files in production
- Initializes database on app ready

**`main/database.js`**: Database layer
- Uses Knex.js with SQLite3
- Database location: `app.getPath('userData')/journal.db`
- Schema tables: `students`, `courses`, `lessons`, `attendance`, `grades`
- Creates test data on first initialization
- Handles student import from CSV/XLSX files
- Implements student performance forecasting with linear regression

**`main/backup.js`**: Backup and export functionality
- Automatic backup management (keeps latest 5 backups)
- Exports data to XLSX or PDF formats
- Backup location: `app.getPath('userData')/backups/`

**`main/preload.js`**: Security bridge
- Exposes safe IPC API to renderer via `contextBridge`
- All database operations go through `window.api.*` methods
- No direct Node.js access from renderer

### Renderer Process (React)

**`renderer/src/App.js`**: Main application component
- Manages global state for active course and group
- Implements React Router with 5 main routes
- Loads courses and groups on mount
- Passes course/group context to child pages

**Pages:**
- **Dashboard**: Main journal view with lessons, attendance, and grades table
- **Students**: Student management and import functionality
- **Courses**: Course creation and management
- **Analytics**: Student performance analytics and forecasting
- **Reports**: Generate and export reports (XLSX/PDF)

### IPC Communication Pattern

All communication follows this pattern:

1. **Renderer** → calls `window.api.methodName(args)`
2. **Preload** → invokes IPC: `ipcRenderer.invoke('channel-name', args)`
3. **Main** → handles: `ipcMain.handle('channel-name', async (event, args) => { ... })`
4. **Main** → calls database or backup module
5. **Main** → returns result through IPC
6. **Renderer** → receives promise resolution

### Database Schema

**students**
- `id`, `full_name`, `group_name`, `record_book_number` (unique)

**courses**
- `id`, `name`, `semester`

**lessons**
- `id`, `course_id` (FK), `date`, `topic`, `homework`, `homework_deadline`, `type`, `weight`

**attendance**
- `id`, `student_id` (FK), `lesson_id` (FK), `status` ('п' = present, 'н' = absent)
- Unique constraint on (student_id, lesson_id)

**grades**
- `id`, `student_id` (FK), `lesson_id` (FK), `value`
- Unique constraint on (student_id, lesson_id)

### Key Features

1. **Student Import**: Supports CSV and XLSX files with automatic field mapping
2. **Performance Forecasting**: Uses linear regression to calculate grade trends and predict final performance
3. **Risk Assessment**: Identifies at-risk students based on attendance, grade trends, and current average
4. **Weighted Grading**: Different lesson types have different weights (lecture: 1.0, practice: 1.5, test: 2.0)
5. **Data Export**: Generates formatted XLSX spreadsheets and PDF reports
6. **Automatic Backups**: Creates timestamped database backups, auto-deletes old ones

## Development Notes

### Environment Variables
- `NODE_ENV=development`: Triggers dev mode (dev server, DevTools)
- `ELECTRON_DEV_SERVER_URL`: Override dev server URL (default: http://127.0.0.1:3000)

### Development Flow
The app uses `concurrently` to run webpack-dev-server and Electron simultaneously. The `wait-for-server.js` utility ensures Electron doesn't launch until the dev server is responsive (max 30 attempts, 1s intervals).

### Security Model
- Context isolation enabled
- No Node.js integration in renderer
- All privileged operations go through preload script
- Preload exposes minimal, specific API surface

### Localization
The application is in Russian. All UI text, database content, and generated reports use Russian language and locale settings (`ru` from date-fns).

### Testing
No test framework is currently configured in the project. When adding tests, check for common JavaScript/Electron test patterns in the ecosystem.

## Common Development Tasks

### Adding a New IPC Handler

1. Define handler in `main/main.js` within `setupIPCListeners()`
2. Add database method in `main/database.js` if needed
3. Expose in `main/preload.js` via `window.api`
4. Call from renderer using `window.api.methodName()`

### Adding a New Page

1. Create component in `renderer/src/pages/`
2. Add route in `renderer/src/App.js` `<Routes>` block
3. Add navigation item in `renderer/src/components/Sidebar.js`
4. Pass necessary props (course, group) from App.js

### Modifying Database Schema

1. Update table creation in `main/database.js` `createTables()`
2. Consider migration strategy for existing user databases
3. Update corresponding CRUD methods
4. Update IPC handlers if needed

### Adding Export Format

1. Add new export function in `main/backup.js`
2. Update `exportData()` to handle new format
3. Add format option in Reports page UI
4. Test with sample data

## Build Configuration

### electron-builder Settings
- **App ID**: com.electronicjournal.teacher
- **Output dir**: dist/
- **Included files**: main/, renderer/, assets/icons/
- **Windows**: NSIS installer with user-controlled directory
- **Linux**: AppImage in Education category
- **macOS**: DMG package

### Webpack Configuration
- Entry: `renderer/src/index.js`
- Output: `renderer/dist/bundle.js`
- Dev server: port 3000, hot reload enabled
- Babel: ES6+ and JSX transpilation
- Loaders: babel-loader for JS/JSX, style-loader + css-loader for CSS
