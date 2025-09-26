import React, { useCallback, useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { 
  addEdge, 
  ReactFlow, 
  useEdgesState, 
  useNodesState, 
  Controls, 
  Background, 
  BackgroundVariant, 
  Node 
} from '@xyflow/react';
import { MenuNode, ButtonNode } from './Node';
import Sidebar from './Sidebar';
import request from "../../utils/request";
import { DragAndDropPanel } from "./DragAndDropPanel";
import { toast } from 'react-toastify';

// Node types definition
const nodeTypes = {
  menuNode: MenuNode,
  buttonNode: ButtonNode,
};

const defaultViewport = { x: 0, y: 150, zoom: 0.4 };

const Menu: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNodePosition, setNewNodePosition] = useState({ x: 0, y: 0 });
  const [newMenuTitle, setNewMenuTitle] = useState('');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !isSubmitting) {
      handleCreateNewMenu();
    }
  };

  // Улучшенный обработчик создания меню
  const handleCreateNewMenu = async () => {
    if (!newMenuTitle.trim()) {
      setError('Пожалуйста, введите название меню');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await request('menu/create-menu', 'POST', {
        title: newMenuTitle.trim(),
        position_x: Math.round(newNodePosition.x),
        position_y: Math.round(newNodePosition.y),
      });

      console.log(response)

      if (response.ok) {
        setIsModalOpen(false);
        setNewMenuTitle('');

        fetchMenu();
        
        // Показываем уведомление об успехе
        toast.success('Меню успешно создано');
      }
    } catch (error) {
      console.error(error)
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Закрытие модального окна с очисткой состояний
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewMenuTitle('');
    setError('');
    setIsSubmitting(false);
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = document.querySelector('.react-flow')?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'string' && reactFlowBounds) {
        const position = {
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        };
        setNewNodePosition(position);
        setIsModalOpen(true);
      }
    },
    []
  );

  const fetchMenu = async () => {
    setIsLoading(true);
    setNodes([]);
    setEdges([]);
    
    try {
      const data = await request('/menu');
      const nodes = [];
      const edges = [];
  
      data.forEach((menu, index) => {
        nodes.push({
          id: menu.id.toString(),
          position: { x: menu.position_x, y: menu.position_y },
          data: { ...menu },
          type: "menuNode",
        });
  
        menu.children_buttons.forEach((button, buttonIndex) => {
          nodes.push({
            id: `b${button.id}`,
            parentId: menu.id.toString(),
            position: { x: 10, y: 120 + buttonIndex * 37 + (5 + buttonIndex * 12) },
            data: { ...button, parentMenu: menu, nodeType: "buttonNode" },
            type: "buttonNode",
            extent: 'parent',
            draggable: false,
          });
  
          // Find the menu that this button transitions to
          const targetMenu = data.find(m => 
            m.transition_button && m.transition_button.some(tb => tb.id === button.id)
          );
  
          if (targetMenu) {
            const isBackButton = ['назад', 'вернуться'].some(substring => 
              button.title?.toLowerCase().includes(substring)
            );
            
            edges.push({
              id: `e${button.id}-${menu.id}`,
              source: `b${button.id}`,
              target: targetMenu.id.toString(),
              animated: true,
              style: isBackButton 
                ? { stroke: '#4c98ef', strokeWidth: 3, }
                : { stroke: '#4c98ef', strokeWidth: 3 },
              type: isBackButton ? 'smoothstep' : 'default'
            });
          }
        });
      });
  
      setNodes(nodes);
      setEdges(edges);
    } catch (error) {
      console.error(error);
      toast.error("Ошибка при загрузке меню");
    } finally {
      setIsLoading(false);
    }
  };
  

  const onCreateConnection = async (button_id, menu_id) => {
    try {
      setIsLoading(true);
      await request('menu/create-connection', 'POST', {button_id, menu_id});
      toast.success('Переход в меню сохранен');
    } catch (error) {
      return Promise.reject(error.message || "Неизвестная ошибка")
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  }

  const wouldCreateCycle = (sourceId, targetId) => {
    // Check if creating this edge would form a cycle
    const visited = new Set();
    const stack = [targetId];
    
    while (stack.length > 0) {
        const current = stack.pop();
        if (current === sourceId) return true;
        if (visited.has(current)) continue;
        visited.add(current);
        
        // Add all nodes that can be reached from current
        edges.forEach(edge => {
            if (edge.source === current) {
                stack.push(edge.target);
            }
        });
    }
    
    return false;
  };

  const onConnect = useCallback(
    (params) => {
        const sourceNode = nodes.find(node => node.id === params.source);
        const targetNode = nodes.find(node => node.id === params.target);
        
        if (!sourceNode || !targetNode || sourceNode.type !== "buttonNode" || targetNode.type !== "menuNode") {
            return;
        }
        
        const button = sourceNode.data;
        const menu = targetNode.data;
        
        // Check if this is a back button
        const isBackButton = ['назад', 'вернуться'].some(substring => 
            button.title?.toLowerCase().includes(substring)
        );
        
        // For non-back buttons, check if they already have a connection
        if (!isBackButton) {
            const buttonAlreadyConnected = edges.some(edge => edge.source === params.source);
            if (buttonAlreadyConnected) {
                toast.warning('Эта кнопка уже связана с другим меню. Сначала удалите существующую связь.');
                return;
            }
        }
        
        // Proceed with creating the connection
        onCreateConnection(button.id, menu.id)
            .then(() => {
                // Add the edge with appropriate styling
                setEdges((eds) => addEdge({ 
                    ...params, 
                    animated: true,
                    style: { 
                        stroke: isBackButton ? '#4c98ef' : '#4c98ef', 
                        strokeWidth: isBackButton ? 1.5 : 2,
                        strokeDasharray: isBackButton ? '4,3' : undefined 
                    },
                    type: isBackButton ? 'smoothstep' : 'default',
                    markerEnd: {
                        type: 'arrowclosed',
                        color: isBackButton ? '#4c98ef' : '#4c98ef',
                    }
                }, eds));
                toast.success(`Связь ${isBackButton ? 'для кнопки "назад"' : ''} успешно создана`);
            })
            .catch(error => {
                toast.error('Ошибка при создании связи: ' + error);
            });
    },
    [edges, nodes, setEdges, onCreateConnection]
);


  const handleNodeClick = (event: React.MouseEvent, clickedNode: Node) => {
    const isButtonNode = clickedNode.data.nodeType === 'buttonNode';
    const parentMenuId = isButtonNode ? clickedNode.data.parentMenu?.id.toString() : null;
    const selectedNode = isButtonNode ? nodes.find(node => node.id === parentMenuId) : clickedNode;
  
    setSelectedNode(selectedNode);
    setSidebarOpen(true);
  };

  const handleUpdateNode = (newLabel: string) => {
    if (selectedNode) {
      setNodes((nds) =>
        nds.map((node) => {
          return node;
        }),
      );
    }
    fetchMenu();
  };

  const handleNodePositionChange = useCallback(
    async (changes) => {
      for (const change of changes) {
        const { id, position } = change;

        if (!position) {
          return;
        }

        try {
          await request('update-position-menu', "POST", {
            menu_id: id,
            position_x: position.x,
            position_y: position.y,
          });
        } catch (error) {
          console.error("Failed to update node position:", error);
        }
      }
    },
    []
  );

  return (
    <>
      <PageMeta title="Меню бота" description="Настройка меню для бота" />

      <div className="grid grid-cols-12 md:gap-6">
        <div className="col-span-12 space-y-1 xl:col-span-12 flow-nodes">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-t-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Загрузка меню...</p>
              </div>
            </div>
          ) : (
            <>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={(changes) => {
                  onNodesChange(changes);
                  handleNodePositionChange(changes);
                }}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                snapToGrid={true}
                attributionPosition="bottom-left"
                onNodeClick={handleNodeClick}
                defaultViewport={defaultViewport}
                onDragOver={onDragOver}
                onDrop={onDrop}
              >
                <Background variant={BackgroundVariant.Dots} gap={11} size={1} />
              </ReactFlow>
              <DragAndDropPanel />
            </>
            
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-99999999 duration-300 ease-in-out dark:bg-gray-900">
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 shadow-xl dark:shadow-gray-700">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Создание нового меню
      </h3>
      <button
        onClick={handleCloseModal}
        className="text-gray-400 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>

    <div className="space-y-4">
      <div>
        <input
          type="text"
          value={newMenuTitle}
          onChange={(e) => {
            setNewMenuTitle(e.target.value);
            setError(''); // Очищаем ошибку при вводе
          }}
          onKeyPress={handleKeyPress}
          placeholder="Название меню"
          className={`w-full px-3 py-2 border ${
            error ? 'border-red-300' : 'border-gray-300'
          } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:text-white`}
          disabled={isSubmitting}
        />
        {error && (
          <p className="mt-1 text-sm text-red-500 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={handleCloseModal}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          disabled={isSubmitting}
        >
          Отмена
        </button>
        <button
          onClick={handleCreateNewMenu}
          disabled={isSubmitting}
          className={`px-4 py-2 text-sm font-medium text-white dark:text-white rounded-md transition-colors ${
            isSubmitting
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Создание...
            </span>
          ) : (
            'Создать'
          )}
        </button>
      </div>
    </div>
  </div>
</div>
      )}

      {sidebarOpen && selectedNode && (
        <Sidebar
          nodeData={selectedNode.data}
          onClose={() => setSidebarOpen(false)}
          onUpdate={handleUpdateNode}
          onDelete={() => fetchMenu()}
        />
      )}
    </>
  );
};

export default Menu;