import React, { FC, useEffect, useState } from "react";
import { ReactSortable } from "react-sortablejs";
import { CheckCircleIcon, GridIcon, PencilIcon, PlusIcon, TrashBinIcon } from "../../icons";
import request from "../../utils/request";

interface ButtonType {
  id: number;
  title: string;
  row: number;
  column: number;
  text?: string;
}

interface ButtonPosition {
  id: number;
  x: number;
  y: number;
}

interface BasicFunctionProps {
  buttons: ButtonType[];
  newButton?: ButtonType[];
  onNewButton: (setter: (prev: ButtonType[]) => ButtonType[]) => void;
  onButtonChange: (updatedButtons: ButtonType[]) => void;
  onButtonPositionChange: (positions: ButtonPosition[]) => void;
  isDarkMode?: boolean;
  // Добавляем новое свойство для удаленных кнопок
  onButtonDelete?: (deletedIds: number[]) => void;
  setDeletedButtons?: () => void;
}

const tabsHeader = [
  {
    id: "grid",
    icon: <GridIcon width={18} height={18} />,
    label: "Сетка"
  },
  {
    id: "text",
    icon: <PencilIcon width={18} height={18}/>,
    label: "Изменить"
  },
];

const SortableGroup: FC<{
  group: ButtonType[];
  onListChange: (newList: ButtonType[]) => void;
  onStart: () => void;
  onEnd: () => void;
  isDarkMode?: boolean;
}> = ({ group, onListChange, onStart, onEnd, isDarkMode }) => (
  <ReactSortable
    className={`flex items-center min-h-[48px] rounded-md border border-dashed p-1 mb-2 overflow-x-hidden dark:border-gray-600 dark:bg-gray-700 border-gray-300 bg-gray-50`}
    list={group}
    setList={onListChange}
    group={{
      name: "shared",
      put: true,
    }}
    onStart={onStart}
    onEnd={onEnd}
    animation={250}
    direction='horizontal'
    ghostClass="opacity-50"
    forceFallback={true}
  >
    {group.map((item) => (
      <div
        key={item.id}
        className={`${
          isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
        } text-white font-medium rounded-md m-1 p-2 h-10 flex-grow flex items-center justify-center shadow-sm cursor-move transition-colors duration-200`}
      >
        {item.title || item.text}
      </div>
    ))}
  </ReactSortable>
);

const BasicFunction: FC<BasicFunctionProps> = ({ 
  buttons, 
  onButtonChange, 
  onButtonPositionChange, 
  onNewButton,
  setDeletedButtons,
  isDarkMode 
}) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [itemGroups, setItemGroups] = useState<ButtonType[][]>(generateItems(buttons));
  const [editingButtonId, setEditingButtonId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState<string>("");
  const [isAddingButton, setIsAddingButton] = useState(false);
  const [addButtonError, setAddButtonError] = useState<string | null>(null);
  const [isCheckingButton, setIsCheckingButton] = useState(false);
  
  useEffect(() => {
    setItemGroups(generateItems(buttons));
  }, [buttons]);

  useEffect(() => {
    onButtonPositionChange(flattenItems(itemGroups));
  }, [itemGroups, onButtonPositionChange]);

  const handleListChange = (groupIndex: number) => (newList: ButtonType[]) => {
    setItemGroups(prevState => {
      const newState = [...prevState];
      newState[groupIndex] = newList;
      return newState;
    });
  };

  const handleStart = () => {
    setItemGroups(prevState => [...prevState, []]); 
  };

  const handleEnd = () => {
    setItemGroups(prevState => prevState.filter(item => item.length >= 1));
  };

  const startEditing = (buttonId: number, title: string) => {
    setEditingButtonId(buttonId);
    setNewTitle(title);
  };

  const saveEdit = () => {
    if (editingButtonId !== null && newTitle.trim()) {
      onButtonChange(
        itemGroups.flat().map(item => 
          item.id === editingButtonId 
            ? { ...item, title: newTitle } 
            : item
        )
      );

      setEditingButtonId(null);
      setNewTitle("");
    }
  };

  // Открыть форму для добавления кнопки
  const openAddButtonForm = () => {
    setIsAddingButton(true);
    setNewTitle("");
    setAddButtonError(null);
  };

  // Проверить кнопку на сервере и создать новую, если такой не существует
  const checkAndAddButton = async () => {
    if (!newTitle.trim()) {
      setAddButtonError("Введите название кнопки");
      return;
    }

    try {
      setIsCheckingButton(true);
      setAddButtonError(null);

      const response = await request('menu/get-button-by-title', 'GET', undefined, { title: newTitle.trim().toLowerCase() });
      
      // if (response && response.button) {
      //   // Кнопка существует, показываем ошибку
      //   setAddButtonError("Кнопка с таким названием уже существует");
      //   setIsCheckingButton(false);
      //   return;
      // }

      const flatButtons = buttons.length > 0 ? buttons : [];
      const highestRow = flatButtons.length > 0 
        ? Math.max(...flatButtons.map(button => button.row || 0))
        : 0;
      
      const maxId = flatButtons.length > 0
        ? Math.max(...flatButtons.map(button => button.id || 0))
        : 0;
      
      const newButton = {
        id: maxId + 1,
        title: newTitle,
        row: highestRow + 1,
        column: 1,
      };

      onNewButton(prevState => [...prevState, newButton]);
      setIsAddingButton(false);
      setNewTitle("");
      
    } catch (error) {
      console.error("Ошибка при проверке кнопки:", error);
      setAddButtonError("Ошибка при проверке кнопки");
    } finally {
      setIsCheckingButton(false);
    }
  };

  // Отмена добавления кнопки
  const cancelAddButton = () => {
    setIsAddingButton(false);
    setNewTitle("");
    setAddButtonError(null);
  };

  const handleDeleteButton = (buttonId: number) => {
    // Добавляем ID кнопки в список удаленных
    setDeletedButtons(prev => [...prev, buttonId]);
    
    // Обновляем отображение кнопок, удаляя выбранную
    onButtonChange(
      itemGroups.flat().filter(item => item.id !== buttonId)
    );
  };
  

  return (
    <>
      <div className="flex justify-between mb-2">
        <h2 className={`text-lg font-bold dark:text-white/90 text-gray-700`}>Кнопки</h2>
        <div className="flex rounded-md shadow-sm">
        {tabsHeader.map((tab, idx) => (
          <button
            key={idx}
            className={`px-4 py-2 text-sm font-medium flex items-center ${
              idx === activeTabIndex
                ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-700 dark:border-blue-700"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
            } ${idx === 0 ? "rounded-l-md" : ""} ${
              idx === tabsHeader.length - 1 ? "rounded-r-md" : ""
            } border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
            onClick={() => setActiveTabIndex(idx)}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}

        </div>
      </div>

      {tabsHeader[activeTabIndex].id === "grid" ? (
        itemGroups.map((group, groupIndex) => (
          <SortableGroup
            key={groupIndex}
            group={group}
            onListChange={handleListChange(groupIndex)}
            onStart={handleStart}
            onEnd={handleEnd}
            isDarkMode={isDarkMode}
          />
        ))
      ) : (
        <div className="space-y-2">
          {itemGroups.flat().map((item) => (
            <div key={item.id} className="flex items-center space-x-2">
              {editingButtonId === item.id ? (
                <>
                 <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className={`flex-grow border rounded-md p-2 h-10 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100`}
                    autoFocus
                  />
                <button 
                  onClick={saveEdit} 
                  className={`bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-md h-10 w-10 flex justify-center items-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
                >
                  <CheckCircleIcon style={{ fill: "#fff" }} />
                </button>
                </>
              ) : (
                <>
                  <div className={`flex-grow bg-blue-600 dark:bg-blue-500 text-white font-medium rounded-md p-2 h-10 flex items-center truncate`}>
                    {item.title || item.text || ""}
                  </div>
                  <div className="flex space-x-1">
                 <button
                    onClick={() => startEditing(item.id, item.title || item.text || "")}
                    className={`bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white rounded-md h-10 w-10 flex justify-center items-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
                  >
                    <PencilIcon className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => handleDeleteButton(item.id)}
                    className={`bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-md h-10 w-10 flex justify-center items-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
                  >
                    <TrashBinIcon className="w-5 h-5 text-white" />
                  </button>
                </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {isAddingButton ? (
        <div className="mt-4 space-y-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Введите название кнопки"
            className="w-full border rounded-md p-2 h-10 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 text-gray-800 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            autoFocus
          />
          
          {addButtonError && (
            <div className="text-red-500 text-sm">{addButtonError}</div>
          )}
          
          <div className="flex space-x-2">
          <button
            onClick={checkAndAddButton}
            disabled={isCheckingButton}
            className="flex-1 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium rounded-md p-2 h-10 flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800"
          >
            {isCheckingButton ? (
              <div className="flex items-center">
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Проверка...
              </div>
            ) : (
              "Добавить"
            )}
          </button>

            <button 
              onClick={cancelAddButton} 
              className={`flex-1 ${
                isDarkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
              } text-gray-800 font-medium rounded-md p-2 h-10 flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
                isDarkMode ? 'focus:ring-offset-gray-800 text-gray-200' : ''
              }`}
            >
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={openAddButtonForm} 
          className="flex items-center justify-center gap-2 h-10 border-2 rounded w-full mt-4 cursor-pointer transition-colors duration-200 border-blue-400 hover:bg-blue-50 text-blue-500 dark:hover:bg-blue-900 dark:text-white/90">
          <span className="text-xl">+</span>
          <span className="font-medium">Добавить кнопку</span>
        </button>
      )}
    </>
  );
};

function generateItems(flatItems: ButtonType[]): ButtonType[][] {
  if (!flatItems || flatItems.length === 0) {
    return [[]];
  }

  const groupedItems: { [key: number]: ButtonType[] } = {};

  flatItems.forEach(item => {
    const row = item.row || 1;
    if (!groupedItems[row]) {
      groupedItems[row] = [];
    }
    groupedItems[row].push({ 
      id: item.id, 
      title: item.title || item.text || "", 
      row: row,
      column: item.column || 1
    });
  });

  const itemsArray: ButtonType[][] = Object.values(groupedItems);
  // itemsArray.push([]);

  return itemsArray;
}

function flattenItems(matrix: ButtonType[][]): ButtonPosition[] {
  const result: ButtonPosition[] = [];

  matrix.forEach((row, rowIndex) => {
    if (row.length > 0) {
      row.forEach((button, columnIndex) => {
        result.push({ 
          id: button.id, 
          x: rowIndex + 1, 
          y: columnIndex + 1 
        });
      });
    }
  });

  return result;
}

export default BasicFunction;