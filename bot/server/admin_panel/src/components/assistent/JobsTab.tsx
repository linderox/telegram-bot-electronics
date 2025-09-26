// components/assistent/JobsTab.tsx
import React, { useState, useEffect } from 'react';
import request from '../../utils/request';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/ui/spinner/LoadingSpinner'

export interface FineTuningJob {
  id: string;
  model: string;
  status: string;
  created_at: string;
  finished_at?: string;
  fine_tuned_model?: string;
  error?: string;
}

interface JobsTabProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  // Добавляем новые пропсы для обновления текущей модели
  currentSettings?: any;
  updateSettings?: (settings: any) => void;
}

const JobsTab: React.FC<JobsTabProps> = ({ 
  isLoading, 
  setIsLoading,
  currentSettings,
  updateSettings
}) => {
  const [jobs, setJobs] = useState<FineTuningJob[]>([]);
  const [activatingModel, setActivatingModel] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
    
    // Добавляем автоматическое обновление каждые 30 секунд
    const interval = setInterval(() => {
      fetchJobs();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const jobsData = await request('assistent/fine-tuning-jobs');
      setJobs(jobsData);
    } catch (error) {
      toast.error("Ошибка при получении списка задач: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshJobs = () => {
    fetchJobs();
  };

  const activateModel = async (modelId: string) => {
    if (!currentSettings || !updateSettings) {
      toast.error("Невозможно активировать модель: настройки недоступны");
      return;
    }
    
    setActivatingModel(modelId);
    try {
      // Создаем новые настройки с выбранной моделью
      const newSettings = {
        ...currentSettings,
        model: modelId,
        new_models: [modelId],
      };
      
      // Отправляем запрос на обновление настроек
      await request('assistent/settings', 'POST', newSettings);
      
      // Обновляем настройки в родительском компоненте
      updateSettings(newSettings);
      
      toast.success(`Модель ${modelId} установлена как текущая`);
    } catch (error) {
      console.error('Error activating model:', error);
      toast.error("Ошибка при активации модели: " + error.message);
    } finally {
      setActivatingModel(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'running': 'bg-blue-100 text-blue-800',
      'succeeded': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    
    const color = statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8 mt-3 overflow-hidden sm:rounded-lg">
      {/* Синяя плашка с кнопкой обновления */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-500 px-6 py-5 rounded-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Задачи обучения моделей
            </h2>
            <p className="text-blue-100 mt-1">
              Здесь все задачи по обучению моделей и их статус. Вы можете отслеживать прогресс обучения и активировать готовые модели.
            </p>
          </div>
          <div>
            <button
              onClick={refreshJobs}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-md hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Обновление...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  Обновить
                </>
              )}
            </button>
          </div>
        </div>
      </div>
  
  
      {/* Таблица задач или LoaderSpinner */}
      {jobs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center">
          <LoadingSpinner size="large" />
          <p className="text-gray-500 dark:text-white/90 mt-4">Загрузка задач...</p>
        </div>
      ) : (
        <div className="overflow-hidden shadow border-1 border-gray-200 dark:border-white/[0.05]">
  <div className="max-w-full overflow-x-auto bg-white dark:bg-gray-800">
    <table className="min-w-full">
      <thead className="border-gray-200 border-y dark:border-white/[0.05]">
        <tr>
          <th className="px-4 py-3 font-normal text-gray-900 dark:text-white/90 text-start text-theme-sm">ID</th>
          <th className="py-3 font-normal text-gray-900 dark:text-white/90 text-start text-theme-sm">Модель</th>
          <th className="py-3 font-normal text-gray-900 dark:text-white/90 text-start text-theme-sm">Статус</th>
          <th className="px-4 py-3 font-normal text-gray-900 dark:text-white/90 text-start text-theme-sm">Создан</th>
          <th className="px-4 py-3 font-normal text-gray-900 dark:text-white/90 text-start text-theme-sm">Завершен</th>
          <th className="px-4 py-3 font-normal text-gray-900 dark:text-white/90 text-start text-theme-sm">Новая модель</th>
          <th className="px-4 py-3 font-normal text-gray-900 dark:text-white/90 text-start text-theme-sm">Действия</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 dark:divide-white/[0.05] shadow">
        {jobs.map((job) => (
          <tr key={job.id} className="bg-white dark:bg-gray-800">
            <td className="px-4 py-4 text-gray-800 dark:text-white/90 whitespace-nowrap text-theme-sm">
              {job.id.substring(0, 5)}...
            </td>
            <td className="px-4 py-4 text-gray-800 dark:text-white/90 text-theme-sm max-w-[100px]">
              <div className="truncate" title={job.model}>
                {job.model}
              </div>
            </td>
            <td className="px-4 py-4 text-gray-800 dark:text-white/90 text-theme-sm">
              {getStatusBadge(job.status)}
            </td>
            <td className="px-4 py-4 text-gray-800 dark:text-white/90 text-theme-sm">
              {formatDate(job.created_at)}
            </td>
            <td className="px-4 py-4 text-gray-800 dark:text-white/90 text-theme-sm">
              {job.finished_at ? formatDate(job.finished_at) : '-'}
            </td>
            <td className="px-4 py-4 text-gray-800 dark:text-white/90 text-theme-sm">
              {job.fine_tuned_model || (job.status === 'failed' ? 'Ошибка: ' + job.error : '-')}
            </td>
            <td className="px-4 py-4 text-gray-800 dark:text-white">
              {job.status === 'succeeded' && job.fine_tuned_model ? (
                <button
                  onClick={() => activateModel(job.fine_tuned_model!)}
                  disabled={activatingModel === job.fine_tuned_model || job.fine_tuned_model === currentSettings?.model}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                    job.fine_tuned_model === currentSettings?.model
                      ? 'bg-green-100 text-green-800 cursor-default dark:bg-green-900 dark:text-green-200'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                  }`}
                >
                  {activatingModel === job.fine_tuned_model ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Активация...
                    </span>
                  ) : job.fine_tuned_model === currentSettings?.model ? (
                    "Активна"
                  ) : (
                    "Активировать"
                  )}
                </button>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

      )}
    </div>
  );
};

export default JobsTab;