import React, { useState, useRef, useMemo } from 'react';
import JoditEditor from 'jodit-react';
import { useTheme } from '../../context/ThemeContext';

export default ({ text, onTextUpdate }) => {
	const editor = useRef(null);

    const { theme, toggleTheme } = useTheme();

	const config = useMemo(() => ({
			readonly: false,
			placeholder: 'Текст еще не добавлен...',
            toolbarAdaptive: false,
            buttons: [
                'bold',
                'strikethrough',
                'underline',
                'italic', '|',
                'undo', 'redo', '|',
                'eraser',
            ],
            disablePlugins: ['table', 'image', 'video', "copy-format", "add-new-line"],
            allowTags: ['b', 'i', 'u', 's'], 
            language: "ru",
            askBeforePasteHTML: false,
            askBeforePasteFromWord: false,
            showXPathInStatusbar: false,
            showWordsCounter: false,
            showCharsCounter: true,
            defaultActionOnPaste: "insert_only_text",
            useSearch: false,
            enter: "BR",
            theme: theme == 'dark' ? 'night1' : 'light' 
		}),
		[theme]
	);

	return (
        <div className="border rounded-lg ">
            <JoditEditor
                ref={editor}
                value={text}
                config={config}
                tabIndex={1}
                onBlur={text => onTextUpdate(text.trim())} // preferred to use only this option to update the content for performance reasons
            />
        </div>
	);
};