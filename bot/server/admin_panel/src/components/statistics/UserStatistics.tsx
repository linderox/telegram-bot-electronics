import React, { useState, useEffect } from "react";
import { GroupIcon, DownloadIcon } from "../../icons";
import request from "../../utils/request";
import StatisticsChart from "./StatisticsChart";
import LoadingSpinner from "../ui/spinner/LoadingSpinner";

type StatisticsPeriod = "month" | "week" | "day";

interface StatisticsData {
  month: number[];
  week: number[];
  day: number[];
  total: number;
}

export default function UserStatistics() {
  const [selected, setSelected] = useState<StatisticsPeriod>("month");
  const [data, setData] = useState<StatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await request<StatisticsData>(`user-statistics?period=${selected}`);
        setData(result);
        setError(null);
      } catch (err) {
        setError("Ошибка при загрузке данных");
        console.error("Error fetching statistics:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selected]);

  const handleDownloadReport = async () => {
    setIsDownloading(true);
    try {
      await request('download-users-report', 'GET', null, null, {
        responseType: 'blob',
        fileName: `users.xlsx`
      });
    } catch (err) {
      console.error("Error downloading report:", err);
      alert("Ошибка при загрузке статистики, попробуйте еще раз");
    } finally {
      setIsDownloading(false);
    }
  };
  

  return (
    <>
      <div className="col-span-12 md:col-span-10">
        <StatisticsChart 
          selected={selected} 
          setSelected={setSelected} 
          data={data} 
          isLoading={isLoading}
          error={error}
        />
      </div>

      <div className="col-span-12 md:col-span-2 grid grid-cols-2 md:grid-cols-1 gap-4 mt-4 md:mt-0">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] flex justify-center items-center">
          <div className="flex items-center flex-col justify-center">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-blue-900/40 mb-2">
              <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
            </div>
            <h4 className="font-bold text-xl md:text-2xl text-gray-800 dark:text-white/90">
                {data?.total || 0}
              </h4>
          </div>
        </div>

        <button 
          onClick={handleDownloadReport}
          disabled={isDownloading}
          className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] transition hover:bg-gray-50 dark:hover:bg-white/[0.06] focus:outline-none"
        >
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl dark:bg-blue-900/40 mb-2">
              <DownloadIcon className="text-blue-600 size-6 dark:text-blue-400" />
            </div>
            {isDownloading ? (
              <LoadingSpinner size="small" />
            ) : (
              <span className="font-medium text-sm md:text-base text-blue-600 dark:text-blue-400">
                Скачать XLSX
              </span>
            )}
          </div>
        </button>
      </div>
    </>
  );

}
