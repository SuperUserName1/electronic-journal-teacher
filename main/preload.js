const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ipcRenderer', {
  on: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
  once: (channel, func) => {
    ipcRenderer.once(channel, (event, ...args) => func(...args));
  },
  removeListener: (channel, func) => {
    ipcRenderer.removeListener(channel, func);
  },
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

contextBridge.exposeInMainWorld('api', {
  // Студенты
  getStudentsByGroup: (groupName) => ipcRenderer.invoke('get-students-by-group', groupName),
  importStudents: (filePath) => ipcRenderer.invoke('import-students', filePath),
  
  // Курсы
  getCourses: () => ipcRenderer.invoke('get-courses'),
  createCourse: (courseData) => ipcRenderer.invoke('create-course', courseData),
  
  // Занятия
  getLessons: (courseId) => ipcRenderer.invoke('get-lessons', courseId),
  createLesson: (lessonData) => ipcRenderer.invoke('create-lesson', lessonData),
  
  // Посещаемость
  getAttendance: (lessonId, groupName) => ipcRenderer.invoke('get-attendance', lessonId, groupName),
  updateAttendance: (studentId, lessonId, status) => ipcRenderer.invoke('update-attendance', studentId, lessonId, status),
  
  // Оценки
  getGrades: (lessonId, groupName) => ipcRenderer.invoke('get-grades', lessonId, groupName),
  updateGrade: (studentId, lessonId, value) => ipcRenderer.invoke('update-grade', studentId, lessonId, value),
  
  // Прогнозирование
  forecastStudentPerformance: (studentId, courseId) => ipcRenderer.invoke('forecast-student-performance', studentId, courseId),
  
  // Экспорт
  exportData: (options) => ipcRenderer.invoke('export-data', options),
  
  // Резервное копирование
  createBackup: () => ipcRenderer.invoke('create-backup'),
  restoreBackup: (path) => ipcRenderer.invoke('restore-backup', path)
});