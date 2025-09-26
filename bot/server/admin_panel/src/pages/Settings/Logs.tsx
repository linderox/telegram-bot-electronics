import React, { useState, useEffect, useRef } from 'react';
import request from '../../utils/request';
import { toast } from 'react-toastify';
import PageMeta from '../../components/common/PageMeta';

interface LogEntry {
  content: string;
  type: 'error' | 'success' | 'info';
}

interface LogsResponse {
  assistant: LogEntry[];
  bot: LogEntry[];
}

const TerminalLogs: React.FC = () => {
  const [assistantLogs, setAssistantLogs] = useState<LogEntry[]>([]);
  const [botLogs, setBotLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false); // Новое состояние для кнопки обновления
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'assistant' | 'bot'>('assistant');
  
  const assistantTerminalRef = useRef<HTMLDivElement>(null);
  const botTerminalRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true); // Включаем индикатор загрузки только для ручного обновления
      } else {
        setLoading(true);
      }
      
      const data: LogsResponse = await request("logs");
      setAssistantLogs(data.assistant);
      setBotLogs(data.bot);
      setError(null);
    } catch (e) {
      setError(`Ошибка при получении логов: ${e instanceof Error ? e.message : String(e)}`);
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      if (isManualRefresh) {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchLogs();
    
    const interval = setInterval(() => fetchLogs(), 5000); 
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'assistant' && assistantTerminalRef.current) {
      assistantTerminalRef.current.scrollTop = assistantTerminalRef.current.scrollHeight;
    } else if (activeTab === 'bot' && botTerminalRef.current) {
      botTerminalRef.current.scrollTop = botTerminalRef.current.scrollHeight;
    }
  }, [assistantLogs, botLogs, activeTab]);

  const handleRefresh = () => {
    fetchLogs(true); // Вызываем с флагом для ручного обновления
  };

  // Компонент спиннера загрузки
  const LoadingSpinner = () => (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const renderLogTerminal = (logs: LogEntry[], terminalRef: React.RefObject<HTMLDivElement>, type: 'assistant' | 'bot') => (
    <div 
    ref={terminalRef}
    className={`flex-1 p-4 font-mono overflow-x-hidden text-sm h-100 relative overflow-scroll ${darkMode ? 'bg-black text-green-400' : 'bg-white text-gray-800'} ${activeTab !== type ? 'hidden' : ''}`}
  >
      {loading && logs.length === 0 ? (
        <div className="animate-pulse">Загрузка логов...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : logs.length === 0 ? (
        <div className="opacity-50">{type === 'assistant' ? 'Логи ассистента не найдены' : 'Логи бота не найдены'}</div>
      ) : (
        logs.map((log, index) => (
          <div 
            key={index} 
            className={`mb-1 ${
              log.type === 'error' 
                ? 'text-red-500' 
                : log.type === 'success' 
                  ? 'text-green-500' 
                  : darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            <span className="opacity-70">{`[${index + 1}] `}</span>
            {log.content}
          </div>
        ))
      )}
    </div>
  );

  return (
    <>
      <PageMeta title="Логи" description="Логи бота и ассистена" />

      <div className={`flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Заголовок */}
      <div className={`flex justify-between items-center p-4 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800'}`}>
        <h1 className="text-xl font-mono font-bold">
          {activeTab === 'assistant' ? 'Логи ассистента' : 'Логи бота'}
        </h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`px-3 py-1 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white font-mono flex items-center justify-center space-x-2 min-w-16`}
          >
            {refreshing ? (
              <LoadingSpinner />
            ) : (
              "Обновить"
            )}
          </button>
        </div>
      </div>
      
      {/* Переключатель табов */}
      <div className={`flex border-b ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
        <button
          className={`py-2 px-4 font-mono ${
            activeTab === 'assistant' 
              ? darkMode 
                ? 'bg-gray-800 text-white border-b-2 border-blue-500' 
                : 'bg-white text-gray-800 border-b-2 border-blue-500'
              : darkMode 
                ? 'text-gray-400 hover:text-gray-200' 
                : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('assistant')}
        >
          Ассистент ({assistantLogs.length})
        </button>
        <button
          className={`py-2 px-4 font-mono ${
            activeTab === 'bot' 
              ? darkMode 
                ? 'bg-gray-800 text-white border-b-2 border-blue-500' 
                : 'bg-white text-gray-800 border-b-2 border-blue-500'
              : darkMode 
                ? 'text-gray-400 hover:text-gray-200' 
                : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('bot')}
        >
          Бот ({botLogs.length})
        </button>
      </div>
      
      {/* Терминалы */}
      <div>
        {renderLogTerminal(assistantLogs, assistantTerminalRef, 'assistant')}
        {renderLogTerminal(botLogs, botTerminalRef, 'bot')}
      </div>
      
      
      <div className={`p-2 text-xs font-mono ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
        {activeTab === 'assistant' 
          ? `${assistantLogs.length} логов ассистента отображено` 
          : `${botLogs.length} логов бота отображено`} 
        {` • Последнее обновление: ${new Date().toLocaleTimeString()}`}
      </div>
    </div>
    </>
    
  );
};

export default TerminalLogs;