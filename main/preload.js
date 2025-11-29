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
  createStudent: (studentData) => ipcRenderer.invoke('create-student', studentData),
  updateStudent: (studentId, studentData) => ipcRenderer.invoke('update-student', studentId, studentData),
  deleteStudent: (studentId) => ipcRenderer.invoke('delete-student', studentId),
  exportStudentsExcel: (groupName) => ipcRenderer.invoke('export-students-excel', groupName),
  importStudents: (filePath) => ipcRenderer.invoke('import-students', filePath),
  
  // Группы
  getGroups: (courseId) => ipcRenderer.invoke('get-groups', courseId),
  getAllGroups: () => ipcRenderer.invoke('get-all-groups'),
  createGroup: (groupName) => ipcRenderer.invoke('create-group', groupName),
  updateGroup: (oldGroupName, newGroupName) => ipcRenderer.invoke('update-group', oldGroupName, newGroupName),
  deleteGroup: (groupName) => ipcRenderer.invoke('delete-group', groupName),
  
  // Курсы
  getCourses: () => ipcRenderer.invoke('get-courses'),
  createCourse: (courseData) => ipcRenderer.invoke('create-course', courseData),
  updateCourse: (courseId, courseData) => ipcRenderer.invoke('update-course', courseId, courseData),
  deleteCourse: (courseId) => ipcRenderer.invoke('delete-course', courseId),
  
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
  generateGradeReport: (courseId, groupName) => ipcRenderer.invoke('generate-grade-report', courseId, groupName),
  // Резервное копирование
  createBackup: () => ipcRenderer.invoke('create-backup'),
  restoreBackup: (path) => ipcRenderer.invoke('restore-backup', path)
});