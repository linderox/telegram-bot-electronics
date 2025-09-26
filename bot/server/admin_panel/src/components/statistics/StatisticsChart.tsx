import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import ChartTab from "../common/ChartTab";
import LoadingSpinner from '../ui/spinner/LoadingSpinner'

type StatisticsPeriod = "month" | "week" | "day";

interface StatisticsData {
  month: number[];
  week: number[];
  day: number[];
}

interface StatisticsChartProps {
  selected: StatisticsPeriod;
  setSelected: React.Dispatch<React.SetStateAction<StatisticsPeriod>>;
  data: StatisticsData | null;
  isLoading: boolean;
  error: string | null;
}

export default function StatisticsChart({ 
  selected, 
  setSelected, 
  data, 
  isLoading,
  error
}: StatisticsChartProps) {
  const seriesData = data && data[selected] ? data[selected] : []; 

  const series = [
    {
      name: "Пользователи",
      data: seriesData.length > 0 ? seriesData : [0],
    },
  ];

  const options: ApexOptions = {
    colors: ["#465fff"],
    legend: {
      show: false,
      position: "top",
      horizontalAlign: "left",
    },
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 250,
      type: "line",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "straight",
      width: [2, 2],
    },
    fill: {
      opacity: 1,
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      x: {
        format: "dd MMM yyyy",
      },
    },
    xaxis: {
      type: "category",
      categories: selected === "month" ? generateCurrentMonthDays() : selected === "week" ? generateCurrentWeekDays() : generateCurrentDayHours(),
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
        formatter: (value) => Math.floor(value),
      },
      title: {
        text: "",
        style: {
          fontSize: "0px",
        },
      },
    },
  };
  
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:py-6 h-full">
      <div className="flex flex-col gap-5 sm:flex-row sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Статистика:
          </h3>
        </div>
        <div className="flex items-start gap-3 sm:justify-end">
          <ChartTab selected={selected} setSelected={setSelected} />
        </div>
      </div>

      {error && (
        <div className="flex justify-center items-center h-50 text-red-500">
          <p>{error}</p>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center h-70">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="max-w-full overflow-hidden">
          <div className="min-w-full h-[220px] sm:h-[240px]">
            <Chart options={options} series={series} type="line" height="100%" />
          </div>
        </div>
      )}
    </div>
  );
}

function getTimeLabels(period: StatisticsPeriod): string[] {
  switch (period) {
    case "month":
      return generateCurrentMonthDays();
    case "week":
      return generateCurrentWeekDays();
    case "day":
      return generateCurrentDayHours();
    default:
      return [];
  }
}

function generateCurrentMonthDays(): string[] {
  const days = [];
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();
  const lastDay = today.getDate();
  
  const formatter = new Intl.DateTimeFormat('ru-RU', { month: 'short' });
  const monthName = formatter.format(new Date(year, month));

  for (let i = 1; i <= lastDay; i++) {
    days.push(`${i} ${monthName}`);
  }
  return days;
}

function generateCurrentWeekDays(): string[] {
  const days = [];
  const today = new Date();
  const dayOfWeek = today.getDay() || 7; // Convert Sunday (0) to 7
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek + 1);
  
  const formatter = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' });
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    days.push(`${date.getDate()} ${formatter.format(date)}`);
  }
  return days;
}

function generateCurrentDayHours(): string[] {
  return Array.from({ length: 24 }, (_, i) => `${i}:00`);
}
