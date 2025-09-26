import { initData } from "@telegram-apps/sdk-react";
const url = import.meta.env.VITE_API_URL

// Add to request utility
async function request<T>(
    endpoint: string, 
    method: string = "GET", 
    data?: any, 
    params?: Record<string, any>,
    options?: {
      timeout?: number;
      responseType?: 'json' | 'blob' | 'text';
      fileName?: string;
    }
) {
    const controller = new AbortController();
    const timeout = options?.timeout || 10000;
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Build URL with params (existing code)
    const baseEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint; 
    let finalUrl = `${url}/${baseEndpoint}`;

    if (params && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, String(value));
            }
        });
        const queryString = searchParams.toString();
        if (queryString) {
            finalUrl += `?${queryString}`;
        }
    }

    // Setup options
    const requestOptions: RequestInit = {
        method: method,
        headers: {
            "Authorization": `${initData.raw()}`,
        },
        signal: controller.signal
    };

    if (data instanceof FormData) {
        requestOptions.body = data;
    } else if (data) {
        requestOptions.headers['Content-Type'] = 'application/json';
        requestOptions.body = JSON.stringify(data);
    }

    const response = await fetch(finalUrl, requestOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || 'Что-то пошло не так');
    }

    // Handle different response types
    if (options?.responseType === 'blob') {
        const blob = await response.blob();
        
        // If fileName is provided, trigger download
        if (options.fileName) {
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', options.fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            return { success: true } as unknown as T;
        }
        
        return blob as unknown as T;
    } else if (options?.responseType === 'text') {
        return await response.text() as unknown as T;
    } else {
        // Default JSON handling
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json() as T;
        } else {
            return { success: true } as unknown as T;
        }
    }

}


export default request