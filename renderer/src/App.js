import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Courses from './pages/Courses';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import { ArrowLeftIcon } from '@heroicons/react/outline';

function App() {
  const [activeCourse, setActiveCourse] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      const coursesData = await window.api.getCourses();
      setCourses(coursesData);
      
      if (coursesData.length > 0) {
        setActiveCourse(coursesData[0]);
        
        // Получаем уникальные группы из курса
        const courseGroups = await window.api.getStudentsByGroup(coursesData[0].group_name || 'Группа-101');
        const uniqueGroups = [...new Set(courseGroups.map(s => s.group_name))];
        setGroups(uniqueGroups);
        
        if (uniqueGroups.length > 0) {
          setActiveGroup(uniqueGroups[0]);
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
    }
  };
  
  const handleCourseChange = (course) => {
    setActiveCourse(course);
    // Здесь должна быть логика загрузки групп для выбранного курса
    // Для упрощения берем тестовые данные
    setGroups(['Группа-101', 'Группа-102']);
    setActiveGroup('Группа-101');
  };
  
  const handleGroupChange = (group) => {
    setActiveGroup(group);
  };
  
  const handleBack = () => {
    if (location.pathname !== '/') {
      navigate('/');
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        courses={courses} 
        groups={groups}
        activeCourse={activeCourse}
        activeGroup={activeGroup}
        onCourseChange={handleCourseChange}
        onGroupChange={handleGroupChange}
      />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
            {location.pathname !== '/' && (
              <button 
                onClick={handleBack}
                className="mr-4 p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                aria-label="Назад"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
            )}
            <h1 className="text-xl font-semibold text-gray-900">
              {location.pathname === '/' && activeCourse ? activeCourse.name : ''}
              {location.pathname === '/students' && 'Управление студентами'}
              {location.pathname === '/courses' && 'Управление курсами'}
              {location.pathname === '/analytics' && 'Аналитика успеваемости'}
              {location.pathname === '/reports' && 'Отчеты'}
            </h1>
            <div className="ml-auto flex items-center space-x-4">
              {activeCourse && activeGroup && (
                <div className="text-sm text-gray-600">
                  <div>{activeCourse.name}</div>
                  <div className="font-medium">{activeGroup}</div>
                </div>
              )}
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Routes>
            <Route 
              path="/" 
              element={
                activeCourse && activeGroup ? (
                  <Dashboard 
                    course={activeCourse} 
                    group={activeGroup} 
                  />
                ) : (
                  <div className="max-w-4xl mx-auto text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Выберите курс и группу</h2>
                    <p className="text-gray-600">Пожалуйста, выберите курс и учебную группу из бокового меню для просмотра журнала.</p>
                  </div>
                )
              } 
            />
            <Route 
              path="/students" 
              element={
                activeCourse ? (
                  <Students 
                    course={activeCourse} 
                    group={activeGroup} 
                  />
                ) : (
                  <div className="max-w-4xl mx-auto text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Выберите курс</h2>
                    <p className="text-gray-600">Пожалуйста, выберите курс из бокового меню для управления студентами.</p>
                  </div>
                )
              } 
            />
            <Route path="/courses" element={<Courses />} />
            <Route 
              path="/analytics" 
              element={
                activeCourse && activeGroup ? (
                  <Analytics 
                    course={activeCourse} 
                    group={activeGroup} 
                  />
                ) : (
                  <div className="max-w-4xl mx-auto text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Выберите курс и группу</h2>
                    <p className="text-gray-600">Пожалуйста, выберите курс и учебную группу из бокового меню для просмотра аналитики.</p>
                  </div>
                )
              } 
            />
            <Route 
              path="/reports" 
              element={
                activeCourse && activeGroup ? (
                  <Reports 
                    course={activeCourse} 
                    group={activeGroup} 
                  />
                ) : (
                  <div className="max-w-4xl mx-auto text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Выберите курс и группу</h2>
                    <p className="text-gray-600">Пожалуйста, выберите курс и учебную группу из бокового меню для формирования отчетов.</p>
                  </div>
                )
              } 
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;