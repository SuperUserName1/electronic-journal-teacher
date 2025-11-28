import React, { useState } from 'react';

const Reports = ({ course, group }) => {
  const [registerLoading, setRegisterLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
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

  const handleGenerateReport = async () => {
    if (!course || !group) {
      setError('Выберите курс и группу');
      return;
    }
    setReportLoading(true);
    setError('');
    try {
      const filePath = await window.api.generateAttendanceReport(course.id, group, 'pdf');
      setMessage(`Отчет по посещаемости сохранен: ${filePath}`);
    } catch (err) {
      console.error('Ошибка при формировании отчета:', err);
      setError('Не удалось сформировать отчет. Проверьте консоль для подробностей.');
    } finally {
      setReportLoading(false);
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Отчет по посещаемости</h3>
          </div>
          <div className="card-body">
            <p className="text-sm text-gray-500 mb-4">
              Анализ посещаемости студентов за выбранную дисциплину (PDF).
            </p>
            <button 
              className="btn btn-primary w-full"
              onClick={handleGenerateReport}
              disabled={reportLoading}
            >
              {reportLoading ? 'Формируем...' : 'Сформировать отчет'}
            </button>
          </div>
        </div>
        
        <div className="card md:col-span-2">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">История изменений</h3>
          </div>
          <div className="card-body">
            <p className="text-sm text-gray-500 mb-4">
              Просмотр истории внесенных изменений в журнал успеваемости.
            </p>
            <button className="btn btn-secondary w-full">
              Просмотреть историю
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;