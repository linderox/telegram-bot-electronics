import { FC, useState } from 'react';

interface TemperatureSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const TemperatureSlider: FC<TemperatureSliderProps> = ({ value, onChange }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="w-full p-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center relative">
          <div 
            className="flex items-center mr-2 text-gray-500 hover:text-indigo-600 cursor-help"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            
            {showTooltip && (
              <div className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-gray-800 rounded shadow-lg border border-gray-200 dark:border-gray-700 w-64 text-sm z-10">
                Определяет степень непредсказуемости ответов модели. Низкие значения подходят для точных задач, высокие - для креативных.
              </div>
            )}
          </div>
          <span className="font-medium text-sm dark:text-white/90">Температура (креативность)</span>
        </div>
        <span className="bg-indigo-100 dark:bg-indigo-900 px-2 py-1 rounded text-sm font-medium dark:text-white/90">
          {value.toFixed(1)}
        </span>
      </div>

      <div className="relative pb-1">
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          style={{ accentColor: '#4f46e5' }}
        />
      </div>

      <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400 ">
        <span>Точный (0)</span>
        <span>Креативный (1)</span>
      </div>
    </div>
  );
};

export default TemperatureSlider;
