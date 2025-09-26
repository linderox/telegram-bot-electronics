import request from "../utils/request";

export const fetchChatUsers = async (limit = 10, offset = 0, search = '') => {
  try {
    const params = { limit, offset };
    if (search) params.search = search;
    
    const response = await request(`user-chats`, 'GET', undefined, params);
    console.log(response)
    return response;
  } catch (error) {
    console.error('Error fetching chat users:', error);
    throw error;
  }
};

// Fetch messages for a specific chat
export const fetchChatMessages = async (chatId) => {
  try {
    const response = await request(`user-chat/${chatId}`);
    return response
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    throw error;
  }
};
