import React, { FC, useEffect, useRef, useState } from "react";

interface SortableItem {
  id: number;
  [key: string]: any;
}

interface CustomSortableProps<T extends SortableItem> {
  className?: string;
  items: T[];
  onItemsChange: (newItems: T[]) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  renderItem: (item: T, isDragging: boolean) => React.ReactNode;
  direction?: "horizontal" | "vertical";
}

export const CustomSortable = <T extends SortableItem>({
  className,
  items,
  onItemsChange,
  onDragStart,
  onDragEnd,
  renderItem,
  direction = "horizontal",
}: CustomSortableProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingItem, setDraggingItem] = useState<T | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cloneRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Обновляем refs при изменении списка элементов
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, items.length);
  }, [items]);

  // Создаем клон элемента для перетаскивания
  const createDragClone = (element: HTMLDivElement, mouseX: number, mouseY: number) => {
    const rect = element.getBoundingClientRect();
    
    // Вычисляем смещение для корректного позиционирования клона
    const offsetX = mouseX - rect.left;
    const offsetY = mouseY - rect.top;
    offsetRef.current = { x: offsetX, y: offsetY };
    
    // Создаем клон элемента
    const clone = element.cloneNode(true) as HTMLDivElement;
    clone.style.position = 'fixed';
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.left = `${mouseX - offsetX}px`;
    clone.style.top = `${mouseY - offsetY}px`;
    clone.style.zIndex = '9999';
    clone.style.pointerEvents = 'none';
    clone.style.opacity = '0.8';
    clone.style.transition = 'none';
    clone.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
    
    document.body.appendChild(clone);
    cloneRef.current = clone;
    
    return clone;
  };

  // Обработчик начала перетаскивания
  const handleDragStart = (event: React.MouseEvent<HTMLDivElement>, item: T, index: number) => {
    event.preventDefault();
    
    if (!itemRefs.current[index]) return;
    
    const element = itemRefs.current[index];
    if (!element) return;
    
    setDraggingItem(item);
    setDraggingIndex(index);
    setIsDragging(true);
    
    createDragClone(element, event.clientX, event.clientY);
    
    // Добавляем обработчики для движения и окончания перетаскивания
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    
    // Вызываем колбэк начала перетаскивания
    if (onDragStart) {
      onDragStart();
    }
  };

  // Обработчик движения при перетаскивании
  const handleDragMove = (event: MouseEvent) => {
    if (!isDragging || !cloneRef.current) return;
    
    // Обновляем позицию клона
    cloneRef.current.style.left = `${event.clientX - offsetRef.current.x}px`;
    cloneRef.current.style.top = `${event.clientY - offsetRef.current.y}px`;
    
    // Находим элемент, над которым находится курсор
    if (containerRef.current && draggingIndex !== null) {
      const containerRect = containerRef.current.getBoundingClientRect();
      
      let newDragOverIndex = null;
      
      // Проверяем позицию курсора относительно всех элементов
      for (let i = 0; i < items.length; i++) {
        if (i === draggingIndex) continue;
        
        const itemElement = itemRefs.current[i];
        if (!itemElement) continue;
        
        const itemRect = itemElement.getBoundingClientRect();
        
        if (direction === "horizontal") {
          const itemCenter = itemRect.left + itemRect.width / 2;
          if (event.clientX < itemCenter) {
            newDragOverIndex = i;
            break;
          }
        } else {
          const itemCenter = itemRect.top + itemRect.height / 2;
          if (event.clientY < itemCenter) {
            newDragOverIndex = i;
            break;
          }
        }
      }
      
      // Если курсор находится правее/ниже всех элементов
      if (newDragOverIndex === null) {
        newDragOverIndex = items.length;
        if (draggingIndex < items.length && newDragOverIndex > draggingIndex) {
          newDragOverIndex--;
        }
      }
      
      // Обновляем индекс, над которым находится курсор
      if (newDragOverIndex !== dragOverIndex) {
        setDragOverIndex(newDragOverIndex);
      }
    }
  };

  // Обработчик окончания перетаскивания
  const handleDragEnd = () => {
    // Удаляем обработчики событий
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    
    // Удаляем клон элемента
    if (cloneRef.current) {
      document.body.removeChild(cloneRef.current);
      cloneRef.current = null;
    }
    
    // Перемещаем элемент в новую позицию
    if (draggingIndex !== null && dragOverIndex !== null && draggingItem) {
      const newItems = [...items];
      const [removed] = newItems.splice(draggingIndex, 1);
      newItems.splice(dragOverIndex, 0, removed);
      
      // Оповещаем о изменении списка
      onItemsChange(newItems);
    }
    
    // Сбрасываем состояние
    setDraggingItem(null);
    setDraggingIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
    
    // Вызываем колбэк окончания перетаскивания
    if (onDragEnd) {
      onDragEnd();
    }
  };

  // Рендерим элементы с учетом перетаскивания
  return (
    <div 
      ref={containerRef} 
      className={`custom-sortable ${direction === "vertical" ? "flex-col" : "flex"} ${className || ""}`}
      style={{ display: 'flex', flexWrap: 'wrap' }}
    >
      {items.map((item, index) => {
        const isCurrentDragging = isDragging && draggingItem?.id === item.id;
        
        return (
          <div
            key={item.id}
            ref={el => itemRefs.current[index] = el}
            className={`sortable-item ${isCurrentDragging ? 'invisible' : ''}`}
            onMouseDown={(e) => handleDragStart(e, item, index)}
            style={{ 
              cursor: 'move',
              transition: 'transform 0.2s',
              transform: index === dragOverIndex ? 
                `translate${direction === "horizontal" ? "X(10px)" : "Y(10px)"}` : 
                `translate${direction === "horizontal" ? "X(0)" : "Y(0)"}` 
            }}
          >
            {renderItem(item, isCurrentDragging)}
          </div>
        );
      })}
    </div>
  );
};

export default CustomSortable;