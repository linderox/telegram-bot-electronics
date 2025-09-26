import React from 'react';
import { Handle, Position } from '@xyflow/react';
import {MenuItem} from '../../interfaces'
import MenuHandle from './MenuHandle'
import stripHtmlTags from '../../utils/stripHTML'
import { PencilIcon } from '../../icons';

interface CustomNodeProps {
    data: MenuItem; 
}

export const ButtonNode = ({ data }) => {
    // Determine if this is a back navigation button
    const isBackButton = ['назад', 'вернуться'].some(substring => 
        data.title?.toLowerCase().includes(substring)
    );

    const title = data.title
    
    return <div className='w-91 my-1'>
        <button className={`${isBackButton ? 'bg-blue-400 hover:bg-blue-700' : 'bg-blue-400 hover:bg-blue-700'} text-white font-bold py-2 px-4 rounded w-full`}>
            {title.charAt(0).toUpperCase() + title.slice(1)}
        </button>
        <Handle 
            type="source" 
            position={isBackButton ? Position.Left : Position.Right}
            id={`handle-${data.id}`}
            style={{ 
                background: isBackButton ? '#4c98ef' : '#4c98ef',
                width: '8px',
                height: '8px'
            }}
        />
    </div>
}

export const MenuNode: React.FC<CustomNodeProps> = ({ data }) => {
    const description = stripHtmlTags(data.text)
    const limitedDescription = description.length > 200 ? description.substring(0, 200) + '...' : description;

    return (
        <div className="max-w-sm rounded overflow-hidden shadow-lg bg-white dark:bg-gray-800 w-128 relative">
            {
                data.id != 1  && <Handle type="target" position={Position.Left} />
            }
            
            <div className="px-6 py-4 h-32 overflow-hidden rounded">
                <div className="font-bold text-xl mb-2 text-gray-900 dark:text-white">{data.menu_key.toUpperCase()}</div>
                <p className="text-gray-700 dark:text-gray-300 text-base">
                    {limitedDescription}
                </p>
            </div>
        <div className="px-6 pt-4 pb-2">
            
        </div>
            <footer style={{ height: data.children_buttons.length > 1 ? `${44 * (data.children_buttons.length + 1)}px` : '40px' }}>
                
            </footer>
        </div>
    );
};