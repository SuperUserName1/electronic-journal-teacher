const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const knex = require('knex');
const xlsx = require('xlsx');

let db;

function getDBPath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'journal.db');
}

function initialize() {
  const dbPath = getDBPath();
  
  db = knex({
    client: 'sqlite3',
    connection: {
      filename: dbPath
    },
    useNullAsDefault: true
  });

  createTables();
  return db;
}

async function createTables() {
  try {
    // Таблица студентов
    if (!(await db.schema.hasTable('students'))) {
      await db.schema.createTable('students', table => {
        table.increments('id').primary();
        table.string('full_name', 255).notNullable();
        table.string('group_name', 50).notNullable();
        table.string('record_book_number', 20).notNullable().unique();
        table.timestamps(true, true);
      });
    }

    // Таблица курсов
    if (!(await db.schema.hasTable('courses'))) {
      await db.schema.createTable('courses', table => {
        table.increments('id').primary();
        table.string('name', 255).notNullable();
        table.string('semester', 50).notNullable();
        table.timestamps(true, true);
      });
    }

    // Таблица занятий
    if (!(await db.schema.hasTable('lessons'))) {
      await db.schema.createTable('lessons', table => {
        table.increments('id').primary();
        table.integer('course_id').notNullable().references('id').inTable('courses').onDelete('CASCADE');
        table.date('date').notNullable();
        table.string('topic', 500);
        table.string('homework', 1000);
        table.date('homework_deadline');
        table.string('type', 50).defaultTo('lecture');
        table.decimal('weight', 3, 2).defaultTo(1.0);
        table.timestamps(true, true);
      });
    }

    // Таблица посещаемости
    if (!(await db.schema.hasTable('attendance'))) {
      await db.schema.createTable('attendance', table => {
        table.increments('id').primary();
        table.integer('student_id').notNullable().references('id').inTable('students').onDelete('CASCADE');
        table.integer('lesson_id').notNullable().references('id').inTable('lessons').onDelete('CASCADE');
        table.string('status', 1).defaultTo('н');
        table.unique(['student_id', 'lesson_id']);
      });
    }

    // Таблица оценок
    if (!(await db.schema.hasTable('grades'))) {
      await db.schema.createTable('grades', table => {
        table.increments('id').primary();
        table.integer('student_id').notNullable().references('id').inTable('students').onDelete('CASCADE');
        table.integer('lesson_id').notNullable().references('id').inTable('lessons').onDelete('CASCADE');
        table.string('value', 10).notNullable();
        table.unique(['student_id', 'lesson_id']);
      });
    }

    // Создание тестовых данных при первой инициализации
    const courseCount = await db('courses').count('* as count');
    if (parseInt(courseCount[0].count) === 0) {
      await createTestData();
    }

    console.log('Таблицы базы данных успешно созданы');
  } catch (error) {
    console.error('Ошибка при создании таблиц:', error);
    throw error;
  }
}

async function createTestData() {
  try {
    // Создание тестового курса
    const [courseId] = await db('courses').insert({
      name: 'Программирование на JavaScript',
      semester: 'Осень 2023',
      created_at: new Date(),
      updated_at: new Date()
    }).returning('id');

    // Создание тестовых студентов
    const testStudents = [
      { full_name: 'Иванов Иван Иванович', group_name: 'Группа-101', record_book_number: '123456' },
      { full_name: 'Петров Петр Петрович', group_name: 'Группа-101', record_book_number: '123457' },
      { full_name: 'Сидоров Сидор Сидорович', group_name: 'Группа-101', record_book_number: '123458' },
      { full_name: 'Козлов Козел Козлович', group_name: 'Группа-101', record_book_number: '123459' },
      { full_name: 'Смирнов Смирн Смирнович', group_name: 'Группа-101', record_book_number: '123460' }
    ];

    for (const student of testStudents) {
      await db('students').insert({
        ...student,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // Создание тестовых занятий
    const today = new Date();
    const lessons = [
      { date: new Date(today.setDate(today.getDate() - 14)), topic: 'Введение в JavaScript', type: 'lecture', weight: 1.0 },
      { date: new Date(today.setDate(today.getDate() - 7)), topic: 'Переменные и типы данных', type: 'lecture', weight: 1.0 },
      { date: new Date(today.setDate(today.getDate() - 3)), topic: 'Функции', type: 'practice', weight: 1.5 },
      { date: new Date(today.setDate(today.getDate() + 4)), topic: 'Объекты и массивы', type: 'practice', weight: 1.5 },
      { date: new Date(today.setDate(today.getDate() + 11)), topic: 'Контрольная работа', type: 'test', weight: 2.0 }
    ];

    for (const lesson of lessons) {
      await db('lessons').insert({
        course_id: courseId,
        date: lesson.date.toISOString().split('T')[0],
        topic: lesson.topic,
        type: lesson.type,
        weight: lesson.weight,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    console.log('Тестовые данные успешно созданы');
  } catch (error) {
    console.error('Ошибка при создании тестовых данных:', error);
  }
}

async function importStudents(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    let studentsData = [];

    if (ext === '.csv') {
      const csvContent = fs.readFileSync(filePath, 'utf8');
      const rows = csvContent.split('\n').filter(row => row.trim() !== '');
      const headers = rows[0].split(',').map(header => header.trim());
      
      for (let i = 1; i < rows.length; i++) {
        const values = rows[i].split(',').map(val => val.trim());
        if (values.length >= 3) {
          studentsData.push({
            full_name: values[0],
            group_name: values[1],
            record_book_number: values[2]
          });
        }
      }
    } else if (ext === '.xlsx' || ext === '.xls') {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(worksheet);
      
      studentsData = jsonData.map(row => ({
        full_name: row['ФИО'] || row['Студент'] || row['ФИО студента'] || '',
        group_name: row['Группа'] || row['Учебная группа'] || '',
        record_book_number: row['Номер зачетной книжки'] || row['Зачетная книжка'] || row['№ зачетки'] || ''
      })).filter(student => 
        student.full_name && student.group_name && student.record_book_number
      );
    } else {
      throw new Error('Неподдерживаемый формат файла. Используйте CSV или XLSX.');
    }

    if (studentsData.length === 0) {
      throw new Error('Не найдено данных для импорта');
    }

    let importedCount = 0;
    let updatedCount = 0;
    
    for (const student of studentsData) {
      const existingStudent = await db('students')
        .where('record_book_number', student.record_book_number)
        .first();
      
      if (existingStudent) {
        await db('students')
          .where('id', existingStudent.id)
          .update({
            full_name: student.full_name,
            group_name: student.group_name,
            updated_at: new Date()
          });
        updatedCount++;
      } else {
        await db('students').insert({
          full_name: student.full_name,
          group_name: student.group_name,
          record_book_number: student.record_book_number,
          created_at: new Date(),
          updated_at: new Date()
        });
        importedCount++;
      }
    }

    return {
      success: true,
      imported: importedCount,
      updated: updatedCount,
      total: studentsData.length
    };
  } catch (error) {
    console.error('Ошибка при импорте студентов:', error);
    throw error;
  }
}

async function getStudentsByGroup(groupName) {
  return await db('students')
    .where('group_name', groupName)
    .orderBy('full_name', 'asc');
}

async function getCourses() {
  return await db('courses').orderBy('name', 'asc');
}

async function createCourse(courseData) {
  const [id] = await db('courses').insert({
    ...courseData,
    created_at: new Date(),
    updated_at: new Date()
  }).returning('id');
  
  return { id, ...courseData };
}

async function getLessons(courseId) {
  return await db('lessons')
    .where('course_id', courseId)
    .orderBy('date', 'asc');
}

async function createLesson(lessonData) {
  const [id] = await db('lessons').insert({
    ...lessonData,
    created_at: new Date(),
    updated_at: new Date()
  }).returning('id');
  
  return { id, ...lessonData };
}

async function getAttendance(lessonId, groupName) {
  const students = await db('students').where('group_name', groupName);
  const attendanceRecords = await db('attendance')
    .where('lesson_id', lessonId)
    .whereIn('student_id', students.map(s => s.id));
  
  const attendanceMap = new Map();
  attendanceRecords.forEach(record => {
    attendanceMap.set(record.student_id, record);
  });
  
  return students.map(student => ({
    student_id: student.id,
    student_name: student.full_name,
    status: attendanceMap.has(student.id) ? attendanceMap.get(student.id).status : 'н'
  }));
}

async function updateAttendance(studentId, lessonId, status) {
  const existing = await db('attendance')
    .where('student_id', studentId)
    .where('lesson_id', lessonId)
    .first();
  
  if (existing) {
    await db('attendance')
      .where('id', existing.id)
      .update({ status });
  } else {
    await db('attendance').insert({
      student_id: studentId,
      lesson_id: lessonId,
      status: status
    });
  }
  
  return true;
}

async function getGrades(lessonId, groupName) {
  const students = await db('students').where('group_name', groupName);
  const gradeRecords = await db('grades')
    .where('lesson_id', lessonId)
    .whereIn('student_id', students.map(s => s.id));
  
  const gradesMap = new Map();
  gradeRecords.forEach(record => {
    gradesMap.set(record.student_id, record);
  });
  
  return students.map(student => ({
    student_id: student.id,
    student_name: student.full_name,
    grade: gradesMap.has(student.id) ? gradesMap.get(student.id).value : ''
  }));
}

async function updateGrade(studentId, lessonId, value) {
  const existing = await db('grades')
    .where('student_id', studentId)
    .where('lesson_id', lessonId)
    .first();
  
  if (existing) {
    await db('grades')
      .where('id', existing.id)
      .update({ value });
  } else {
    await db('grades').insert({
      student_id: studentId,
      lesson_id: lessonId,
      value: value
    });
  }
  
  return true;
}

async function calculateStudentAverage(studentId, courseId) {
  const grades = await db('grades')
    .join('lessons', 'grades.lesson_id', '=', 'lessons.id')
    .where('grades.student_id', studentId)
    .where('lessons.course_id', courseId)
    .select('grades.value', 'lessons.weight');
  
  if (grades.length === 0) return null;
  
  let totalWeight = 0;
  let weightedSum = 0;
  
  for (const grade of grades) {
    const numericValue = parseFloat(grade.value.replace(',', '.'));
    if (!isNaN(numericValue)) {
      const weight = parseFloat(grade.weight) || 1.0;
      weightedSum += numericValue * weight;
      totalWeight += weight;
    }
  }
  
  if (totalWeight === 0) return null;
  
  return parseFloat((weightedSum / totalWeight).toFixed(2));
}

async function forecastStudentPerformance(studentId, courseId) {
  // 1. Получаем текущий средний балл
  const currentAverage = await calculateStudentAverage(studentId, courseId);
  if (currentAverage === null) return null;
  
  // 2. Получаем все оценки студента
  const grades = await db('grades')
    .join('lessons', 'grades.lesson_id', '=', 'lessons.id')
    .where('grades.student_id', studentId)
    .where('lessons.course_id', courseId)
    .orderBy('lessons.date', 'asc')
    .select('grades.value', 'lessons.date');
  
  // 3. Вычисляем тренд (упрощенный вариант)
  let trend = 0;
  if (grades.length > 1) {
    const values = grades.map(g => parseFloat(g.value));
    
    // Простая линейная регрессия для вычисления тренда
    const n = values.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    trend = Math.min(Math.max(slope, -1), 1); // Нормализуем тренд в диапазон [-1, 1]
  }
  
  // 4. Получаем посещаемость
  const allLessons = await db('lessons').where('course_id', courseId);
  const attendedLessons = await db('attendance')
    .where('student_id', studentId)
    .whereIn('lesson_id', allLessons.map(l => l.id))
    .where('status', 'п');
  
  const attendanceRate = allLessons.length > 0 ? 
    (attendedLessons.length / allLessons.length) * 100 : 0;
  
  // 5. Рассчитываем прогнозируемый балл
  const forecastedGrade = Math.min(5.0, Math.max(2.0, currentAverage + (trend * 0.5)));
  
  // 6. Определяем уровень риска
  let riskLevel = 'low'; // 'low', 'medium', 'high'
  let riskFactors = [];
  
  // Минимальный проходной балл (для 5-балльной шкалы)
  const minPassScore = 3.0;
  
  if (forecastedGrade < minPassScore) {
    riskLevel = 'high';
    riskFactors.push('Прогнозируемый балл ниже проходного');
  }
  
  if (attendanceRate < 70) {
    if (riskLevel === 'low') riskLevel = 'medium';
    else if (riskLevel === 'medium') riskLevel = 'high';
    riskFactors.push('Низкая посещаемость');
  }
  
  if (trend < -0.1) {
    if (riskLevel === 'low') riskLevel = 'medium';
    else if (riskLevel === 'medium') riskLevel = 'high';
    riskFactors.push('Отрицательная динамика успеваемости');
  }
  
  return {
    currentAverage,
    forecastedGrade: parseFloat(forecastedGrade.toFixed(2)),
    trend: parseFloat(trend.toFixed(2)),
    attendanceRate: parseFloat(attendanceRate.toFixed(1)),
    riskLevel,
    riskFactors
  };
}

module.exports = {
  initialize,
  importStudents,
  getStudentsByGroup,
  getCourses,
  createCourse,
  getLessons,
  createLesson,
  getAttendance,
  updateAttendance,
  getGrades,
  updateGrade,
  forecastStudentPerformance
};