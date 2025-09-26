// src/components/chat/ChatWindow.jsx
import React, { useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale'

const ChatWindow = ({ messages, loading, selectedChat }) => {
  const messagesEndRef = useRef(null);
  
  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Format timestamp
  const formatTime = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'PPPpp', { locale: ru });
  };
  
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] xl:w-3/4">
      {/* Header */}
      <div className="sticky flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 xl:px-6">
        <div className="flex items-center gap-3">
          {/* Р */}
          <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {selectedChat ? 'Чат с ИИ' : 'Выберите чат'}
          </h5>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 max-h-full p-5 space-y-6 overflow-auto custom-scrollbar xl:space-y-8 xl:p-6">
        {!selectedChat && (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            Выберите чат, что-бы просмотреть сообщения
          </div>
        )}
        
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50">
            <div className="inline-block w-8 h-8 border-2 border-t-brand-500 border-r-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {selectedChat && !loading && messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            Сообщения не найдены
          </div>
        )}
        
        {selectedChat && !loading && messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'OPERATOR' ? 'items-start gap-4' : 'justify-end'}`}>
            {message.role === 'OPERATOR' && (
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-medium">
                  {message.text.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
            <div className={message.role === 'OPERATOR' ? '' : 'text-right'}>
              <div className={`px-3 py-2 rounded-lg ${
                message.role === 'OPERATOR' 
                  ? 'bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-white/90 rounded-tl-sm'
                  : 'bg-brand-500 text-white dark:bg-brand-500 rounded-tr-sm'
              }`}>
                <p className="text-sm max-w-150">{message.text}</p>
              </div>
              <p className="mt-2 text-gray-500 text-theme-xs dark:text-gray-400">
                {formatTime(message.created_at)}
              </p>
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input - Disabled for view-only admin mode */}
      {/* <div className="sticky bottom-0 p-3 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="relative w-full">
            <input 
              type="text" 
              placeholder="Режим просмотра." 
              className="w-full pl-12 pr-5 text-sm text-gray-200 bg-transparent border-none outline-hidden h-9 placeholder:text-gray-800 focus:border-0 focus:ring-0 dark:text-white/10"
              disabled
            />
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default ChatWindow;
