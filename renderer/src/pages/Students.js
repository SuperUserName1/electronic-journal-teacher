import React, { useState, useEffect } from 'react';

const initialFormState = {
  full_name: '',
  group_name: '',
  record_book_number: ''
};

const Students = ({ course, group }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formError, setFormError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  
  const loadData = async () => {
    if (!group) return;
    
    setLoading(true);
    try {
      const studentsData = await window.api.getStudentsByGroup(group);
      setStudents(studentsData);
    } catch (error) {
      console.error('Ошибка при загрузке студентов:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (group) {
      setFormData(prev => ({ ...prev, group_name: group }));
      loadData();
    } else {
      setStudents([]);
    }
  }, [group]);
  
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const resetForm = () => {
    setFormData({
      ...initialFormState,
      group_name: group || ''
    });
    setEditingStudent(null);
    setFormError('');
  };
  
  const handleAddClick = () => {
    resetForm();
    setShowForm(prev => !prev);
  };

  const handleExport = async () => {
    if (!group) return;
    setExportLoading(true);
    setFormError('');
    try {
      const filePath = await window.api.exportStudentsExcel(group);
      setStatusMessage(`Список студентов сохранен: ${filePath}`);
    } catch (error) {
      console.error('Ошибка при экспорте студентов:', error);
      setFormError('Не удалось экспортировать студентов. Проверьте консоль для подробностей.');
    } finally {
      setExportLoading(false);
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };
  
  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      full_name: student.full_name,
      group_name: student.group_name,
      record_book_number: student.record_book_number
    });
    setShowForm(true);
  };
  
  const handleDelete = async (student) => {
    const confirmed = window.confirm(`Удалить студента «${student.full_name}»?`);
    if (!confirmed) return;
    
    setDeletingId(student.id);
    try {
      await window.api.deleteStudent(student.id);
      setStatusMessage('Студент удален');
      await loadData();
    } catch (error) {
      console.error('Ошибка при удалении студента:', error);
      setFormError('Не удалось удалить студента. Проверьте консоль для подробностей.');
    } finally {
      setDeletingId(null);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!formData.full_name.trim() || !formData.group_name.trim() || !formData.record_book_number.trim()) {
      setFormError('Все поля обязательны для заполнения.');
      return;
    }
    
    setActionLoading(true);
    setFormError('');
    try {
      if (editingStudent) {
        await window.api.updateStudent(editingStudent.id, formData);
        setStatusMessage('Данные студента обновлены');
      } else {
        await window.api.createStudent(formData);
        setStatusMessage('Студент добавлен');
      }
      
      resetForm();
      setShowForm(false);
      await loadData();
    } catch (error) {
      console.error('Ошибка при сохранении студента:', error);
      const message = error?.message || 'Не удалось сохранить данные студента.';
      setFormError(message);
    } finally {
      setActionLoading(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Управление студентами</h2>
          <p className="mt-1 text-sm text-gray-500">
            Просмотр, добавление и редактирование студентов выбранной учебной группы
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleExport}
            disabled={!group || exportLoading}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:text-gray-400"
          >
            {exportLoading ? 'Экспорт...' : 'Экспорт в Excel'}
          </button>
          <button
            type="button"
            onClick={handleAddClick}
            disabled={!group}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-600"
          >
            {showForm ? 'Отменить' : 'Добавить студента'}
          </button>
        </div>
      </div>
      
      {!group && (
        <div className="card">
          <div className="card-body text-sm text-gray-600">
            Выберите учебную группу в боковом меню, чтобы управлять списком студентов.
          </div>
        </div>
      )}
      
      {showForm && group && (
        <div className="card">
          <div className="card-body">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              {editingStudent ? 'Редактировать студента' : 'Новый студент'}
            </h3>
            {formError && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                {formError}
              </div>
            )}
            {statusMessage && (
              <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
                {statusMessage}
              </div>
            )}
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">ФИО</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Иванов Иван Иванович"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Группа</label>
                <input
                  type="text"
                  name="group_name"
                  value={formData.group_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Группа-101"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Номер зачетной книжки</label>
                <input
                  type="text"
                  name="record_book_number"
                  value={formData.record_book_number}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="123456"
                  required
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleAddClick}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {actionLoading ? 'Сохраняем...' : editingStudent ? 'Сохранить изменения' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {statusMessage && !showForm && (
        <div className="card">
          <div className="card-body text-sm text-green-700 bg-green-50 rounded-md">
            {statusMessage}
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            {students.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-6">
                В этой группе пока нет студентов.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ФИО</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Группа</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Зачетная книжка</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student, index) => (
                      <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.group_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.record_book_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(student)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Редактировать
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(student)}
                            disabled={deletingId === student.id}
                            className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                          >
                            {deletingId === student.id ? 'Удаляем...' : 'Удалить'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;