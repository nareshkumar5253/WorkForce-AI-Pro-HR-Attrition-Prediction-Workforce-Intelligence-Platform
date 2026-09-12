import api from "./api";

const recommendationService = {
  generateRecommendations: async (employeeId) => {
    const response = await api.post(
      `/recommendations/generate/${employeeId}`
    );

    return response.data;
  },

  createRecommendation: async (data) => {
    const response = await api.post(
      "/recommendations",
      data
    );

    return response.data;
  },

  getRecommendations: async (params = {}) => {
    const response = await api.get(
      "/recommendations",
      {
        params,
      }
    );

    return response.data;
  },

  getMyRecommendations: async () => {
    const response = await api.get(
      "/recommendations/my"
    );

    return response.data;
  },

  getEmployeeRecommendations: async (
    employeeId
  ) => {
    const response = await api.get(
      `/recommendations/employee/${employeeId}`
    );

    return response.data;
  },

  getSummary: async () => {
    const response = await api.get(
      "/recommendations/summary"
    );

    return response.data;
  },

  getRecommendation: async (
    recommendationId
  ) => {
    const response = await api.get(
      `/recommendations/${recommendationId}`
    );

    return response.data;
  },

  updateRecommendation: async (
    recommendationId,
    data
  ) => {
    const response = await api.put(
      `/recommendations/${recommendationId}`,
      data
    );

    return response.data;
  },
};

export default recommendationService;