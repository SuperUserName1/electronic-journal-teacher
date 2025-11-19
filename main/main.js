const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const db = require('./database');
const backup = require('./backup');
const waitForServer = require('./wait-for-server');

let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    },
    icon: path.join(__dirname, '../assets/icon.png')
  });

  if (process.env.NODE_ENV === 'development') {
    const devServerURL = process.env.ELECTRON_DEV_SERVER_URL || 'http://127.0.0.1:3000';
    await waitForServer(devServerURL);
    await mainWindow.loadURL(devServerURL);
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
  }

  // Отключаем стандартное контекстное меню для основного окна
  mainWindow.webContents.on('context-menu', (e, params) => {
    const menu = Menu.buildFromTemplate([
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { type: 'separator' },
      { role: 'selectAll' }
    ]);
    menu.popup(mainWindow);
  });

  setupIPCListeners();
}

function setupIPCListeners() {
  // Студенты
  ipcMain.handle('get-students-by-group', async (event, groupName) => {
    return await db.getStudentsByGroup(groupName);
  });

  ipcMain.handle('import-students', async (event, filePath) => {
    return await db.importStudents(filePath);
  });

  // Курсы
  ipcMain.handle('get-courses', async () => {
    return await db.getCourses();
  });

  ipcMain.handle('create-course', async (event, courseData) => {
    return await db.createCourse(courseData);
  });

  // Занятия
  ipcMain.handle('get-lessons', async (event, courseId) => {
    return await db.getLessons(courseId);
  });

  ipcMain.handle('create-lesson', async (event, lessonData) => {
    return await db.createLesson(lessonData);
  });

  // Посещаемость
  ipcMain.handle('get-attendance', async (event, lessonId, groupName) => {
    return await db.getAttendance(lessonId, groupName);
  });

  ipcMain.handle('update-attendance', async (event, studentId, lessonId, status) => {
    return await db.updateAttendance(studentId, lessonId, status);
  });

  // Оценки
  ipcMain.handle('get-grades', async (event, lessonId, groupName) => {
    return await db.getGrades(lessonId, groupName);
  });

  ipcMain.handle('update-grade', async (event, studentId, lessonId, value) => {
    return await db.updateGrade(studentId, lessonId, value);
  });

  // Прогнозирование
  ipcMain.handle('forecast-student-performance', async (event, studentId, courseId) => {
    return await db.forecastStudentPerformance(studentId, courseId);
  });

  // Экспорт данных
  ipcMain.handle('export-data', async (event, options) => {
    return await backup.exportData(options);
  });

  // Резервное копирование
  ipcMain.handle('create-backup', async () => {
    return await backup.createBackup();
  });

  ipcMain.handle('restore-backup', async (event, backupPath) => {
    await backup.restoreBackup(backupPath);
    return true;
  });
}

function setupAppMenu() {
  const template = [
    {
      label: 'Файл',
      submenu: [
        { 
          label: 'Создать резервную копию', 
          click: async () => {
            try {
              const backupPath = await backup.createBackup();
              dialog.showMessageBox(mainWindow, {
                message: `Резервная копия создана: ${backupPath}`,
                type: 'info'
              });
            } catch (error) {
              dialog.showMessageBox(mainWindow, {
                message: 'Ошибка при создании резервной копии',
                type: 'error',
                detail: error.message
              });
            }
          }
        },
        { 
          label: 'Восстановить из резервной копии',
          click: async () => {
            const { filePaths } = await dialog.showOpenDialog(mainWindow, {
              title: 'Выберите файл резервной копии',
              filters: [{ name: 'Резервные копии', extensions: ['backup', 'db'] }]
            });
            
            if (filePaths && filePaths[0]) {
              try {
                await backup.restoreBackup(filePaths[0]);
                dialog.showMessageBox(mainWindow, {
                  message: 'Данные успешно восстановлены. Приложение будет перезапущено.',
                  type: 'info'
                });
                app.relaunch();
                app.exit();
              } catch (error) {
                dialog.showMessageBox(mainWindow, {
                  message: 'Ошибка при восстановлении данных',
                  type: 'error',
                  detail: error.message
                });
              }
            }
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Правка',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'Вид',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Справка',
      submenu: [
        {
          label: 'О программе',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              title: 'О программе',
              message: 'ЭЖП: Электронный Журнал Преподавателя',
              detail: 'Версия 1.0.0\n\nПрограмма для автоматизации рабочего процесса преподавателей высших учебных заведений.',
              type: 'info'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(async () => {
  db.initialize();
  await createWindow();
  setupAppMenu();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}).catch(error => {
  console.error('Ошибка при запуске приложения:', error);
  app.exit(1);
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});