import React, { useEffect, useState } from 'react';
import TextEditor from "./TextEditor";
import MediaUploader from './MediaUploader';
import Button from './Button';
import type { MenuItem } from '../../interfaces';
import request from '../../utils/request';
import { toast } from 'react-toastify';
import { TrashBinIcon } from '../../icons';

// Define proper types for button data
interface ButtonType {
  id: number;
  text: string;
  [key: string]: any;
}

interface ButtonPosition {
  id: number;
  position: number;
}

interface SidebarProps {
  nodeData: MenuItem;
  onClose: () => void;
  onUpdate: (label: string) => void;
  onDelete?: () => void; // Optional callback for when menu is deleted
}

const Sidebar: React.FC<SidebarProps> = ({ nodeData, onClose, onUpdate, onDelete }) => {
  const [label, setLabel] = useState(nodeData.menu_key || '');
  const [buttons, setButtons] = useState<ButtonType[]>(nodeData.children_buttons || []);
  const [buttonPositions, setButtonPositions] = useState<ButtonPosition[]>([]);
  const [text, setText] = useState(nodeData.text);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingNode, setIsDeletingNode] = useState(false);
  const [newButtons, setNewButtons] = useState([]);
  const [deletedButtons, setDeletedButtons] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (newButtons.length > 0) {
      setButtons(prevButtons => [...prevButtons, ...newButtons]);
    }
  }, [newButtons])

  const handleUpdate = async () => {
    try {
      setIsLoading(true);
      
      // Update buttons
      await request('update-buttons', "POST", { buttons: buttons.filter(button => !newButtons.some(newButton => newButton.id === button.id)) });
      
      // Update button positions if available
      if (buttonPositions.length > 0) {
        await request('update-button-positions', "POST", { buttons: buttonPositions });
      }
      
      // Update text content
      await request('update-text', "POST", { text, menu_id: nodeData.id });
      
      // Handle media upload or removal
      if (mediaFile) {
        const formData = new FormData();
        formData.append("file", mediaFile);
        formData.append("menu_id", nodeData.id.toString());
        await request('upload-menu-media', "POST", formData);
      } else if (nodeData.media?.file_path && !mediaFile) {
        await request("remove-menu-media", "POST", { menu_id: nodeData.id });
      }

      if (newButtons) {
        await request('menu/add-buttons', 'POST', { parent_menu_id: nodeData.id, buttons: newButtons })
      }

      if (deletedButtons.length > 0) {
        await request('menu/delete-buttons', 'POST', { 
          menu_id: nodeData.id, 
          button_ids: deletedButtons 
        });
      }
      
      onUpdate(label);
      toast.success('Меню успешно обновлено');
    } catch (error) {
      console.error("Failed to update menu:", error);
      toast.error(`Ошибка: ${error.message || 'Не удалось обновить меню'}`)
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  const handleDeleteNode = async () => {
    try {
      setIsDeletingNode(true);
      await request('menu/delete', 'POST', { menu_id: nodeData.id });
      toast.success('Меню успешно удалено');
      if (onDelete) {
        onDelete();
      }
      onClose();
    } catch (error) {
      console.error("Failed to delete menu:", error);
      toast.error(`Ошибка при удалении: ${error.message || 'Не удалось удалить меню'}`);
    } finally {
      setIsDeletingNode(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleButtonChange = (updatedButtons: ButtonType[]) => {
    setButtons(updatedButtons);
  };

  return (
    <>
      {/* Overlay with improved opacity handling */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out z-40 dark:bg-black/70" 
        onClick={onClose} 
      />

      {/* Sidebar panel with refined styling */}
      <div className="fixed right-0 top-0 h-full w-full md:w-1/3 bg-white dark:bg-gray-900 shadow-xl p-6 pt-24 z-50 transition-all duration-300 ease-in-out overflow-y-auto dark:shadow-white dark:shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Настройка меню</h2>
    
          <button
            onClick={() => !nodeData.is_protected && setShowDeleteConfirm(true)}
            className={`p-2 rounded-md transition-colors duration-200 
              ${nodeData.is_protected 
                ? 'text-gray-400 cursor-not-allowed dark:text-gray-500' 
                : 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900'}`}
            title={nodeData.is_protected ? "Это защищенное меню, его нельзя удалить" : "Удалить это меню"}
            disabled={nodeData.is_protected}
          >
            <TrashBinIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Menu configuration section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">ID</h2>
            <input
              type="text"
              value={nodeData.menu_key}
              onChange={(e) => setLabel(e.target.value)}
              className="border border-gray-300 dark:border-gray-700 rounded-md p-2.5 w-full bg-gray-50 dark:bg-gray-900 cursor-not-allowed text-gray-500 dark:text-gray-400"
              readOnly 
            />
          </div>
          
          {/* Media upload section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Медиа</h2>
            <MediaUploader 
              onFileUpdate={setMediaFile} 
              currentFile={mediaFile} 
              mediaUrl={nodeData.media?.file_path} 
            />
          </div>

          {/* Text editor section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Текст</h2>
            <TextEditor text={text} onTextUpdate={setText} />
          </div>

          {/* Button configuration section */}
          <div>
            <Button 
              buttons={buttons} 
              onButtonChange={handleButtonChange} 
              onButtonPositionChange={setButtonPositions} 
              newButton={newButtons}
              onNewButton={setNewButtons}
              setDeletedButtons={setDeletedButtons}
            />
          </div>

          {/* Action buttons with professional styling */}
          <div className="flex space-x-3 pt-2">
            <button 
              onClick={handleUpdate} 
              disabled={isLoading}
              className="px-4 py-2.5 bg-emerald-600 dark:bg-emerald-800 hover:bg-emerald-700 dark:hover:bg-emerald-900 text-white font-medium rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-800 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Сохранение...
                </>
              ) : (
                'Сохранить'
              )}
            </button>

            <button 
              onClick={onClose} 
              disabled={isLoading}
              className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-800 text-gray-800 dark:text-white font-medium rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-800 focus:ring-offset-2 disabled:opacity-70"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ease-in-out z-99999999"
            onClick={() => !isDeletingNode && setShowDeleteConfirm(false)}
          />
          <div className="dark:shadow-white fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-lg shadow-2xl p-6 max-w-md w-full z-999999999 transition-all duration-200 ease-in-out">
            <div className="flex flex-col items-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-800 mb-4">
                <TrashBinIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Удалить меню</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                Вы уверены, что хотите удалить это меню? Это действие нельзя отменить. 
                Все связанные данные будут также удалены.
              </p>
              <div className="flex space-x-3 w-full">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeletingNode}
                  className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-800 text-gray-800 dark:text-white font-medium rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-800 focus:ring-offset-2 disabled:opacity-70"
                >
                  Отмена
                </button>
                <button
                  onClick={handleDeleteNode}
                  disabled={isDeletingNode}
                  className="flex-1 px-4 py-2.5 bg-red-600 dark:bg-red-800 hover:bg-red-700 dark:hover:bg-red-900 text-white dark:text-white font-medium rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-800 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isDeletingNode ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white dark:border-gray-900 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Удаление...
                    </>
                  ) : (
                    'Удалить'
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;
