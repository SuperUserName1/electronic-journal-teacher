const electron = require('electron');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');

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

async function ensureBackupsDir() {
  const backupsDir = resolveBackupsDir();
  try {
    await fs.promises.access(backupsDir);
  } catch {
    await fs.promises.mkdir(backupsDir, { recursive: true });
  }
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
  const backupsDir = resolveBackupsDir();
  await ensureBackupsDir();
  
  // Генерируем уникальное имя файла
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const exportFileName = `${fileName.replace(/\.[^/.]+$/, '')}-${timestamp}.${format}`;
  const exportPath = path.join(backupsDir, exportFileName);
  
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
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });
      
      // Поток для записи в файл
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      
      // Заголовок
      doc.fontSize(20).text('Ведомость успеваемости', { align: 'center' });
      doc.moveDown();
      
      // Информация о курсе и группе
      doc.fontSize(12)
        .text(`Курс: ${data.course}`)
        .text(`Группа: ${data.group}`)
        .text(`Семестр: ${data.semester}`);
      doc.moveDown();
      
      // Таблица с данными
      const tableTop = doc.y;
      const columnWidths = [
        200, // ФИО студента
        100, // Зачетная книжка
        ...Array(data.lessons.length).fill(60), // Занятия
        80  // Средний балл
      ];
      const rowHeight = 25;
      const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
      
      // Заголовки таблицы
      doc.font('Helvetica-Bold');
      doc.rect(50, tableTop, tableWidth, rowHeight).fillAndStroke('#f0f0f0', '#000');
      
      let x = 50;
      const headers = [
        'Студент',
        'Зачетная книжка',
        ...data.lessons.map(l => l.date),
        'Средний балл'
      ];
      
      headers.forEach((header, i) => {
        doc.text(header, x + 5, tableTop + 5, { width: columnWidths[i] - 10 });
        x += columnWidths[i];
      });
      
      // Данные студентов
      doc.font('Helvetica');
      let y = tableTop + rowHeight;
      
      data.students.forEach((student, rowIndex) => {
        // Заливка для четных строк
        if (rowIndex % 2 === 0) {
          doc.fillColor('#f9f9f9')
            .rect(50, y, tableWidth, rowHeight)
            .fill();
        }
        
        doc.fillColor('#000');
        
        // ФИО и зачетная книжка
        doc.text(student.name, 55, y + 5, { width: columnWidths[0] - 10 });
        doc.text(student.record_book_number, 50 + columnWidths[0] + 5, y + 5, { width: columnWidths[1] - 10 });
        
        // Оценки и посещаемость
        let currentX = 50 + columnWidths[0] + columnWidths[1];
        data.lessons.forEach((lesson, lessonIndex) => {
          const grade = student.grades[lesson.id] || '';
          const attendance = student.attendance[lesson.id] || 'н';
          const cellText = `${grade}${grade && attendance ? '/' : ''}${attendance}`;
          
          doc.text(cellText, currentX + 5, y + 5, { width: columnWidths[lessonIndex + 2] - 10 });
          currentX += columnWidths[lessonIndex + 2];
        });
        
        // Средний балл
        doc.text(student.average || '', currentX + 5, y + 5, { width: columnWidths[columnWidths.length - 1] - 10 });
        
        y += rowHeight;
      });
      
      doc.moveDown();
      doc.fontSize(10).text(`Сформировано: ${new Date().toLocaleString('ru-RU')}`, 50, doc.y);
      
      // Закрываем документ
      doc.end();
      
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  createBackup,
  restoreBackup,
  exportData,
  exportToXLSX,
  exportToPDF
};