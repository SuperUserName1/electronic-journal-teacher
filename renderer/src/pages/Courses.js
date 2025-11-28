import React, { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/outline';

const initialFormState = {
  name: '',
  semester: ''
};

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [editingCourse, setEditingCourse] = useState(null);
  const [error, setError] = useState('');
  
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
  
  const openModal = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        name: course.name,
        semester: course.semester
      });
    } else {
      setEditingCourse(null);
      setFormData(initialFormState);
    }
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
    setFormData(initialFormState);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.name.trim() || !formData.semester.trim()) {
      setError('Пожалуйста, заполните все поля');
      return;
    }
    
    try {
      const payload = {
        name: formData.name.trim(),
        semester: formData.semester.trim()
      };

      if (editingCourse) {
        await window.api.updateCourse(editingCourse.id, payload);
      } else {
        await window.api.createCourse(payload);
      }

      window.dispatchEvent(new CustomEvent('courses-updated', {
        detail: { courseId: editingCourse?.id }
      }));

      await loadData();
      closeModal();
    } catch (err) {
      console.error('Ошибка при сохранении курса:', err);
      setError('Не удалось сохранить курс. Попробуйте еще раз.');
    }
  };

  const handleDeleteCourse = async (course) => {
    if (!window.confirm(`Удалить курс «${course.name}»? Все занятия и связанные данные будут удалены.`)) {
      return;
    }

    try {
      await window.api.deleteCourse(course.id);
      window.dispatchEvent(new CustomEvent('courses-updated'));
      await loadData();
    } catch (err) {
      console.error('Ошибка при удалении курса:', err);
      alert('Не удалось удалить курс. Проверьте консоль для подробностей.');
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
          onClick={() => openModal()}
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
              <div className="card-header flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">{course.name}</h3>
                <span className="text-xs text-gray-500 uppercase">{course.semester}</span>
              </div>
              <div className="card-body flex justify-end gap-3">
                <button
                  className="text-sm text-blue-600 hover:text-blue-800"
                  onClick={() => openModal(course)}
                >
                  Редактировать
                </button>
                <button
                  className="text-sm text-red-600 hover:text-red-800"
                  onClick={() => handleDeleteCourse(course)}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingCourse ? 'Редактировать курс' : 'Добавить новый курс'}
            </h3>
            {error && (
              <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="form-label">Название курса</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Введите название курса"
                  required
                />
              </div>
              
              <div>
                <label className="form-label">Семестр</label>
                <input
                  type="text"
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Например: Осень 2025"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-secondary"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingCourse ? 'Сохранить' : 'Добавить курс'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;