import React, { useEffect, useState } from 'react';

const initialFormState = {
  name: ''
};

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [editingGroup, setEditingGroup] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const groupsData = await window.api.getAllGroups();
      setGroups(groupsData);
    } catch (err) {
      console.error('Ошибка при загрузке групп:', err);
      setError('Не удалось загрузить список групп. Попробуйте обновить страницу.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (group = null) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name
      });
    } else {
      setEditingGroup(null);
      setFormData(initialFormState);
    }
    setError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingGroup(null);
    setFormData(initialFormState);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.name.trim()) {
      setError('Название группы обязательно');
      return;
    }

    try {
      if (editingGroup) {
        await window.api.updateGroup(editingGroup.name, formData.name.trim());
      } else {
        await window.api.createGroup(formData.name.trim());
      }

      window.dispatchEvent(new CustomEvent('groups-updated'));
      await loadData();
      closeModal();
    } catch (err) {
      console.error('Ошибка при сохранении группы:', err);
      setError(err?.message || 'Не удалось сохранить группу. Попробуйте еще раз.');
    }
  };

  const handleDelete = async (group) => {
    if (!window.confirm(`Удалить группу «${group.name}» и всех её студентов (${group.student_count || 0} чел.)?`)) {
      return;
    }

    try {
      await window.api.deleteGroup(group.name);
      window.dispatchEvent(new CustomEvent('groups-updated'));
      await loadData();
    } catch (err) {
      console.error('Ошибка при удалении группы:', err);
      alert('Не удалось удалить группу. Проверьте консоль для подробностей.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Управление учебными группами</h2>
          <p className="mt-1 text-sm text-gray-500">
            Создавайте, редактируйте и удаляйте группы, привязывая их к нужным курсам.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn btn-primary self-start"
        >
          Добавить группу
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      ) : groups.length === 0 ? (
        <div className="card">
          <div className="card-body text-sm text-gray-600">
            Пока нет ни одной группы. Нажмите «Добавить группу», чтобы создать первую.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => (
            <div key={group.name} className="card">
              <div className="card-header flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">{group.name}</h3>
                <span className="text-xs font-semibold uppercase text-gray-500">
                  {group.student_count || 0} {group.student_count === 1 ? 'студент' : group.student_count < 5 ? 'студента' : 'студентов'}
                </span>
              </div>
              <div className="card-body flex justify-end gap-3">
                <button
                  className="text-sm text-blue-600 hover:text-blue-800"
                  onClick={() => openModal(group)}
                >
                  Редактировать
                </button>
                <button
                  className="text-sm text-red-600 hover:text-red-800"
                  onClick={() => handleDelete(group)}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={event => event.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingGroup ? 'Редактировать группу' : 'Добавить группу'}
            </h3>
            {error && (
              <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="form-label">Название группы</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Например, Группа-201"
                  required
                />
                {editingGroup && (
                  <p className="mt-1 text-xs text-gray-500">
                    При изменении названия группы будут обновлены все студенты этой группы.
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingGroup ? 'Сохранить изменения' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;

