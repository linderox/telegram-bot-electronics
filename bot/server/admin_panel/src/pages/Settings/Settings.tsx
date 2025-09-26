import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import request from '../../utils/request';
import PageMeta from '../../components/common/PageMeta';

const Settings: React.FC = () => {
  const [priceLink, setPriceLink] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [isValidUrl, setIsValidUrl] = useState<boolean>(true);
  
  // Загрузка текущей ссылки при монтировании компонента
  useEffect(() => {
    const fetchPriceLink = async () => {
      try {
        setLoading(true);
        const data = await request('settings');
        setPriceLink(data.price_link || '');
      } catch (error) {
        toast.error('Не удалось загрузить текущую ссылку на прайс.');
      } finally {
        setLoading(false);
      }
    };

    fetchPriceLink();
  }, []);

  // Функция для проверки валидности URL
  const validateUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Пустая строка допустима (обработаем отдельно при сохранении)
    
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  };

  const handlePriceLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPriceLink(value);
    setIsValidUrl(validateUrl(value));
  };

  const savePriceLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!priceLink.trim()) {
      toast.warning('Пожалуйста, введите ссылку на прайс.');
      return;
    }

    if (!isValidUrl) {
      toast.error('Пожалуйста, введите корректный URL.');
      return;
    }
    
    try {
        setSaving(true);
        await request('settings', "POST", { price_link: priceLink })
        toast.success('Настройки успешно обновлены.');
    } catch (error) {
        toast.error('Произошла ошибка при сохранении настроек');
    } finally {
        setSaving(false);
    }
  };

  return (
      <>
        <PageMeta title="Настройки" description="Остальные настройки для бота" />
        <div className="mx-auto space-y-8">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          {/* Заголовок */}
          <div className="px-5 py-4 sm:px-6 sm:py-5">
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
              Настройки
            </h3>
          </div>
          
          {/* Форма */}
          <div className="space-y-6 border-t border-gray-100 p-5 sm:p-6 dark:border-gray-800">
            <form className="space-y-6" onSubmit={savePriceLink}>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Ссылка на прайс
                </label>
                <input
                  id="price-link"
                  name="link"
                  type="text"
                  required
                  className={`dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border ${
                    isValidUrl ? 'border-gray-300 dark:border-gray-700' : 'border-red-500 dark:border-red-500'
                  } bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30`}
                  placeholder="Введите URL ссылки на прайс"
                  value={priceLink}
                  onChange={handlePriceLinkChange}
                  disabled={loading || saving}
                />
                {!isValidUrl && (
                  <p className="mt-1 text-sm text-red-500">
                    Пожалуйста, введите корректный URL
                  </p>
                )}
              </div>

              {/* Кнопка сохранения */}
              <div>
                <button
                  type="submit"
                  disabled={loading || saving || !isValidUrl}
                  className={`group relative flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                    loading || saving || !isValidUrl
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  } h-11`}
                >
                  {loading ? (
                    'Загрузка...'
                  ) : saving ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Сохранение...
                    </span>
                  ) : (
                    'Сохранить'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      </>
      
  );
};

export default Settings;