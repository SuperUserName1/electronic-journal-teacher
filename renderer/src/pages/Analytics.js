import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, 
  LineChart, Line, ResponsiveContainer 
} from 'recharts';
import { AcademicCapIcon, ChartBarIcon } from '@heroicons/react/outline';

const Analytics = ({ course, group }) => {
  const [studentsData, setStudentsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [riskSummary, setRiskSummary] = useState({ low: 0, medium: 0, high: 0 });
  const [averageGrades, setAverageGrades] = useState([]);
  
  useEffect(() => {
    if (course && group) {
      loadData();
    }
  }, [course, group]);

  const loadData = async () => {
    setLoading(true);
    
    try {
      const students = await window.api.getStudentsByGroup(group);
      
      // Получаем прогнозы для каждого студента
      const forecasts = await Promise.all(
        students.map(async (student) => {
          const forecast = await window.api.forecastStudentPerformance(
            student.id, 
            course.id
          );
          
          return {
            student,
            forecast
          };
        })
      );
      
      setStudentsData(forecasts);
      
      // Подсчет рисков
      const riskCount = { low: 0, medium: 0, high: 0 };
      forecasts.forEach(item => {
        if (item.forecast) {
          riskCount[item.forecast.riskLevel]++;
        }
      });
      
      setRiskSummary(riskCount);
      
    } catch (error) {
      console.error('Ошибка при загрузке аналитики:', error);
      alert('Не удалось загрузить аналитические данные. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Подготовка данных для круговой диаграммы
  const pieData = [
    { name: 'Низкий риск', value: riskSummary.low },
    { name: 'Средний риск', value: riskSummary.medium },
    { name: 'Высокий риск', value: riskSummary.high }
  ];

  const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Аналитика успеваемости</h2>
        <p className="mt-1 text-sm text-gray-500">
          Прогнозирование рисков и анализ динамики успеваемости
        </p>
      </div>

      {/* Статистика по рискам */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 p-3 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Низкий риск</p>
                <p className="text-2xl font-bold text-gray-900">{riskSummary.low}</p>
                <p className="text-sm text-gray-500">Студентов</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 p-3 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Средний риск</p>
                <p className="text-2xl font-bold text-gray-900">{riskSummary.medium}</p>
                <p className="text-sm text-gray-500">Студентов</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 p-3 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Высокий риск</p>
                <p className="text-2xl font-bold text-gray-900">{riskSummary.high}</p>
                <p className="text-sm text-gray-500">Студентов</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* График распределения рисков */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Распределение студентов по рискам</h3>
        </div>
        <div className="p-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Таблица с детальной информацией */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Детальная информация по студентам</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Студент</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Текущий балл</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Прогноз</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Посещаемость</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тренд</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Риск</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Факторы риска</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {studentsData.map(({ student, forecast }, index) => (
                <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                    <div className="text-sm text-gray-500">{student.record_book_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {forecast ? forecast.currentAverage : 'Нет данных'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {forecast ? forecast.forecastedGrade : 'Нет данных'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {forecast ? `${forecast.attendanceRate}%` : 'Нет данных'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    forecast?.trend > 0 ? 'text-green-600' :
                    forecast?.trend < 0 ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {forecast ? (forecast.trend > 0 ? `+${forecast.trend}` : forecast.trend) : 'Нет данных'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {forecast ? (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        forecast.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                        forecast.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {forecast.riskLevel === 'high' ? 'Высокий' :
                         forecast.riskLevel === 'medium' ? 'Средний' : 'Низкий'}
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Нет данных
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {forecast?.riskFactors?.length > 0 ? 
                      forecast.riskFactors.join(', ') : 
                      'Нет факторов риска'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;