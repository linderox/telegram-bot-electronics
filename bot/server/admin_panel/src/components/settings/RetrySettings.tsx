import { FC } from 'react';

interface RetrySettingsProps {
  maxAttempts: number;
  delaySeconds: number;
  onChange: (values: {max_attempts?: number, delay_seconds?: number}) => void;
}

const RetrySettings: FC<RetrySettingsProps> = ({ maxAttempts, delaySeconds, onChange }) => {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-2">
          Максимальное количество повторных попыток
        </label>
        <select
          value={maxAttempts}
          onChange={(e) => onChange({ max_attempts: parseInt(e.target.value) })}
          className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          {[1, 2, 3, 4, 5].map((num) => (
            <option key={num} value={num}>
              {num} {num === 1 ? 'попытка' : (num < 5 ? 'попытки' : 'попыток')}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Задержка между попытками (сек)
        </label>
        <select
          value={delaySeconds}
          onChange={(e) => onChange({ delay_seconds: parseInt(e.target.value) })}
          className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          {[1, 2, 3, 5, 10].map((num) => (
            <option key={num} value={num}>
              {num} {num === 1 ? 'секунда' : (num < 5 ? 'секунды' : 'секунд')}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Настройки повторных запросов в случае ошибок при обращении к API модели.
        </p>
      </div>
    </div>
  );
};

export default RetrySettings;
