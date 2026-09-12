import api from "./api";

const notificationService = {
  getMyNotifications: async (unreadOnly = false) => {
    const response = await api.get("/notifications/my", {
      params: {
        unread_only: unreadOnly,
      },
    });

    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get(
      "/notifications/my/unread-count"
    );

    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await api.post(
      `/notifications/${notificationId}/read`
    );

    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.post(
      "/notifications/my/read-all"
    );

    return response.data;
  },

  createNotification: async (data) => {
    const response = await api.post(
      "/notifications",
      data
    );

    return response.data;
  },
};

export default notificationService;