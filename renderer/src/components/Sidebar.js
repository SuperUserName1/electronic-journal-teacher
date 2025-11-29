import React, { useState } from 'react';
import { 
  HomeIcon, 
  UserGroupIcon, 
  AcademicCapIcon, 
  ChartBarIcon, 
  DocumentReportIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon
} from '@heroicons/react/outline';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ courses, groups, activeCourse, activeGroup, onCourseChange, onGroupChange }) => {
  const [isCoursesOpen, setIsCoursesOpen] = useState(true);
  const [isGroupsOpen, setIsGroupsOpen] = useState(true);
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  return (
    <div className="sidebar w-64 flex flex-col">
      <div className="sidebar-header">
        <h1 className="text-xl font-bold text-gray-800">ЭЖП</h1>
        <p className="text-sm text-gray-600">Электронный Журнал Преподавателя</p>
      </div>
      
      <nav className="sidebar-nav flex-1 overflow-y-auto">
        <div className="sidebar-group">ОСНОВНОЕ</div>
        <Link 
          to="/" 
          className={`sidebar-item ${isActive('/') ? 'active' : ''}`}
        >
          <HomeIcon className="sidebar-icon" />
          Главная
        </Link>
        
        <Link 
          to="/analytics" 
          className={`sidebar-item ${isActive('/analytics') ? 'active' : ''}`}
        >
          <ChartBarIcon className="sidebar-icon" />
          Аналитика
        </Link>
        
        <Link 
          to="/reports" 
          className={`sidebar-item ${isActive('/reports') ? 'active' : ''}`}
        >
          <DocumentReportIcon className="sidebar-icon" />
          Отчеты
        </Link>
        
        <div className="sidebar-group mt-4">УПРАВЛЕНИЕ</div>
        
        <Link 
          to="/students" 
          className={`sidebar-item ${isActive('/students') ? 'active' : ''}`}
        >
          <UserGroupIcon className="sidebar-icon" />
          Студенты
        </Link>
        
        <Link 
          to="/groups" 
          className={`sidebar-item ${isActive('/groups') ? 'active' : ''}`}
        >
          <UserGroupIcon className="sidebar-icon" />
          Группы
        </Link>
        
        <div className="px-3 py-1">
          <button 
            onClick={() => setIsCoursesOpen(!isCoursesOpen)}
            className="flex items-center w-full text-left text-sm font-medium text-gray-700"
          >
            {isCoursesOpen ? (
              <ChevronDownIcon className="w-4 h-4 mr-2" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 mr-2" />
            )}
            Курсы
          </button>
        </div>
        
        {isCoursesOpen && (
          <div className="pl-4">
            {courses.map((course) => (
              <div 
                key={course.id} 
                className={`sidebar-item cursor-pointer ${
                  activeCourse && activeCourse.id === course.id ? 'active bg-blue-50' : ''
                }`}
                onClick={() => onCourseChange(course)}
              >
                <AcademicCapIcon className="sidebar-icon text-gray-500" />
                <span className="truncate">{course.name}</span>
              </div>
            ))}
            <Link to="/courses" className="sidebar-item text-blue-600 hover:bg-blue-50">
              <PlusIcon className="sidebar-icon text-blue-500" />
              Добавить курс
            </Link>
          </div>
        )}
        
        {activeCourse && (
          <>
            <div className="px-3 py-1 mt-2">
              <button 
                onClick={() => setIsGroupsOpen(!isGroupsOpen)}
                className="flex items-center w-full text-left text-sm font-medium text-gray-700"
              >
                {isGroupsOpen ? (
                  <ChevronDownIcon className="w-4 h-4 mr-2" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 mr-2" />
                )}
                Группы
              </button>
            </div>
            
            {isGroupsOpen && (
              <div className="pl-4 mb-4">
                {groups.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-500 italic">
                    Нет групп для выбранного курса
                  </div>
                ) : (
                  groups.map((groupName) => (
                    <div 
                      key={groupName} 
                      className={`sidebar-item cursor-pointer ${
                        activeGroup === groupName ? 'active bg-blue-50' : ''
                      }`}
                      onClick={() => onGroupChange(groupName)}
                    >
                      <UserGroupIcon className="sidebar-icon text-gray-500" />
                      <span className="truncate">{groupName}</span>
                    </div>
                  ))
                )}
                <Link to="/students" className="sidebar-item text-blue-600 hover:bg-blue-50">
                  <PlusIcon className="sidebar-icon text-blue-500" />
                  Добавить студентов
                </Link>
              </div>
            )}
          </>
        )}
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 mb-1">Версия</div>
        <div className="font-medium text-gray-700">1.0.0</div>
      </div>
    </div>
  );
};

export default Sidebar;