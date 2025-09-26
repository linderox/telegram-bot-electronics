import React, { useState, useEffect } from 'react';
import request from '../../utils/request';
import { toast } from 'react-toastify';
import LoadingSpinner from '../ui/spinner/LoadingSpinner';

interface EmbeddingItem {
  id?: string;
  title: string;
  content: string;
  created_at?: string;
}

const EmbeddingsTab: React.FC = () => {
  const [embeddingItems, setEmbeddingItems] = useState<EmbeddingItem[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<EmbeddingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch existing embedding items
  useEffect(() => {
    const fetchEmbeddings = async () => {
      setIsLoading(true);
      try {
        const data = await request('assistent/embeddings');
        setEmbeddingItems(data);
      } catch (error) {
        console.error('Error fetching embeddings:', error);
        toast.error('Не удалось загрузить базу знаний');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmbeddings();
  }, []);

  // Filter items when search term or items change
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredItems(embeddingItems);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      setFilteredItems(
        embeddingItems.filter(
          item => 
            item.title.toLowerCase().includes(lowercaseSearch) || 
            item.content.toLowerCase().includes(lowercaseSearch)
        )
      );
    }
  }, [searchTerm, embeddingItems]);

  const handleAddItem = async () => {
    if (!title.trim() || !content.trim()) {
      toast.warning('Пожалуйста, введите заголовок и содержание');
      return;
    }

    setIsProcessing(true);
    try {
      if (editIndex !== null) {
        // Update existing item
        const itemToUpdate = embeddingItems[editIndex];
        const updatedItem = await request(
          `assistent/embeddings/edit/`, 
          'POST', 
          { id: itemToUpdate.id, title, content }
        );
        
        const updatedItems = [...embeddingItems];
        updatedItems[editIndex] = updatedItem;
        setEmbeddingItems(updatedItems);
        toast.success('Запись успешно обновлена');
      } else {
        // Add new item
        const newItem = await request('assistent/embeddings', 'POST', { title, content });
        setEmbeddingItems([...embeddingItems, newItem]);
        toast.success('Запись успешно добавлена');
      }

      // Reset form
      setTitle('');
      setContent('');
      setEditIndex(null);
    } catch (error) {
      console.error('Error saving embedding item:', error);
      toast.error('Ошибка при сохранении: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = (index: number) => {
    setTitle(embeddingItems[index].title);
    setContent(embeddingItems[index].content);
    setEditIndex(index);
    // Scroll to form
    document.getElementById('embedding-title')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleDelete = async (index: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту запись?')) {
      return;
    }

    const itemToDelete = embeddingItems[index];
    
    setIsProcessing(true);
    try {
      await request(`assistent/embeddings/delete/${itemToDelete.id}`, 'POST');
      const updatedItems = embeddingItems.filter((_, i) => i !== index);
      setEmbeddingItems(updatedItems);
      toast.success('Запись успешно удалена');
    } catch (error) {
      console.error('Error deleting embedding item:', error);
      toast.error('Ошибка при удалении: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setContent('');
    setEditIndex(null);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        if (Array.isArray(jsonData)) {
          // Check if the format is correct (contains title and content fields)
          const validData = jsonData.filter(item => item.title && item.content);
          
          if (validData.length > 0) {
            setIsProcessing(true);
            try {
              const response = await request('assistent/embeddings/import', 'POST', validData);
              setEmbeddingItems(response);
              toast.success(`Импортировано ${validData.length} записей`);
            } catch (error) {
              console.error('Error importing embeddings:', error);
              toast.error('Ошибка при импорте: ' + error.message);
            } finally {
              setIsProcessing(false);
            }
          } else {
            toast.error('Неверный формат файла. Необходимы поля "title" и "content"');
          }
        } else {
          toast.error('Неверный формат файла. Ожидается массив объектов');
        }
      } catch (error) {
        toast.error('Ошибка при чтении файла');
        console.error(error);
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  const handleExport = () => {
    if (embeddingItems.length === 0) {
      toast.warning('Нет данных для экспорта');
      return;
    }

    const exportData = embeddingItems.map(({ title, content }) => ({ title, content }));
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'knowledge_base.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 mt-3 overflow-hidden sm:rounded-lg">
      {/* Header Card */}
      <div className="bg-white overflow-hidden border rounded-lg border-gray-200 dark:bg-gray-800 dark:border-gray-700 transition-shadow duration-300">
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-500 px-6 py-5 border dark:border-gray-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
                База знаний
              </h2>
              <p className="text-blue-100 mt-1 text-sm md:text-base">
                Добавляйте и управляйте информацией для контекстного поиска
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                id="import-file-embeddings"
                className="sr-only"
                accept=".json"
                onChange={handleImport}
                disabled={isProcessing}
              />
              <label
                htmlFor="import-file-embeddings"
                className={`cursor-pointer inline-flex items-center rounded-md px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isProcessing ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
                }`}
              >
                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                </svg>
                Импорт
              </label>
              
              <button
                type="button"
                onClick={handleExport}
                disabled={isProcessing || embeddingItems.length === 0}
                className={`inline-flex items-center rounded-md px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isProcessing || embeddingItems.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-white text-blue-600 hover:bg-blue-50 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
                }`}
              >
                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                Экспорт
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Card - Add Embedding Item */}
    <div className="bg-white shadow-lg overflow-hidden border border-gray-200 transition-shadow duration-300 rounded-lg dark:bg-gray-800 dark:border-gray-700">
      <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 dark:from-gray-700 dark:to-gray-600 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center dark:text-white">
          <svg className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          {editIndex !== null ? 'Редактирование записи' : 'Добавление новой записи'}
        </h3>
      </div>
      
      <div className="p-6">
        <div className="space-y-5">
          <div>
            <label htmlFor="embedding-title" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Заголовок <span className="textred-500">*</span>
            </label>
            <div className="relative mt-1 rounded-md">
              <input
                type="text"
                id="embedding-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                placeholder-gray-400 transition duration-200 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                placeholder="Введите заголовок статьи или документа..."
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="embedding-content" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Содержание <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <textarea
                id="embedding-content"
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                placeholder-gray-400 transition duration-200
                resize-y bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                placeholder="Введите текст, который будет использоваться для поиска релевантной информации..."
              />
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Добавьте полезную информацию, которая может быть использована ассистентом для ответов на вопросы.
            </p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          {editIndex !== null && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isProcessing}
              className="mr-auto flex items-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
            >
              <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              Отменить
            </button>
          )}
          <button
            type="button"
            onClick={handleAddItem}
            disabled={isProcessing}
            className="inline-flex items-center py-2.5 px-5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
          >
            {isProcessing ? (
              <>
                <LoadingSpinner className="mr-2" />
                Сохранение...
              </>
            ) : editIndex !== null ? (
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
              Добавить запись
            </>
          )}
          </button>
        </div>
      </div>
    </div>
      
    {/* Knowledge Base Items */}
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700">
      <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 dark:from-gray-900 dark:to-gray-800 dark:border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center dark:text-white">
            <svg className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            Записи базы знаний
            {embeddingItems.length > 0 && (
              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-200 dark:text-blue-900">
                {embeddingItems.length}
              </span>
            )}
          </h3>
          
          {embeddingItems.length > 0 && (
            <div className="relative max-w-lg flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                name="search"
                id="search-embeddings"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-lg border border-gray-300 bg-white py-2.5 pr-4 text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 sm:text-sm transition duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:placeholder-gray-400"
                placeholder="Поиск по заголовкам и содержанию..."
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
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
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="large" />
          <span className="ml-3 text-gray-500">Загрузка данных...</span>
        </div>
      ) : embeddingItems.length > 0 ? (
        <>
          <div className="overflow-x-auto dark:bg-gray-800 dark:text-gray-300">
  <table className="min-w-full divide-y divide-gray-200 table-fixed dark:divide-gray-700">
    <thead className="bg-gray-50 dark:bg-gray-700">
      <tr>
        <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12 dark:text-gray-300">№</th>
        <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/3 dark:text-gray-300">Заголовок</th>
        <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-300">Содержание</th>
        <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-24 dark:text-gray-300">Действия</th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
      {filteredItems.map((item, index) => {
        const originalIndex = embeddingItems.findIndex(
          (originalItem) => originalItem.id === item.id
        );
        return (
          <tr key={item.id || index} className={`${editIndex === originalIndex ? "bg-blue-50 dark:bg-blue-900" : ""} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150`}>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 text-xs font-medium dark:bg-gray-700 dark:text-white/90">
                {originalIndex + 1}
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
              <div className="font-medium text-blue-700 dark:text-blue-300">{item.title}</div>
              {item.created_at && (
                <div className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                  Добавлено: {new Date(item.created_at).toLocaleString()}
                </div>
              )}
            </td>
            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
              <div className="max-h-32 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                {item.content.length > 200 
                  ? `${item.content.substring(0, 200)}...` 
                  : item.content}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => handleEdit(originalIndex)}
                  disabled={isProcessing}
                  className={`text-blue-600 hover:text-blue-900 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full p-1 hover:bg-blue-100 dark:hover:bg-blue-900 ${
                    isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  aria-label="Редактировать"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(originalIndex)}
                  disabled={isProcessing}
                  className={`text-red-600 hover:text-red-900 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-full p-1 hover:bg-red-100 dark:hover:bg-red-900 ${
                    isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
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
          
          {filteredItems.length === 0 && searchTerm && (
            <div className="px-6 py-12 text-center dark:bg-gray-800 dark:text-gray-300">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Ничего не найдено</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">По запросу "{searchTerm}" ничего не найдено.</p>
              <button 
                onClick={() => setSearchTerm('')}
                className="mt-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
              >
                Сбросить поиск
              </button>
            </div>
          )}

          {filteredItems.length > 0 && (
  <div className="bg-white text-gray-600 px-6 py-4 border-t border-gray-200 sm:flex sm:items-center sm:justify-between dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300">
    <div className="text-sm text-gray-500 dark:text-gray-400">
      {filteredItems.length === embeddingItems.length 
        ? `Показано ${embeddingItems.length} из ${embeddingItems.length}` 
        : `Найдено ${filteredItems.length} из ${embeddingItems.length}`}
    </div>
    {embeddingItems.length > 10 && searchTerm && (
      <div className="mt-3 sm:mt-0">
        <button
          type="button"
          onClick={() => setSearchTerm('')}
          className="inline-flex items-center text-sm font-medium text-blue-500 hover:text-blue-700 transition-colors duration-150 dark:text-blue-400 dark:hover:text-blue-600"
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
          <div className="bg-white py-12 px-6 text-center lg:px-8">
            <svg className="mx-auto h-16 w-16 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
            </svg>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">База знаний пуста</h3>
            <p className="mt-2 text-base text-gray-500 max-w-md mx-auto">
              Добавьте справочные материалы с помощью формы выше или импортируйте данные из JSON-файла.
            </p>
          </div>
          )}
    </div>

      {/* Guidance Section */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-5 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
        <div className="flex">
          <div className="flex-shrink-0">
            {/* Иконка */}
            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div className="ml-3">
            {/* Заголовок */}
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Рекомендации по использованию базы знаний</h3>
            {/* Список рекомендаций */}
            <div className="mt-2 text-sm text-blue-700 dark:text-gray-300">
              <ul className="list-disc pl-5 space-y-1">
                <li>Добавляйте полезную информацию, которую может использовать ассистент при ответе на вопросы</li>
                <li>Разбивайте большие документы на логические части с отдельными заголовками</li>
                <li>Чем точнее и структурированнее информация, тем легче ассистент сможет ее найти и использовать</li>
                <li>Для изменения текущей информации или добавления новой достаточно отредактировать или добавить записи - встраивания для поиска будут созданы автоматически</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      </div>
  );
};

export default EmbeddingsTab;
