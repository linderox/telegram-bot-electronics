import React, { useState, useEffect } from 'react';
import TrainingTab from '../../components/assistent/TrainingTab';
import SettingsTab from '../../components/assistent/SettingsTab';
import JobsTab from '../../components/assistent/JobsTab';
import EmbeddiningsTab from '../../components/assistent/EmbeddingsTab';
import request from '../../utils/request';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/ui/spinner/LoadingSpinner';
import PageMeta from '../../components/common/PageMeta';

// Updated interfaces to match Python data classes
export interface AiModel {
  id: string;
  title: string;
  created_at: string;
}

export interface AssistentConfig {
  model: string;
  models: AiModel[];
  models_for_training: AiModel[];
  max_tokens: number;
  temperature: number;
  max_attempts: number;
  delay_seconds: number;
  prompt: string;
  new_models: string[];
}

export interface TrainingData {
  question: string;
  answer: string;
}

export interface TrainingExample {
  messages: {
    role: 'user' | 'assistant';
    content: string;
  }[];
}

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'settings' | 'training' | 'jobs' | 'dataset'>('settings');
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [currentSettings, setCurrentSettings] = useState<AssistentConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBaseModel, setSelectedBaseModel] = useState<string>('');

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const data = await request('assistent/settings');
        setCurrentSettings(data);
      } catch (error) {
        toast.error("Ошибка при получении настроек: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleTabChange = (tab: 'settings' | 'training' | 'jobs' | 'dataset') => {
    setActiveTab(tab);
  };

  const handleSaveSettings = async (settings: AssistentConfig) => {
    setIsLoading(true);
    try {
      await request('assistent/settings', 'POST', settings);
      setCurrentSettings(settings);
      toast.success("Настройки сохранены успешно");
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Что-то пошло не так');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrainModel = async (modelId: string, prompt: string) => {
    if (trainingData.length === 0) {
      toast.warning('Добавьте данные для обучения');
      return;
    }

    setIsLoading(true);
    try {
      const formattedData = trainingData.map(item => ({
        messages: [
          { role: 'user', content: item.question },
          { role: 'assistant', content: item.answer }
        ]
      }));

      await request('assistent/train-model', 'POST', {
        model: modelId,
        training_data: formattedData,
        prompt: prompt
      });

      const updatedSettings = await request('assistent/settings');
      setCurrentSettings(updatedSettings);
      toast.success('Модель отправлена на обучение');
    } catch (error) {
      console.error('Error training model:', error);
      toast.error('Ошибка при обучении модели: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  return (      
    <>
      <PageMeta title="Параметры ассистента" description="Насстройки для ассистена" />
      <div className="w-full">
        {/* Tabs navigation */}
        <div className="mb-6 bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
          <div className="w-full overflow-x-auto scrollbar-hide">
            <div className="flex flex-nowrap md:flex-wrap items-center gap-2 bg-gray-100 dark:bg-gray-700 p-2 min-w-max">
              <button 
                onClick={() => handleTabChange('settings')}
                className={`whitespace-nowrap inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  activeTab === 'settings' 
                    ? 'text-gray-900 dark:text-white bg-white dark:bg-gray-800 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50'
                }`}
              >
                Настройки
              </button>
              <button 
                onClick={() => handleTabChange('dataset')}
                className={`whitespace-nowrap inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  activeTab === 'dataset' 
                    ? 'text-gray-900 dark:text-white bg-white dark:bg-gray-800 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50'
                }`}
              >
                База информации
              </button>
              <button 
                onClick={() => handleTabChange('training')}
                className={`whitespace-nowrap inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  activeTab === 'training' 
                    ? 'text-gray-900 dark:text-white bg-white dark:bg-gray-800 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50'
                }`}
              >
                Обучение
              </button>
              <button 
                onClick={() => handleTabChange('jobs')}
                className={`whitespace-nowrap inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  activeTab === 'jobs' 
                    ? 'text-gray-900 dark:text-white bg-white dark:bg-gray-800 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50'
                }`}
              >
                Статус
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'settings' && currentSettings ? (
            <SettingsTab
              models={currentSettings.models}
              availableModels={currentSettings.models}
              modelsForTraining={currentSettings.models_for_training}
              currentSettings={currentSettings}
              onSaveSettings={handleSaveSettings}
              isLoading={isLoading}
            />
          ) : activeTab === 'training' && currentSettings ? (
            <TrainingTab
              trainingData={trainingData}
              setTrainingData={setTrainingData}
              modelsForTraining={currentSettings.models_for_training.map(model => model.id)}
              selectedBaseModel={selectedBaseModel}
              setSelectedBaseModel={setSelectedBaseModel}
              onTrainModel={(prompt) => handleTrainModel(selectedBaseModel, prompt)}
              isLoading={isLoading}
            />
          ) : activeTab === 'jobs' ? (
            <JobsTab
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              currentSettings={currentSettings}
              updateSettings={handleSaveSettings}
            />
          ) : activeTab === 'dataset' ? (
            <EmbeddiningsTab />
          ) : (
            <LoadingSpinner />
          )}
        </div>
      </div>
    </>
  );
};

export default AdminPanel;