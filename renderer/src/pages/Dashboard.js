import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { PlusIcon, DownloadIcon, CalendarIcon, DocumentTextIcon } from '@heroicons/react/outline';
import { saveAs } from 'file-saver';

const Dashboard = ({ course, group }) => {
  const [lessons, setLessons] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [grades, setGrades] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false);
  const [newLesson, setNewLesson] = useState({
    date: '',
    topic: '',
    homework: '',
    homeworkDeadline: '',
    type: 'lecture',
    weight: 1.0
  });

  const loadData = useCallback(async () => {
    if (!course || !group) return;

    setLoading(true);
    
    try {
      const lessonsData = await window.api.getLessons(course.id);
      setLessons(lessonsData);
      
      const studentsData = await window.api.getStudentsByGroup(group);
      setStudents(studentsData);
      
      const attendanceData = {};
      const gradesData = {};
      
      for (const lesson of lessonsData) {
        attendanceData[lesson.id] = await window.api.getAttendance(lesson.id, group);
        gradesData[lesson.id] = await window.api.getGrades(lesson.id, group);
      }
      
      setAttendance(attendanceData);
      setGrades(gradesData);
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
    } finally {
      setLoading(false);
    }
  }, [course, group]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddLesson = async () => {
    if (!validateNewLesson()) return;
    
    try {
      const lessonData = {
        course_id: course.id,
        date: newLesson.date,
        topic: newLesson.topic,
        homework: newLesson.homework,
        homework_deadline: newLesson.homeworkDeadline,
        type: newLesson.type,
        weight: parseFloat(newLesson.weight)
      };
      
      const createdLesson = await window.api.createLesson(lessonData);
      
      // Обновляем локальные данные
      setLessons([...lessons, createdLesson]);
      setAttendance(prev => ({ ...prev, [createdLesson.id]: [] }));
      setGrades(prev => ({ ...prev, [createdLesson.id]: [] }));
      
      // Сбрасываем форму и закрываем модальное окно
      resetNewLessonForm();
      setIsAddLessonModalOpen(false);
      
      // Обновляем данные для нового занятия
      const updatedAttendance = await window.api.getAttendance(createdLesson.id, group);
      const updatedGrades = await window.api.getGrades(createdLesson.id, group);
      
      setAttendance(prev => ({ ...prev, [createdLesson.id]: updatedAttendance }));
      setGrades(prev => ({ ...prev, [createdLesson.id]: updatedGrades }));
    } catch (error) {
      console.error('Ошибка при добавлении занятия:', error);
      alert('Не удалось добавить занятие. Попробуйте еще раз.');
    }
  };

  const validateNewLesson = () => {
    let isValid = true;
    let errorMessage = '';
    
    if (!newLesson.date) {
      errorMessage = 'Пожалуйста, выберите дату занятия';
      isValid = false;
    } else if (new Date(newLesson.date) > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
      errorMessage = 'Дата не может быть более чем через 30 дней от текущей';
      isValid = false;
    } else if (!newLesson.type) {
      errorMessage = 'Пожалуйста, выберите тип занятия';
      isValid = false;
    }
    
    if (!isValid) {
      alert(errorMessage);
    }
    
    return isValid;
  };

  const resetNewLessonForm = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setNewLesson({
      date: format(tomorrow, 'yyyy-MM-dd'),
      topic: '',
      homework: '',
      homeworkDeadline: '',
      type: 'lecture',
      weight: 1.0
    });
  };

  const handleUpdateAttendance = async (lessonId, studentId, status) => {
    try {
      await window.api.updateAttendance(studentId, lessonId, status);
      
      setAttendance(prev => {
        const updated = { ...prev };
        const lessonAttendance = [...(updated[lessonId] || [])];
        const index = lessonAttendance.findIndex(a => a.student_id === studentId);
        
        if (index !== -1) {
          lessonAttendance[index] = { ...lessonAttendance[index], status };
        } else {
          lessonAttendance.push({ student_id: studentId, status });
        }
        
        updated[lessonId] = lessonAttendance;
        return updated;
      });
    } catch (error) {
      console.error('Ошибка при обновлении посещаемости:', error);
    }
  };

  const handleUpdateGrade = async (lessonId, studentId, value) => {
    try {
      await window.api.updateGrade(studentId, lessonId, value);
      
      setGrades(prev => {
        const updated = { ...prev };
        const lessonGrades = [...(updated[lessonId] || [])];
        const index = lessonGrades.findIndex(g => g.student_id === studentId);
        
        if (index !== -1) {
          lessonGrades[index] = { ...lessonGrades[index], grade: value };
        } else {
          lessonGrades.push({ student_id: studentId, grade: value });
        }
        
        updated[lessonId] = lessonGrades;
        return updated;
      });
    } catch (error) {
      console.error('Ошибка при обновлении оценки:', error);
    }
  };

  const handleExport = async () => {
    if (!course || !group) return;
    
    try {
      // Подготавливаем данные для экспорта
      const exportData = {
        course: course.name,
        group: group,
        semester: course.semester,
        lessons: lessons.map(lesson => ({
          id: lesson.id,
          date: format(new Date(lesson.date), 'dd.MM.yyyy', { locale: ru }),
          topic: lesson.topic,
          type: lesson.type,
          weight: lesson.weight
        })),
        students: students.map(student => {
          const studentGrades = {};
          const studentAttendance = {};
          
          lessons.forEach(lesson => {
            const grade = grades[lesson.id]?.find(g => g.student_id === student.id);
            const attend = attendance[lesson.id]?.find(a => a.student_id === student.id);
            
            if (grade) studentGrades[lesson.id] = grade.grade;
            if (attend) studentAttendance[lesson.id] = attend.status;
          });
          
          // Рассчитываем средний балл
          let totalWeight = 0;
          let weightedSum = 0;
          
          lessons.forEach(lesson => {
            const grade = grades[lesson.id]?.find(g => g.student_id === student.id);
            if (grade && grade.grade && !isNaN(parseFloat(grade.grade))) {
              const numericGrade = parseFloat(grade.grade);
              const weight = parseFloat(lesson.weight) || 1.0;
              
              weightedSum += numericGrade * weight;
              totalWeight += weight;
            }
          });
          
          const average = totalWeight > 0 ? (weightedSum / totalWeight).toFixed(2) : '-';
          
          return {
            id: student.id,
            name: student.full_name,
            record_book_number: student.record_book_number,
            grades: studentGrades,
            attendance: studentAttendance,
            average
          };
        })
      };
      
      // Экспорт в XLSX
      const filePath = await window.api.exportData({
        format: 'xlsx',
        data: exportData,
        fileName: `Ведомость_${course.name.replace(/\s+/g, '_')}_${group.replace(/\s+/g, '_')}`
      });
      
      if (filePath) {
        alert(`Данные успешно экспортированы!\nПуть: ${filePath}`);
      }
    } catch (error) {
      console.error('Ошибка при экспорте данных:', error);
      alert('Не удалось экспортировать данные. Попробуйте еще раз.');
    }
  };

  // Сортировка студентов по алфавиту
  const sortedStudents = useMemo(
    () => [...students].sort((a, b) => a.full_name.localeCompare(b.full_name)),
    [students]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Журнал занятий</h2>
          <p className="mt-1 text-sm text-gray-500">
            Просмотр и управление посещаемостью и оценками
          </p>
        </div>
        <div className="mt-4 flex space-x-3 sm:mt-0">
          <button
            onClick={handleExport}
            className="btn btn-secondary flex items-center"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Экспорт в Excel
          </button>
          <button
            onClick={() => {
              resetNewLessonForm();
              setIsAddLessonModalOpen(true);
            }}
            className="btn btn-primary flex items-center"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Добавить занятие
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 w-64">
                    Студент
                  </th>
                  {lessons.map(lesson => (
                    <th key={lesson.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      <div className="truncate" title={lesson.topic}>
                        {format(new Date(lesson.date), 'dd.MM.yyyy', { locale: ru })}
                      </div>
                      <div className="mt-1 flex items-center text-xs font-normal text-gray-400">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          lesson.type === 'lecture' ? 'bg-blue-100 text-blue-800' :
                          lesson.type === 'practice' ? 'bg-green-100 text-green-800' :
                          lesson.type === 'test' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {lesson.type === 'lecture' ? 'Лекция' :
                           lesson.type === 'practice' ? 'Практика' :
                           lesson.type === 'test' ? 'Контрольная' : 
                           lesson.type}
                        </span>
                        <span className="ml-2 text-gray-500">{lesson.weight}x</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Средний балл
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedStudents.map(student => {
                  // Расчет среднего балла
                  let totalWeight = 0;
                  let weightedSum = 0;
                  
                  lessons.forEach(lesson => {
                    const grade = grades[lesson.id]?.find(g => g.student_id === student.id);
                    if (grade && grade.grade && !isNaN(parseFloat(grade.grade))) {
                      const numericGrade = parseFloat(grade.grade);
                      const weight = parseFloat(lesson.weight) || 1.0;
                      
                      weightedSum += numericGrade * weight;
                      totalWeight += weight;
                    }
                  });
                  
                  const averageGrade = totalWeight > 0 ? (weightedSum / totalWeight).toFixed(2) : '-';
                  
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10 font-medium text-gray-900">
                        <div>{student.full_name}</div>
                        <div className="text-sm text-gray-500">{student.record_book_number}</div>
                      </td>
                      {lessons.map(lesson => {
                        const attend = attendance[lesson.id]?.find(a => a.student_id === student.id);
                        const grade = grades[lesson.id]?.find(g => g.student_id === student.id);
                        
                        return (
                          <td key={`${student.id}-${lesson.id}`} className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center space-x-1">
                              <select
                                value={attend?.status || 'н'}
                                onChange={(e) => handleUpdateAttendance(lesson.id, student.id, e.target.value)}
                                className={`attendance-indicator ${
                                  attend?.status === 'п' ? 'attendance-present' :
                                  attend?.status === 'у' ? 'attendance-excused' :
                                  'attendance-absent'
                                }`}
                                title="Выберите статус посещения: п - присутствовал, у - уважительная причина, н - отсутствовал"
                              >
                                <option value="п">П</option>
                                <option value="у">У</option>
                                <option value="н">Н</option>
                              </select>
                              <input
                                type="text"
                                value={grade?.grade || ''}
                                onChange={(e) => handleUpdateGrade(lesson.id, student.id, e.target.value)}
                                className="w-12 px-1 py-0.5 text-center border rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="-"
                                maxLength="3"
                                title="Введите оценку"
                              />
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          averageGrade !== '-' && parseFloat(averageGrade) >= 4.0 ? 'text-green-700 bg-green-100' :
                          averageGrade !== '-' && parseFloat(averageGrade) >= 3.0 ? 'text-yellow-700 bg-yellow-100' :
                          averageGrade !== '-' ? 'text-red-700 bg-red-100' :
                          'text-gray-500'
                        }`}>
                          {averageGrade}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Модальное окно для добавления занятия */}
      {isAddLessonModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddLessonModalOpen(false)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Добавить занятие</h3>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">Дата занятия</label>
                <input
                  type="date"
                  value={newLesson.date}
                  onChange={(e) => setNewLesson({...newLesson, date: e.target.value})}
                  className="form-input"
                />
              </div>
              
              <div>
                <label className="form-label">Тема занятия</label>
                <input
                  type="text"
                  value={newLesson.topic}
                  onChange={(e) => setNewLesson({...newLesson, topic: e.target.value})}
                  className="form-input"
                  placeholder="Введите тему занятия"
                />
              </div>
              
              <div>
                <label className="form-label">Тип занятия</label>
                <select
                  value={newLesson.type}
                  onChange={(e) => setNewLesson({...newLesson, type: e.target.value})}
                  className="form-input"
                >
                  <option value="lecture">Лекция</option>
                  <option value="practice">Практическое занятие</option>
                  <option value="seminar">Семинар</option>
                  <option value="test">Контрольная работа</option>
                  <option value="exam">Экзамен</option>
                </select>
              </div>
              
              <div>
                <label className="form-label">Вес оценки за занятие</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5"
                  value={newLesson.weight}
                  onChange={(e) => setNewLesson({...newLesson, weight: e.target.value})}
                  className="form-input"
                  placeholder="1.0"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Вес влияет на значимость оценки при расчете среднего балла
                </p>
              </div>
              
              <div>
                <label className="form-label">Домашнее задание</label>
                <textarea
                  value={newLesson.homework}
                  onChange={(e) => setNewLesson({...newLesson, homework: e.target.value})}
                  className="form-input"
                  rows="3"
                  placeholder="Описание домашнего задания"
                />
              </div>
              
              <div>
                <label className="form-label">Срок сдачи ДЗ</label>
                <input
                  type="date"
                  value={newLesson.homeworkDeadline}
                  onChange={(e) => setNewLesson({...newLesson, homeworkDeadline: e.target.value})}
                  className="form-input"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setIsAddLessonModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Отмена
                </button>
                <button
                  onClick={handleAddLesson}
                  className="btn btn-primary"
                >
                  Добавить занятие
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;