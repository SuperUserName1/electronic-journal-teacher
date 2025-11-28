const electron = require('electron');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const PdfPrinter = require('pdfmake');

let pdfmakeFontsPath = null;
try {
  const pdfmakePackageDir = path.dirname(require.resolve('pdfmake/package.json'));
  const possiblePaths = [
    path.join(pdfmakePackageDir, 'fonts'),
    path.join(pdfmakePackageDir, 'examples', 'fonts')
  ];

  for (const candidate of possiblePaths) {
    if (
      fs.existsSync(path.join(candidate, 'Roboto-Regular.ttf')) &&
      fs.existsSync(path.join(candidate, 'Roboto-Medium.ttf'))
    ) {
      pdfmakeFontsPath = candidate;
      break;
    }
  }

  if (!pdfmakeFontsPath) {
    console.warn('Шрифты pdfmake не найдены, PDF-экспорт может быть недоступен');
  }
} catch (error) {
  console.error('Не удалось определить путь к шрифтам pdfmake:', error);
}

const PAGE_WIDTH_A4 = 842; // points

function resolveUserDataPath() {
  const app = electron.app || electron.remote?.app;
  if (!app || typeof app.getPath !== 'function') {
    throw new Error('Electron app is not initialized yet');
  }
  return app.getPath('userData');
}

function resolveDbPath() {
  return path.join(resolveUserDataPath(), 'journal.db');
}

function resolveBackupsDir() {
  return path.join(resolveUserDataPath(), 'backups');
}

function resolveExportsDir() {
  const app = electron.app || electron.remote?.app;
  if (!app || typeof app.getPath !== 'function') {
    throw new Error('Electron app is not initialized yet');
  }
  const documentsPath = app.getPath('documents');
  return path.join(documentsPath, 'EJP-Exports');
}

async function ensureBackupsDir() {
  const backupsDir = resolveBackupsDir();
  try {
    await fs.promises.access(backupsDir);
  } catch {
    await fs.promises.mkdir(backupsDir, { recursive: true });
  }
}

async function ensureExportsDir() {
  const exportsDir = resolveExportsDir();
  try {
    await fs.promises.access(exportsDir);
  } catch {
    await fs.promises.mkdir(exportsDir, { recursive: true });
  }
}

function safeFileName(name) {
  return name.replace(/[\\/:*?"<>|]/g, '_');
}

async function createBackup() {
  const dbPath = resolveDbPath();
  const backupsDir = resolveBackupsDir();
  await ensureBackupsDir();
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `journal-backup-${timestamp}.db`;
  const backupPath = path.join(backupsDir, backupFileName);
  
  await fs.promises.copyFile(dbPath, backupPath);
  
  // Удаляем старые резервные копии, оставляя только последние 5
  const files = await fs.promises.readdir(backupsDir);
  const backupFiles = files
    .filter(f => f.startsWith('journal-backup-') && f.endsWith('.db'))
    .sort((a, b) => new Date(b.replace('journal-backup-', '').replace('.db', '')) - 
                new Date(a.replace('journal-backup-', '').replace('.db', '')));
  
  if (backupFiles.length > 5) {
    for (let i = 5; i < backupFiles.length; i++) {
      await fs.promises.unlink(path.join(backupsDir, backupFiles[i]));
    }
  }
  
  return backupPath;
}

async function restoreBackup(backupPath) {
  const dbPath = resolveDbPath();
  if (!fs.existsSync(backupPath)) {
    throw new Error('Файл резервной копии не существует');
  }
  
  await fs.promises.copyFile(backupPath, dbPath);
}

async function exportData(options) {
  const { format, data, fileName } = options;
  const exportsDir = resolveExportsDir();
  await ensureExportsDir();
  
  // Генерируем уникальное имя файла
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  const exportFileName = `${safeFileName(baseName)}-${timestamp}.${format}`;
  const exportPath = path.join(exportsDir, exportFileName);
  
  if (format === 'xlsx') {
    return exportToXLSX(data, exportPath);
  } else if (format === 'pdf') {
    return exportToPDF(data, exportPath);
  } else {
    throw new Error('Неподдерживаемый формат экспорта');
  }
}

async function exportToXLSX(data, filePath) {
  const wb = XLSX.utils.book_new();
  
  // Создаем лист с ведомостью
  const wsData = [
    ['Ведомость успеваемости', '', '', '', ''],
    ['Курс:', data.course, '', 'Группа:', data.group],
    ['Семестр:', data.semester, '', '', ''],
    ['', '', '', '', ''],
    ['Студент', 'Номер зачетной книжки', ...data.lessons.map(l => l.date), 'Средний балл']
  ];
  
  // Добавляем данные студентов
  data.students.forEach(student => {
    const row = [
      student.name,
      student.record_book_number,
      ...data.lessons.map(lesson => {
        const grade = student.grades[lesson.id] || '';
        const attendance = student.attendance[lesson.id] || 'н';
        return `${grade}${grade && attendance ? '/' : ''}${attendance}`;
      }),
      student.average || ''
    ];
    wsData.push(row);
  });
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Ведомость');
  
  // Сохраняем файл
  XLSX.writeFile(wb, filePath);
  return filePath;
}

async function exportToPDF(data, filePath) {
  if (!pdfmakeFontsPath) {
    throw new Error('Не найден пакет pdfmake для генерации PDF');
  }

  const fontsDir = pdfmakeFontsPath;
  const fonts = {
    Roboto: {
      normal: path.join(fontsDir, 'Roboto-Regular.ttf'),
      bold: path.join(fontsDir, 'Roboto-Medium.ttf'),
      italics: path.join(fontsDir, 'Roboto-Italic.ttf'),
      bolditalics: path.join(fontsDir, 'Roboto-MediumItalic.ttf')
    }
  };

  const printer = new PdfPrinter(fonts);

  const lessonHeaders = data.lessons.map(lesson => lesson.date);
  const tableBody = [
    ['Студент', 'Зачетная книжка', ...lessonHeaders, 'Средний балл'],
    ...data.students.map(student => ([
      student.name,
      student.record_book_number,
      ...data.lessons.map(lesson => {
        const grade = student.grades[lesson.id] || '';
        const attendance = student.attendance[lesson.id] || '';
        if (!grade && !attendance) return '';
        return `${grade}${grade && attendance ? '\n' : ''}${attendance || ''}`;
      }),
      student.average || ''
    ]))
  ];

  const docDefinition = {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [30, 40, 30, 40],
    content: [
      { text: 'Ведомость успеваемости', style: 'header', alignment: 'center', margin: [0, 0, 0, 10] },
      {
        columns: [
          [
            { text: `Курс: ${data.course}`, style: 'info' },
            { text: `Группа: ${data.group}`, style: 'info' },
            { text: `Семестр: ${data.semester}`, style: 'info' }
          ],
          {
            text: `Сформировано: ${new Date().toLocaleString('ru-RU')}`,
            alignment: 'right',
            style: 'info'
          }
        ],
        margin: [0, 0, 0, 10]
      },
      {
        table: {
          headerRows: 1,
          widths: (() => {
            const horizontalMargin = 30 + 30;
            const availableWidth = PAGE_WIDTH_A4 - horizontalMargin;
            const fixedColumns = 180 + 90 + 80;
            const remaining = Math.max(120, availableWidth - fixedColumns);
            const perLesson = Math.max(30, Math.floor(remaining / Math.max(1, data.lessons.length)));
            return [
              180,
              90,
              ...data.lessons.map(() => perLesson),
              80
            ];
          })(),
          body: tableBody
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? '#f3f4f6' : rowIndex % 2 === 0 ? '#fafafa' : null),
          hLineColor: () => '#e5e7eb',
          vLineColor: () => '#e5e7eb'
        }
      }
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true
      },
      info: {
        fontSize: 10,
        margin: [0, 2, 0, 0]
      }
    },
    defaultStyle: {
      font: 'Roboto',
      fontSize: 9
    }
  };

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const stream = fs.createWriteStream(filePath);
      pdfDoc.pipe(stream);
      pdfDoc.end();
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

async function exportStudentsList(students, groupName) {
  const wb = XLSX.utils.book_new();
  const wsData = [
    ['Список студентов'],
    [`Группа: ${groupName}`],
    ['', '', ''],
    ['ФИО', 'Группа', 'Номер зачетной книжки']
  ];

  students.forEach(student => {
    wsData.push([
      student.full_name,
      student.group_name,
      student.record_book_number
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Студенты');

  const exportsDir = resolveExportsDir();
  await ensureExportsDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeGroup = groupName ? safeFileName(groupName) : 'group';
  const filePath = path.join(exportsDir, `students-${safeGroup}-${timestamp}.xlsx`);
  XLSX.writeFile(wb, filePath);
  return filePath;
}

module.exports = {
  createBackup,
  restoreBackup,
  exportData,
  exportToXLSX,
  exportToPDF,
  exportStudentsList
};