import { useState } from "react";

const ChartTab: React.FC<{ selected: "month" | "week" | "day"; setSelected: (value: "month" | "week" | "day") => void; }> = ({ selected, setSelected }) => {
  const getButtonClass = (option: "month" | "week" | "day") =>
    selected === option
      ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
      : "text-gray-500 dark:text-gray-400";

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
      <button
        onClick={() => setSelected("month")}
        className={`px-2 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass("month")}`}
      >
        Месяц
      </button>

      <button
        onClick={() => setSelected("week")}
        className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass("week")}`}
      >
        Неделя
      </button>

      <button
        onClick={() => setSelected("day")}
        className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass("day")}`}
      >
        День
      </button>
    </div>
  );
};

export default ChartTab;