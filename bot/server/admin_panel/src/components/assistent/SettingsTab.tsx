import React, { useState } from 'react';
import { AssistentGPTModel } from '../../types';
import TemperatureSlider from './TemperatureSlider';
import TokensSlider from './TokensSlider';

interface SettingsTabProps {
  models: AssistentGPTModel[],
  availableModels: AssistentGPTModel[];
  modelsForTraining: AssistentGPTModel[];
  isLoading: boolean,
  currentSettings: {
    model: string;
    max_tokens: number;
    temperature: number;
    max_attempts: number;
    delay_seconds: number;
    system_prompt: string; // Добавляем промпт в настройки
  };
  onSaveSettings: (settings: any) => Promise<void>;
  onTrainModel: (modelId: string) => Promise<void>;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  models,
  currentSettings,
  onSaveSettings,
  isLoading,
}) => {
  const [settings, setSettings] = useState(currentSettings);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Convert numeric values
    const numericFields = ['max_tokens', 'temperature', 'max_attempts', 'delay_seconds'];
    const newValue = numericFields.includes(name) ? parseFloat(value) : value;
    
    setSettings(prev => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleTemperatureChange = (value: number) => {
    setSettings(prev => ({
      ...prev,
      temperature: value,
    }));
  };

  const handleTokensChange = (value: number) => {
    setSettings(prev => ({
      ...prev,
      max_tokens: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(settings);
  };

  return (
    <div className="">
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg dark:border-gray-800">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="leading-6 text-gray-900 dark:text-gray-100 text-xl font-bold">Настройки чат-бота</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Основные параметры и выбор модели</p>
        </div>
        
        <div className="border-1 border-gray-200 dark:border-gray-800">
          <div className="bg-gray-50 dark:bg-gray-900 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <div className="sm:col-span-3">
              <form onSubmit={handleSubmit}>
                <div className="space-y-6 relative">
               
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Модель GPT
                  </label>
                  <div className="relative">
                    <select
                      id="model"
                      name="model"
                      value={settings.model}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-3 pr-10 appearance-none border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ease-in-out hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm"
                    >
                      {models.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.title}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>

                  {/* Добавляем настройку системного промпта */}
                  <div className="mt-6">
                    <label htmlFor="system_prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Системный промпт
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                    <textarea
                        id="prompt"
                        name="prompt"
                        rows={(settings.prompt.split('\n').length || 1) + 2}
                        className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ease-in-out hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm"
                        placeholder="Введите системный промпт для модели..."
                        value={settings.prompt}
                        onChange={handleInputChange}
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Системный промпт определяет базовый контекст и поведение модели при общении с пользователем
                    </p>
                    <div className="mt-3">
                      <details className="text-sm text-gray-700 dark:text-gray-300">
                        <summary className="text-indigo-600 dark:text-indigo-400 cursor-pointer font-medium">
                          Примеры системных промптов
                        </summary>
                        <div className="mt-3 space-y-3 pl-5 border-l-2 border-gray-200 dark:border-gray-700">
                          <div>
                            <p className="font-medium">Помощник по продажам:</p>
                            <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                              Ты - помощник по продажам, который помогает клиентам найти подходящие товары и услуги. Отвечай вежливо и профессионально, предлагая релевантные решения.
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">Технический ассистент:</p>
                            <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                              Ты - технический эксперт, который помогает пользователям решать технические проблемы. Давай пошаговые инструкции и объясняй сложные термины простым языком.
                            </p>
                          </div>
                        </div>
                      </details>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TokensSlider value={settings.max_tokens} onChange={handleTokensChange} />
                    <TemperatureSlider value={settings.temperature} onChange={handleTemperatureChange} />
                  </div>

                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div className="relative">
                      <label htmlFor="max_attempts" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Максимальное количество попыток
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <input
                          type="number"
                          name="max_attempts"
                          id="max_attempts"
                          value={settings.max_attempts}
                          onChange={handleInputChange}
                          min="1"
                          max="10"
                          className="block w-full px-4 py-3 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ease-in-out hover:border-indigo-300 dark:hover:border-indigo-700"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                          <span className="text-sm font-medium">попыток</span>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Допустимый диапазон: 1-10
                      </p>
                    </div>

                    <div className="relative">
                      <label htmlFor="delay_seconds" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Задержка между попытками в секундах
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <input
                          type="number"
                          name="delay_seconds"
                          id="delay_seconds"
                          value={settings.delay_seconds}
                          onChange={handleInputChange}
                          min="1"
                          max="60"
                          className="block w-full px-4 py-3 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ease-in-out hover:border-indigo-300 dark:hover:border-indigo-700"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                          <span className="text-sm font-medium">сек</span>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Допустимый диапазон: 1-60
                      </p>
                    </div>
                  </div>
                  <div className="pt-5">
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="ml-3 inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Сохранение...
                          </>
                        ) : (
                          'Сохранить настройки'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;