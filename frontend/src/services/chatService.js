import api from "./api";

const chatService = {
  // Get all conversations for current user
  getConversations: async () => {
    const response = await api.get("/chat/conversations");
    return response.data;
  },

  // Create or get a one-to-one conversation
  createConversation: async (userId) => {
    const response = await api.post("/chat/conversations", {
      user_id: userId,
    });

    return response.data;
  },

  // Get messages for a conversation
  getMessages: async (conversationId) => {
    const response = await api.get(
      `/chat/conversations/${conversationId}/messages`
    );

    return response.data;
  },

  // Send message using REST
  sendMessage: async (conversationId, message) => {
    const response = await api.post(
      `/chat/conversations/${conversationId}/messages`,
      {
        message,
      }
    );

    return response.data;
  },

  // Edit message
  updateMessage: async (messageId, message) => {
    const response = await api.put(
      `/chat/messages/${messageId}`,
      {
        message,
      }
    );

    return response.data;
  },

  // Delete message
  deleteMessage: async (messageId) => {
    const response = await api.delete(
      `/chat/messages/${messageId}`
    );

    return response.data;
  },

  // Mark message as read
  markMessageAsRead: async (messageId) => {
    const response = await api.post(
      `/chat/messages/${messageId}/read`
    );

    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await api.get(
      "/chat/unread-count"
    );

    return response.data;
  },
};

export default chatService;