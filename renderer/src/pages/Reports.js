import React from 'react';

const Reports = ({ course, group }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Отчеты</h2>
        <p className="mt-1 text-sm text-gray-500">
          Формирование и экспорт отчетов по успеваемости
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Ведомость успеваемости</h3>
          </div>
          <div className="card-body">
            <p className="text-sm text-gray-500 mb-4">
              Формирование ведомости для учебной группы с возможностью экспорта в Excel или PDF.
            </p>
            <button className="btn btn-primary">
              Сформировать ведомость
            </button>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Отчет по посещаемости</h3>
          </div>
          <div className="card-body">
            <p className="text-sm text-gray-500 mb-4">
              Анализ посещаемости студентов за выбранный период.
            </p>
            <button className="btn btn-primary">
              Сформировать отчет
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
            <button className="btn btn-secondary">
              Просмотреть историю
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;