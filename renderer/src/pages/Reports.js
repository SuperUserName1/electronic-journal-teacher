import React, { useState } from 'react';

const Reports = ({ course, group }) => {
  const [registerLoading, setRegisterLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleGenerateRegister = async () => {
    if (!course || !group) {
      setError('Выберите курс и группу');
      return;
    }
    setRegisterLoading(true);
    setError('');
    try {
      const filePath = await window.api.generateGradeReport(course.id, group);
      setMessage(`Ведомость сохранена: ${filePath}`);
    } catch (err) {
      console.error('Ошибка при формировании ведомости:', err);
      setError('Не удалось сформировать ведомость. Проверьте консоль для подробностей.');
    } finally {
      setRegisterLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Отчеты</h2>
        <p className="mt-1 text-sm text-gray-500">
          Формирование и экспорт отчетов по успеваемости
        </p>
      </div>

      {(message || error) && (
        <div className={`card ${message ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="card-body text-sm">
            <span className={message ? 'text-green-700' : 'text-red-700'}>
              {message || error}
            </span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Ведомость успеваемости</h3>
          </div>
          <div className="card-body">
            <p className="text-sm text-gray-500 mb-4">
              Формирование ведомости для учебной группы с возможностью экспорта в Excel.
            </p>
            <button 
              className="btn btn-primary w-full"
              onClick={handleGenerateRegister}
              disabled={registerLoading}
            >
              {registerLoading ? 'Формируем...' : 'Сформировать ведомость'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;