import React, { useState, useEffect } from 'react';
import { TrainingData } from '../../types';
import { LoadIcon } from '../../icons';
import LoadingSpinner from '../ui/spinner/LoadingSpinner';

interface TrainingTabProps {
  trainingData: TrainingData[];
  setTrainingData: React.Dispatch<React.SetStateAction<TrainingData[]>>;
  modelsForTraining: string[];
  selectedBaseModel: string;
  setSelectedBaseModel: React.Dispatch<React.SetStateAction<string>>;
  onTrainModel: (systemPrompt?: string) => void;
  isLoading: boolean;
}

const TrainingTab: React.FC<TrainingTabProps> = ({
  trainingData,
  setTrainingData,
  modelsForTraining,
  selectedBaseModel,
  setSelectedBaseModel,
  onTrainModel,
  isLoading
}) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState<TrainingData[]>([]);
  const [systemPrompt, setSystemPrompt] = useState('');

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredData(trainingData);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      setFilteredData(
        trainingData.filter(
          item => 
            item.question.toLowerCase().includes(lowercaseSearch) || 
            item.answer.toLowerCase().includes(lowercaseSearch)
        )
      );
    }
  }, [searchTerm, trainingData]);

  const handleAddData = () => {
    if (!question.trim() || !answer.trim()) {
      alert('Пожалуйста, введите вопрос и ответ');
      return;
    }

    if (editIndex !== null) {
      // Update existing item
      const updatedData = [...trainingData];
      updatedData[editIndex] = { question, answer };
      setTrainingData(updatedData);
      setEditIndex(null);
    } else {
      // Add new item
      setTrainingData([...trainingData, { question, answer }]);
    }

    // Reset form
    setQuestion('');
    setAnswer('');
  };

  const handleEdit = (index: number) => {
    setQuestion(trainingData[index].question);
    setAnswer(trainingData[index].answer);
    setEditIndex(index);
    // Scroll to form
    document.getElementById('question')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleDelete = (index: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту пару?')) {
      const updatedData = trainingData.filter((_, i) => i !== index);
      setTrainingData(updatedData);
    }
  };

  const handleCancel = () => {
    setQuestion('');
    setAnswer('');
    setEditIndex(null);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        if (Array.isArray(jsonData)) {
          // Check if the format is correct (contains question and answer fields)
          const validData = jsonData.filter(item => item.question && item.answer);
          if (validData.length > 0) {
            setTrainingData(validData);
          } else {
            alert('Неверный формат файла. Необходимы поля "question" и "answer"');
          }
        } else {
          alert('Неверный формат файла. Ожидается массив объектов');
        }
      } catch (error) {
        alert('Ошибка при чтении файла');
        console.error(error);
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  const handleExport = () => {
    if (trainingData.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }

    const dataStr = JSON.stringify(trainingData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'training_data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const startTraining = () => {
    if (trainingData.length === 0) {
      alert('Добавьте данные для обучения модели');
      return;
    }
    
    if (!selectedBaseModel) {
      alert('Выберите базовую модель для обучения');
      return;
    }
    
    onTrainModel(systemPrompt);
  };

  return (
    <div className="space-y-8 mt-6 sm:rounded-lg">
      {/* Header Card with Model Training Controls */}
      <div className="bg-white shadow-lg overflow-hidden border border-gray-200 transition-shadow duration-300 rounded-lg dark:bg-gray-800 dark:border-gray-700">
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-500 px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
                Обучение модели
              </h2>
              <p className="text-blue-100 mt-1 text-sm md:text-base">
                Создайте уникальную модель на основе обучающих пар "вопрос-ответ"
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px] dark:bg-gray-700 dark:border-gray-600">
  <select
    id="baseModel"
    value={selectedBaseModel}
    onChange={(e) => setSelectedBaseModel(e.target.value)}
    className="block w-full rounded-md border-0 bg-white/10 dark:bg-gray-700 dark:border-gray-600 backdrop-blur-sm text-white py-2.5 pl-3 pr-10 ring-1 ring-inset ring-white/20 dark:ring-gray-500 focus:ring-2 focus:ring-white dark:focus:ring-blue-400 sm:text-sm transition duration-200 appearance-none"
  >
    <option value="" className="text-gray-800 dark:text-white/90">Выберите модель</option>
    {modelsForTraining.map((model) => (
      <option key={model} value={model} className="text-gray-800 dark:text-white/90">
        {model}
      </option>
    ))}
  </select>
  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
    <svg className="h-5 w-5 text-blue-200 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
  </div>
</div>

<button
  type="button"
  onClick={startTraining}
  disabled={isLoading || trainingData.length === 0 || !selectedBaseModel}
  className={`inline-flex items-center rounded-md px-4 py-2.5 text-sm font-semibold  transition-all duration-200 ${
    isLoading || trainingData.length === 0 || !selectedBaseModel
      ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
      : 'bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 border border-transparent dark:bg-gray-700 dark:text-white/90 dark:hover:bg-gray-600 dark:hover:text-white/90'
  }`}
>
  {isLoading ? (
    <>
      <LoadingSpinner/>
      <span className="ml-2">Обучение...</span>
    </>
  ) : (
    <>
      <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      Обучить модель
    </>
  )}
</button>
              
             
            </div>
          </div>
        </div>
      </div>

      {/* Form Card - Add Training Data */}
      <div className="rounded-xl shadow-lg overflow-hidden border border-gray-200 transition-shadow duration-300 hover:shadow-xl dark:border-gray-900">
        <div className="flex justify-between items-center border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 dark:from-gray-700 dark:to-gray-600 dark:border-gray-800 dark:text-white/90">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center dark:text-white/90">
            <svg className="h-5 w-5 mr-2 text-blue-600 dark:text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            {editIndex !== null ? 'Редактирование пары "вопрос-ответ"' : 'Добавление пары "вопрос-ответ"'}
          </h3>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
                <input
                  type="file"
                  id="import-file-empty"
                  className="sr-only"
                  accept=".json"
                  onChange={handleImport}
                />
                <label
                  htmlFor="import-file-empty"
                  className="cursor-pointer inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500  transition-colors duration-150"
                >
                  <LoadIcon className="mr-2 h-5 w-5" />
                  Импортировать JSON
                </label>
          </div>
        </div>
        
        <div className="p-6 dark:bg-gray-800 dark:text-white/90">
  <div className="space-y-5">
    <div>
      <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1">
        Системный промпт <span className="text-gray-400 dark:text-white/50">(необязательно)</span>
      </label>
      <div className="relative mt-1 rounded-md dark:bg-gray-700 dark:border-gray-600">
        <textarea
          id="systemPrompt"
          name="systemPrompt"
          rows={3}
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          className="block w-full px-4 py-3 border border-blue-400 dark:border-gray-600 rounded-lg  
          focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 
          placeholder-gray-400 dark:placeholder-white/50 transition duration-200
          resize-y bg-white dark:bg-gray-700"
          placeholder="Введите системный промпт для модели..."
        />
      </div>
      <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
        Укажите инструкции для модели, которые будут использоваться при обучении.
      </p>
    </div>
    <div>
      <label htmlFor="question" className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1">
        Вопрос пользователя <span className="text-red-500 dark:text-red-400">*</span>
      </label>
      <div className="relative mt-1 rounded-md dark:bg-gray-700 dark:border-gray-600">
        <textarea
          id="question"
          name="question"
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg  
           focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 
           placeholder-gray-400 dark:placeholder-white/50 transition duration-200
           resize-y bg-white dark:bg-gray-700"
          placeholder="Введите вопрос пользователя..."
        />
      </div>
    </div>
    <div>
      <label htmlFor="answer" className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1">
        Ответ ассистента <span className="text-red-500 dark:text-red-400">*</span>
      </label>
      <div className="relative mt-1 rounded-md dark:bg-gray-700 dark:border-gray-600">
        <textarea
          id="answer"
          name="answer"
          rows={5}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg  
           focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 
           placeholder-gray-400 dark:placeholder-white/50 transition duration-200
           resize-y bg-white dark:bg-gray-700"
          placeholder="Введите желаемый ответ ассистента..."
        />
      </div>
    </div>
  </div>
  <div className="mt-6 flex justify-end">
    {editIndex !== null && (
      <button
        type="button"
        onClick={handleCancel}
        className="mr-auto flex items-center py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg  text-sm font-medium text-gray-700 dark:text-white/90 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition duration-200"
      >
        <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        Отменить
      </button>
    )}
    <button
      type="button"
      onClick={handleAddData}
      className="inline-flex items-center py-2.5 px-5 border border-transparent rounded-lg  text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition duration-200"
    >
      {editIndex !== null ? (
        <>
          <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Сохранить изменения
        </>
      ) : (
        <>
          <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Добавить пару
        </>
      )}
    </button>
  </div>
</div>
      </div>
      
      {/* Data Display and Search Card */}
      <div className="bg-blue-50 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-shadow duration-300 hover:shadow-xl dark:hover:shadow-gray-900 dark:bg-gray-800 dark:text-white/90">
        <div className="border-b border-gray-200 bg-gradient-to-r p-5 dark:bg-gray-800 dark:border-gray-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center dark:text-white/90">
              <svg className="h-5 w-5 mr-2 text-blue-600 dark:text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
              Тренировочные данные
              {trainingData.length > 0 && (
                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {trainingData.length}
                </span>
              )}
            </h3>
            
            {trainingData.length > 0 && (
              <div className="relative max-w-lg flex-1 dark:bg-gray-800 dark:border-gray-700">
  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none dark:text-white/50">
    <svg className="h-5 w-5 text-gray-400 dark:text-white/50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
    </svg>
  </div>
  <input
    type="text"
    name="search"
    id="search"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 py-2.5 pr-4 text-gray-700 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 sm:text-sm transition duration-200"
    placeholder="Поиск по вопросам и ответам..."
  />
  {searchTerm && (
    <button 
      onClick={() => setSearchTerm('')} 
      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 dark:text-white/50 hover:text-gray-600 dark:hover:text-white"
      aria-label="Clear search"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </button>
  )}
</div>
            )}
          </div>
        </div>
        
        {/* Table or Empty State */}
        {trainingData.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 table-fixed dark:divide-gray-700">
  <thead className="bg-gray-50 dark:bg-gray-800">
    <tr>
      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16 dark:text-white/90">
        №
      </th>
      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-white/90">
        Вопрос
      </th>
      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-white/90">
        Ответ
      </th>
      <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 dark:text-white/90">
        Действия
      </th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
    {filteredData.map((item, index) => {
      const originalIndex = trainingData.findIndex(
        (originalItem) => originalItem.question === item.question && originalItem.answer === item.answer
      );
      return (
        <tr key={index} className={`${editIndex === originalIndex ? "bg-blue-50" : ""} hover:bg-gray-50 transition-colors duration-150 dark:hover:bg-gray-700`}>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 text-xs font-medium dark:bg-blue-900 dark:text-blue-200">
              {originalIndex + 1}
            </span>
          </td>
          <td className="px-6 py-4 text-sm text-gray-700 dark:text-white/90">
            <div className="max-h-32 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
              {item.question}
            </div>
          </td>
          <td className="px-6 py-4 text-sm text-gray-700 dark:text-white/90">
            <div className="max-h-32 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
              {item.answer}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium dark:text-white/90">
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => handleEdit(originalIndex)}
                className="text-blue-600 hover:text-blue-900 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full p-1 hover:bg-blue-100 dark:hover:bg-blue-900 dark:text-blue-200"
                aria-label="Редактировать"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </button>
              <button
                onClick={() => handleDelete(originalIndex)}
                className="text-red-600 hover:text-red-900 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-full p-1 hover:bg-red-100 dark:hover:bg-red-900 dark:text-red-200"
                aria-label="Удалить"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      );
    })}
  </tbody>
</table>
            </div>
            
            {filteredData.length === 0 && searchTerm && (
              <div className="px-6 py-12 text-center dark:bg-gray-800 dark:text-white/90">
  <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
  <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Ничего не найдено</h3>
  <p className="mt-1 text-gray-500 dark:text-white/90">По запросу "{searchTerm}" ничего не найдено.</p>
  <button 
    onClick={() => setSearchTerm('')}
    className="mt-3 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md  text-sm font-medium text-gray-700 dark:text-white/90 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400"
  >
    Сбросить поиск
  </button>
</div>
            )}
            
            {filteredData.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 sm:flex sm:items-center sm:justify-between">
  <div className="text-sm text-gray-700 dark:text-white/90">
    {filteredData.length === trainingData.length 
      ? `Показано ${trainingData.length} из ${trainingData.length}` 
      : `Найдено ${filteredData.length} из ${trainingData.length}`}
  </div>
  {trainingData.length > 10 && searchTerm && (
    <div className="mt-3 sm:mt-0">
      <button
        type="button"
        onClick={() => setSearchTerm('')}
        className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-500 transition-colors duration-150"
        >
          <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Показать все записи
        </button>
      </div>
    )}
</div>
              )}
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 py-12 px-6 text-center lg:px-8">
  <svg className="mx-auto h-16 w-16 text-blue-200 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
  </svg>
  <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Нет данных для обучения</h3>
  <p className="mt-2 text-base text-gray-500 dark:text-white/90 max-w-md mx-auto">
    Добавьте пары "вопрос-ответ" с помощью формы выше или импортируйте данные из JSON-файла.
  </p>
</div>
          )}
      </div>
        
        {/* Tips and Guidance */}
        {trainingData.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900 rounded-xl border border-blue-200 dark:border-blue-700 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              <div className="flex-shrink-0 flex justify-center sm:justify-start">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Рекомендации по обучению модели</h3>
                <div className="text-sm text-blue-700 dark:text-blue-400">
                  <ul className="list-none sm:list-disc space-y-2 sm:space-y-1 sm:pl-5">
                    <li className="flex items-center sm:block">
                      <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-2 sm:hidden"></span>
                      <span>Добавляйте разнообразные примеры для более эффективного обучения</span>
                    </li>
                    <li className="flex items-center sm:block">
                      <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-2 sm:hidden"></span>
                      <span>Чем больше качественных пар "вопрос-ответ", тем точнее будет работать модель</span>
                    </li>
                    <li className="flex items-center sm:block">
                      <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-2 sm:hidden"></span>
                      <span>Рекомендуемое количество обучающих примеров: не менее 20-30 пар</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
    );
  };
  
  export default TrainingTab;
  