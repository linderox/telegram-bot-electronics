import React, { useEffect, useState, useCallback } from "react";
import request from "../../utils/request";

// Define the User interface to match the API response
interface User {
  telegram_id: number;
  full_name: string;
  username: string | null;
  is_banned: boolean;
  phone_number: string | null;
  created_at: string;
}

// Define the API response interface
interface UserListResponse {
  users: User[];
  total: number;
  total_pages: number;
  current_page: number;
}

// Status Badge Component
interface StatusBadgeProps {
  isActive: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ isActive }) => {
  const status = isActive ? "Активен" : "Заблокирован";
  const badgeClasses = isActive
    ? "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium text-theme-xs bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
    : "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium text-theme-xs bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500";
  
  return <span className={badgeClasses}>{status}</span>;
};

// Search Component
interface SearchBarProps {
  onSearch: (term: string) => void;
  searchValue: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, searchValue }) => {
  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <div className="relative">
        <button className="absolute -translate-y-1/2 left-4 top-1/2" type="button">
          <svg className="fill-gray-500 dark:fill-gray-400" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M3.04199 9.37381C3.04199 5.87712 5.87735 3.04218 9.37533 3.04218C12.8733 3.04218 15.7087 5.87712 15.7087 9.37381C15.7087 12.8705 12.8733 15.7055 9.37533 15.7055C5.87735 15.7055 3.04199 12.8705 3.04199 9.37381ZM9.37533 1.54218C5.04926 1.54218 1.54199 5.04835 1.54199 9.37381C1.54199 13.6993 5.04926 17.2055 9.37533 17.2055C11.2676 17.2055 13.0032 16.5346 14.3572 15.4178L17.1773 18.2381C17.4702 18.531 17.945 18.5311 18.2379 18.2382C18.5308 17.9453 18.5309 17.4704 18.238 17.1775L15.4182 14.3575C16.5367 13.0035 17.2087 11.2671 17.2087 9.37381C17.2087 5.04835 13.7014 1.54218 9.37533 1.54218Z" fill=""></path>
          </svg>
        </button>
        <input 
          type="text" 
          placeholder="Поиск по имени или юзернейму" 
          className="dark:bg-dark-900 h-[42px] w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-[42px] pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[300px]"
          onChange={(e) => onSearch(e.target.value)}
          value={searchValue}
        />
      </div>
    </form>
  );
};

// Pagination Button Component
interface PaginationButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

const PaginationButton: React.FC<PaginationButtonProps> = ({ onClick, disabled = false, children }) => {
  return (
    <button 
      className={`inline-flex min-w-[40px] h-10 items-center justify-center gap-2 rounded-lg transition px-3 py-2 text-sm bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
};

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-10">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
  </div>
);

const UserCard: React.FC<{ user: User }> = ({ user }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ', ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-3">
        <div className="font-medium text-gray-900 dark:text-white truncate mr-2">
          {user.full_name}
        </div>
        <StatusBadge isActive={!user.is_banned} />
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">ID:</span>
          <span className="text-gray-900 dark:text-white">{user.telegram_id}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Юзернейм:</span>
          <span className="text-gray-900 dark:text-white">{user.username || 'Отсутствует'}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Телефон:</span>
          <span className="text-gray-900 dark:text-white">{user.phone_number || 'Не указан'}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Дата регистрации:</span>
          <span className="text-gray-900 dark:text-white">{formatDate(user.created_at)}</span>
        </div>
      </div>
    </div>
  );
};

export default function UserTable() {
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 5; // Items per page, should match the limit parameter in the API

  // Handle search with debouncing
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500); // 500ms delay
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch users from the API
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm || undefined
      };
      const response: UserListResponse = await request('users', 'GET', undefined, params);
      
      setUsers(response.users);
      setTotalPages(response.total_pages);
    } catch (err: unknown) {
      console.error("Error fetching users:", err);
      setError(err instanceof Error ? err.message : "Ошибка при загрузке пользователей, попробуйте еще раз");
      setUsers([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearchTerm]);

  // Fetch users when page or search term changes
  useEffect(() => {
    fetchUsers();
  }, [currentPage, debouncedSearchTerm]);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // Format date string to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ', ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white pt-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Header Section */}
      <div className="flex flex-col gap-2 px-5 mb-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Пользователи:</h3>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar onSearch={handleSearch} searchValue={searchTerm} />
        </div>
      </div>
      
      {/* Content Section */}
      {isLoading ? (
        <div className="px-4 py-8 text-center">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="px-4 py-8 text-center text-error-600 dark:text-error-400">
          {error}
          <button 
            onClick={fetchUsers}
            className="ml-2 underline text-brand-500"
          >
            Обновить
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="px-4 py-16 text-center">
          <div className="text-gray-500 dark:text-gray-400">Пользователи не найдены</div>
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="md:hidden px-4 space-y-4">
            {users.map((user) => (
              <UserCard key={user.telegram_id} user={user} />
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block overflow-hidden">
            <div className="max-w-full overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="border-gray-100 border-y dark:border-white/[0.05]">
                  <tr>
                    <th className="px-4 py-3 font-normal text-gray-500 text-start text-theme-sm dark:text-gray-400">Telegram ID</th>
                    <th className="py-3 font-normal text-gray-500 text-start text-theme-sm dark:text-gray-400">Полное имя</th>
                    <th className="py-3 font-normal text-gray-500 text-start text-theme-sm dark:text-gray-400">Юзернейм</th>
                    <th className="px-4 py-3 font-normal text-gray-500 text-start text-theme-sm dark:text-gray-400">Номер телефона</th>
                    <th className="px-4 py-3 font-normal text-gray-500 text-start text-theme-sm dark:text-gray-400">Статус</th>
                    <th className="px-4 py-3 font-normal text-gray-500 text-start text-theme-sm dark:text-gray-400">Дата регистрации</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {users.map((user) => (
                    <tr key={user.telegram_id}>
                      <td className="px-4 py-4 text-gray-700 whitespace-nowrap text-theme-sm dark:text-gray-400">
                        {user.telegram_id}
                      </td>
                      <td className="px-4 py-4 text-gray-700 text-theme-sm dark:text-gray-400">
                        <div className="truncate max-w-[200px]" title={user.full_name}>
                          {user.full_name}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-700 whitespace-nowrap text-theme-sm dark:text-gray-400">
                        {user.username || 'Отсутствует'}
                      </td>
                      <td className="px-4 py-4 text-gray-700 text-theme-sm dark:text-gray-400">
                        {user.phone_number || 'Не указан'}
                      </td>
                      <td className="px-4 py-4 text-gray-700 text-theme-sm dark:text-gray-400">
                        <StatusBadge isActive={!user.is_banned} />
                      </td>
                      <td className="px-4 py-4 text-gray-700 text-theme-sm dark:text-gray-400">
                        {formatDate(user.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      
      {/* Pagination */}
      <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-white/[0.05]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <PaginationButton 
              onClick={() => handlePageChange(currentPage - 1)} 
              disabled={currentPage === 1 || isLoading}
            >
              <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M2.58301 9.99868C2.58272 10.1909 2.65588 10.3833 2.80249 10.53L7.79915 15.5301C8.09194 15.8231 8.56682 15.8233 8.85981 15.5305C9.15281 15.2377 9.15297 14.7629 8.86018 14.4699L5.14009 10.7472L16.6675 10.7472C17.0817 10.7472 17.4175 10.4114 17.4175 9.99715C17.4175 9.58294 17.0817 9.24715 16.6675 9.24715L5.14554 9.24715L8.86017 5.53016C9.15297 5.23717 9.15282 4.7623 8.85983 4.4695C8.56684 4.1767 8.09197 4.17685 7.79917 4.46984L2.84167 9.43049C2.68321 9.568 2.58301 9.77087 2.58301 9.99715C2.58301 9.99766 2.58301 9.99817 2.58301 9.99868Z" fill=""></path>
              </svg>
              <span className="hidden sm:inline">Назад</span>
            </PaginationButton>
            
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-400 sm:hidden">
              Страница {currentPage} из {totalPages || 1}
            </span>
            
            <PaginationButton 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0 || isLoading}
            >
              <span className="hidden sm:inline">Вперед</span>
              <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M17.4175 9.9986C17.4178 10.1909 17.3446 10.3832 17.198 10.53L12.2013 15.5301C11.9085 15.8231 11.4337 15.8233 11.1407 15.5305C10.8477 15.2377 10.8475 14.7629 11.1403 14.4699L14.8604 10.7472L3.33301 10.7472C2.91879 10.7472 2.58301 10.4114 2.58301 9.99715C2.58301 9.58294 2.91879 9.24715 3.33301 9.24715L14.8549 9.24715L11.1403 5.53016C10.8475 5.23717 10.8477 4.7623 11.1407 4.4695C11.4336 4.1767 11.9085 4.17685 12.2013 4.46984L17.1588 9.43049C17.3173 9.568 17.4175 9.77087 17.4175 9.99715C17.4175 9.99763 17.4175 9.99812 17.4175 9.9986Z" fill=""></path>
              </svg>
            </PaginationButton>
          </div>
          
          <ul className="hidden sm:flex items-center gap-0.5 overflow-x-auto">
            {(() => {
              let pages = [];
              
              const MAX_PAGES = 20;
              
              if (totalPages <= MAX_PAGES) {
                for (let i = 1; i <= totalPages; i++) {
                  pages.push(i);
                }
              } else {
                if (currentPage <= 3) {
                  pages = [1, 2, 3, 4, '...', totalPages];
                } else if (currentPage >= totalPages - 2) {
                  pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                } else {
                  pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
                }
              }
              
              return pages.map((page, index) => {
                if (page === '...') {
                  return (
                    <li key={`ellipsis-${index}`} className="px-2">
                      <span className="text-gray-500 dark:text-gray-400">...</span>
                    </li>
                  );
                }
                
                return (
                  <li key={`page-${page}`}>
                    <button 
                      className={`flex h-10 w-10 items-center justify-center rounded-lg text-theme-sm font-medium ${
                        page === currentPage 
                          ? 'bg-brand-500 text-white' 
                          : 'text-gray-700 hover:bg-brand-500/[0.08] dark:hover:bg-brand-500 dark:hover:text-white hover:text-brand-500 dark:text-gray-400'
                      }`}
                      onClick={() => handlePageChange(typeof page === 'string' ? parseInt(page, 10) : page)}
                      disabled={isLoading}
                      type="button"
                    >
                      {page}
                    </button>
                  </li>
                );
              });
            })()}
          </ul>
        </div>
      </div>
    </div>
  );
}
