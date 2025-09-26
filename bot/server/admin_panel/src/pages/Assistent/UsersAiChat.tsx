// src/pages/AdminChat.jsx
import React, { useState, useEffect, useRef } from 'react';
import UserList from '../../components/chat/UserList';
import ChatWindow from '../../components/chat/ChatWindow';
import { fetchChatUsers, fetchChatMessages } from '../../api/chat';
import PageMeta from '../../components/common/PageMeta';

const AdminChat = () => {
  // State
  const [users, setUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const userListRef = useRef(null);
  
  // Load initial users
  useEffect(() => {
    loadUsers(0, true);
  }, []);
  
  // Load chat messages when user is selected
  useEffect(() => {
    if (selectedChat) {
      loadChatMessages(selectedChat);
    }
  }, [selectedChat]);
  
  // Handle search term changes
  useEffect(() => {
    // Reset pagination and reload users when search changes
    setOffset(0);
    setHasMore(true);
    loadUsers(0, true, searchTerm);
  }, [searchTerm]);
  
  // Load users from API
  const loadUsers = async (newOffset, replace = false, search = searchTerm) => {
    try {
      setLoading(true);
      const response = await fetchChatUsers(10, newOffset, search);
      
      if (replace) {
        setUsers(response.users);
      } else {
        setUsers(prevUsers => [...prevUsers, ...response.users]);
      }
      
      setHasMore(response.total > newOffset + response.users.length);
      setOffset(newOffset);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Load more users when scrolling
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadUsers(offset + 10, false);
    }
  };
  
  // Load chat messages
  const loadChatMessages = async (chatId) => {
    try {
      setLoading(true);
      const chatData = await fetchChatMessages(chatId);
      setMessages(chatData.messages);
    } catch (error) {
      console.error('Error loading chat messages:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle user selection
  const handleUserSelect = (chatId) => {
    setSelectedChat(chatId);
  };
  return (
    <>
      <PageMeta title="Чат с ассистентом" description="Сообщения пользователей а ответы ассистента" />
      <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
      <div className="h-[calc(100vh-150px)] overflow-hidden sm:h-[calc(100vh-174px)]">
        <div className="flex flex-col h-full gap-6 xl:flex-row xl:gap-5">
          {/* User List Component */}
          <UserList 
            users={users}
            selectedChat={selectedChat}
            onUserSelect={handleUserSelect}
            onSearch={setSearchTerm}
            searchTerm={searchTerm}
            onLoadMore={handleLoadMore}
            loading={loading}
            hasMore={hasMore}
            ref={userListRef}
          />
          
          {/* Chat Window Component */}
          <ChatWindow 
            messages={messages}
            loading={loading}
            selectedChat={selectedChat}
          />
        </div>
      </div>
    </div>
    </>
    
  );
};

export default AdminChat;
