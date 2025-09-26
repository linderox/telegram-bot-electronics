import React, { useState, useEffect } from "react";
import { XCircleIcon } from "../../icons";

interface MediaUploaderProps {
  onFileUpdate: (file: File | null) => void; 
  currentFile: File | null; 
  mediaUrl?: string; 
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ onFileUpdate, currentFile, mediaUrl }) => {
  const [preview, setPreview] = useState<string | ArrayBuffer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);

  useEffect(() => {
    if (currentFile) {
      setIsLoading(true);
      const fileReader = new FileReader();
      
      // Определяем тип медиа по типу файла
      if (currentFile.type.startsWith("video/")) {
        setMediaType("video");
      } else if (currentFile.type.startsWith("image/")) {
        setMediaType("image");
      }
      
      fileReader.onloadend = () => {
        setPreview(fileReader.result);
        setIsLoading(false);
      };
      
      fileReader.onerror = () => {
        console.error("Error reading file");
        setIsLoading(false);
      };
      
      fileReader.readAsDataURL(currentFile);
    } else if (mediaUrl) {
      setIsLoading(true);
      
      // Определяем тип медиа по URL
      if (mediaUrl.match(/\.(mp4|webm|ogg)$/i)) {
        setMediaType("video");
      } else {
        setMediaType("image");
      }
      
      // Если это видео, просто установим URL как превью
      if (mediaUrl.match(/\.(mp4|webm|ogg)$/i)) {
        setPreview(mediaUrl);
        setIsLoading(false);
      } else {
        // Для изображений используем preloading
        const img = new Image();
        img.onload = () => {
          setPreview(mediaUrl);
          setIsLoading(false);
        };
        
        img.onerror = () => {
          console.error("Error loading image from URL");
          setIsLoading(false);
        };
        
        img.src = mediaUrl;
      }
    } else {
      setPreview(null);
      setMediaType(null);
      setIsLoading(false);
    }
  }, [currentFile, mediaUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.type;
      
      if (fileType === "image/png" || fileType === "image/jpeg" || fileType === "video/mp4") {
        onFileUpdate(selectedFile);
      } else {
        alert("Пожалуйста, загрузите файл в формате PNG, JPG или MP4");
        onFileUpdate(null);
      }
    }
  };

  const handleDeleteImage = () => {
    setPreview(null);
    setMediaType(null);
    onFileUpdate(null);
  };

  return (
    <div className="relative dark:bg-gray-800">
      {!preview ? (
        <label
          htmlFor="file"
          className="flex min-h-[175px] w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 transition-colors duration-200 bg-gray-50 dark:bg-gray-700 p-6"
        >
          <div className="text-center text-gray-600 dark:text-white">
            <input
              type="file"
              name="file"
              id="file"
              className="sr-only"
              accept="image/png, image/jpeg, video/mp4"
              onChange={handleFileChange}
            />
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-200">
              <SvgIcon />
            </span>
            <span className="text-base text-gray-600 dark:text-white">
              Перетащите медиа файл или
              <span className="text-blue-600 dark:text-blue-400 font-medium hover:underline ml-1">выберите файл</span>
            </span>
            <span className="block mt-1 text-sm text-gray-500 dark:text-gray-300">PNG, JPG или MP4</span>
          </div>
        </label>
      ) : (
        <div className="mt-4 relative rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[175px] bg-gray-50 dark:bg-gray-700">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Загрузка медиа...</p>
              </div>
            </div>
          ) : (
            <>
              {mediaType === "video" ? (
                <video 
                  controls 
                  className="w-full max-h-[300px] object-contain"
                  poster=""
                >
                  <source src={preview as string} type="video/mp4" />
                  Ваш браузер не поддерживает видео.
                </video>
              ) : (
                <img 
                  src={preview as string} 
                  alt="Preview" 
                  className="w-full max-h-[300px] object-contain" 
                />
              )}
              <button
                onClick={handleDeleteImage}
                className="absolute top-2 right-2 p-1.5 bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-500 text-white rounded-full shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-600 focus:ring-offset-2"
                title="Удалить медиа"
                type="button"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaUploader;

function SvgIcon() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 20 20'
      className="dark:fill-white/90"
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M2.5013 11.666C2.96154 11.666 3.33464 12.0391 3.33464 12.4993V15.8327C3.33464 16.0537 3.42243 16.2657 3.57871 16.4219C3.73499 16.5782 3.94695 16.666 4.16797 16.666H15.8346C16.0556 16.666 16.2676 16.5782 16.4239 16.4219C16.5802 16.2657 16.668 16.0537 16.668 15.8327V12.4993C16.668 12.0391 17.0411 11.666 17.5013 11.666C17.9615 11.666 18.3346 12.0391 18.3346 12.4993V15.8327C18.3346 16.4957 18.0712 17.1316 17.6024 17.6004C17.1336 18.0693 16.4977 18.3327 15.8346 18.3327H4.16797C3.50493 18.3327 2.86904 18.0693 2.4002 17.6004C1.93136 17.1316 1.66797 16.4957 1.66797 15.8327V12.4993C1.66797 12.0391 2.04106 11.666 2.5013 11.666Z'
        fill='#3056D3'
      ></path>
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M9.41074 1.91009C9.73618 1.58466 10.2638 1.58466 10.5893 1.91009L14.7559 6.07676C15.0814 6.4022 15.0814 6.92984 14.7559 7.25527C14.4305 7.58071 13.9028 7.58071 13.5774 7.25527L10 3.67786L6.42259 7.25527C6.09715 7.58071 5.56951 7.58071 5.24408 7.25527C4.91864 6.92984 4.91864 6.4022 5.24408 6.07676L9.41074 1.91009Z'
        fill='#3056D3'
      ></path>
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M10.0013 1.66602C10.4615 1.66602 10.8346 2.03911 10.8346 2.49935V12.4994C10.8346 12.9596 10.4615 13.3327 10.0013 13.3327C9.54106 13.3327 9.16797 12.9596 9.16797 12.4994V2.49935C9.16797 2.03911 9.54106 1.66602 10.0013 1.66602Z'
        fill='#3056D3'
      ></path>
    </svg>
  );
}