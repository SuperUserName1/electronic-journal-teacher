import React, { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/outline';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: '',
    semester: ''
  });
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const coursesData = await window.api.getCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Ошибка при загрузке курсов:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddCourse = async () => {
    if (!newCourse.name || !newCourse.semester) {
      alert('Пожалуйста, заполните все поля');
      return;
    }
    
    try {
      await window.api.createCourse(newCourse);
      await loadData();
      setNewCourse({ name: '', semester: '' });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Ошибка при добавлении курса:', error);
      alert('Не удалось добавить курс. Попробуйте еще раз.');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Управление курсами</h2>
          <p className="mt-1 text-sm text-gray-500">
            Создание и управление учебными курсами
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn btn-primary flex items-center"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Добавить курс
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div key={course.id} className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">{course.name}</h3>
              </div>
              <div className="card-body">
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Семестр:</span> {course.semester}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Модальное окно для добавления курса */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Добавить новый курс</h3>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">Название курса</label>
                <input
                  type="text"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                  className="form-input"
                  placeholder="Введите название курса"
                />
              </div>
              
              <div>
                <label className="form-label">Семестр</label>
                <input
                  type="text"
                  value={newCourse.semester}
                  onChange={(e) => setNewCourse({...newCourse, semester: e.target.value})}
                  className="form-input"
                  placeholder="Например: Осень 2023"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Отмена
                </button>
                <button
                  onClick={handleAddCourse}
                  className="btn btn-primary"
                >
                  Добавить курс
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;