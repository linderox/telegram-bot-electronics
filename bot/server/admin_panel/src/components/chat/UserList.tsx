// src/components/chat/UserList.jsx
import React, { forwardRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const UserList = forwardRef(({
  users,
  selectedChat,
  onUserSelect,
  onSearch,
  searchTerm,
  onLoadMore,
  loading,
  hasMore
}, ref) => {
  
  // Handle infinite scroll
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    
    // When scrolled to bottom (with a small threshold)
    if (scrollHeight - scrollTop <= clientHeight + 10) {
      onLoadMore();
    }
  };
  
  // Format time relative to now (e.g. "5 mins ago")
  const formatTime = (dateString) => {
    if (!dateString) return '';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ru });
  };
  
  return (
    <div className="flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] xl:flex xl:w-1/4">
      {/* Header */}
      <div className="sticky px-4 pt-4 pb-4 sm:px-5 sm:pt-5 xl:pb-0">
        <div className="flex items-start justify-between">
          <div>
            <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">Cписок пользователей:</h5>
          </div>
          
        </div>
        
        {/* Search box */}
        <div className="flex items-center gap-3 mt-4">
          <button className="flex items-center justify-center w-full text-gray-700 border border-gray-300 rounded-lg h-11 max-w-11 dark:border-gray-700 dark:text-gray-400 xl:hidden">
            <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M3.25 6C3.25 5.58579 3.58579 5.25 4 5.25H20C20.4142 5.25 20.75 5.58579 20.75 6C20.75 6.41421 20.4142 6.75 20 6.75L4 6.75C3.58579 6.75 3.25 6.41422 3.25 6ZM3.25 18C3.25 17.5858 3.58579 17.25 4 17.25L20 17.25C20.4142 17.25 20.75 17.5858 20.75 18C20.75 18.4142 20.4142 18.75 20 18.75L4 18.75C3.58579 18.75 3.25 18.4142 3.25 18ZM4 11.25C3.58579 11.25 3.25 11.5858 3.25 12C3.25 12.4142 3.58579 12.75 4 12.75L20 12.75C20.4142 12.75 20.75 12.4142 20.75 12C20.75 11.5858 20.4142 11.25 20 11.25L4 11.25Z" fill=""></path>
            </svg>
          </button>
          <div className="relative w-full my-2">
            <form onSubmit={(e) => e.preventDefault()}>
              <button className="absolute -translate-y-1/2 left-4 top-1/2">
                <svg className="fill-gray-500 dark:fill-gray-400" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M3.04199 9.37381C3.04199 5.87712 5.87735 3.04218 9.37533 3.04218C12.8733 3.04218 15.7087 5.87712 15.7087 9.37381C15.7087 12.8705 12.8733 15.7055 9.37533 15.7055C5.87735 15.7055 3.04199 12.8705 3.04199 9.37381ZM9.37533 1.54218C5.04926 1.54218 1.54199 5.04835 1.54199 9.37381C1.54199 13.6993 5.04926 17.2055 9.37533 17.2055C11.2676 17.2055 13.0032 16.5346 14.3572 15.4178L17.1773 18.2381C17.4702 18.531 17.945 18.5311 18.2379 18.2382C18.5308 17.9453 18.5309 17.4704 18.238 17.1775L15.4182 14.3575C16.5367 13.0035 17.2087 11.2671 17.2087 9.37381C17.2087 5.04835 13.7014 1.54218 9.37533 1.54218Z" fill=""></path>
                </svg>
              </button>
              <input 
                type="text" 
                placeholder="Поиск..." 
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-[42px] pr-3.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                value={searchTerm}
                onChange={(e) => onSearch(e.target.value)}
              />
            </form>
          </div>
        </div>
      </div>
      
      {/* User List */}
      <div 
        className="flex flex-col max-h-full px-4 overflow-auto custom-scrollbar sm:px-5"
        ref={ref}
        onScroll={handleScroll}
      >
        <div className="max-h-full space-y-1 overflow-auto custom-scrollbar">
          {users.length === 0 && !loading && (
            <div className="py-6 text-center text-gray-500 dark:text-gray-400">
              Пользователи не найдены
            </div>
          )}
          
          {users.map((user) => {
            // Обрезаем имя пользователя, если оно слишком длинное
            const displayName = user.full_name.length > 18 
              ? `${user.full_name.substring(0, 15)}...` 
              : user.full_name;
            
            // Также обрезаем username если он слишком длинный
            const displayUsername = user.username && user.username.length > 18
              ? `@${user.username.substring(0, 15)}...`
              : user.username ? `@${user.username}` : '@Отсутствует';
            
            return (
              <div 
                key={user.telegram_id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg p-3 
                  ${selectedChat === user.chat_id ? 'bg-gray-100 dark:bg-white/[0.05]' : 'hover:bg-gray-100 dark:hover:bg-white/[0.03]'}`}
                onClick={() => onUserSelect(user.chat_id)}
              >
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    {user.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col flex-grow min-w-0">
                  <div className="flex justify-between items-start w-full">
                    <h5 className="truncate text-sm font-medium text-gray-800 dark:text-white/90 max-w-[70%]" title={user.full_name}>
                      {displayName}
                    </h5>
                    {user.latest_message_time && (
                      <span className="text-gray-400 text-theme-xs whitespace-nowrap flex-shrink-0 ml-auto">
                        {formatTime(user.latest_message_time)}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-theme-xs text-gray-500 dark:text-gray-400" title={user.username ? `@${user.username}` : '@Отсутствует'}>
                    {displayUsername}
                  </p>
                </div>
              </div>
            );
          })}
          
          {loading && (
            <div className="py-4 text-center">
              <div className="inline-block w-6 h-6 border-2 border-t-brand-500 border-r-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default UserList;
