import React from 'react';
import { PlusIcon } from '../../icons';


export const DragAndDropPanel = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="absolute top-4 right-4 z-10 mt-19 mr-2 dark:bg-gray-800 dark:text-white/90">
  <div
    className="flex items-center justify-center w-48 h-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg cursor-move hover:shadow-xl transition-all duration-200 border-2 border-dashed border-blue-500 dark:border-blue-500/90"
    onDragStart={(event) => onDragStart(event, 'menuNode')}
    draggable
  >
    <PlusIcon className="w-5 h-5 text-blue-500 dark:text-blue-500/90 mr-2" fill='oklch(0.623 0.214 259.815)'/>
    <span className="text-sm font-medium text-blue-500 dark:text-white">Новое меню</span>
  </div>
</div>
  );
};