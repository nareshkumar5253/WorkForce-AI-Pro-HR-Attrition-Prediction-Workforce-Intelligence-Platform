import api from "./api";

const performanceService = {
  // Get all performance reviews
  getReviews: async (params = {}) => {
    const response = await api.get(
      "/performance",
      {
        params,
      }
    );

    return response.data;
  },

  // Get current user's reviews
  getMyReviews: async () => {
    const response = await api.get(
      "/performance/my"
    );

    return response.data;
  },

  // Get employee reviews
  getEmployeeReviews: async (employeeId) => {
    const response = await api.get(
      `/performance/employee/${employeeId}`
    );

    return response.data;
  },

  // Get performance summary
  getSummary: async () => {
    const response = await api.get(
      "/performance/analytics/summary"
    );

    return response.data;
  },

  // Get rating distribution
  getRatingDistribution: async () => {
    const response = await api.get(
      "/performance/analytics/rating-distribution"
    );

    return response.data;
  },

  // Get status distribution
  getStatusDistribution: async () => {
    const response = await api.get(
      "/performance/analytics/status-distribution"
    );

    return response.data;
  },

  // Get department performance
  getDepartmentAnalytics: async () => {
    const response = await api.get(
      "/performance/analytics/department"
    );

    return response.data;
  },

  // Get employee analytics
  getEmployeeAnalytics: async (employeeId) => {
    const response = await api.get(
      `/performance/analytics/employee/${employeeId}`
    );

    return response.data;
  },

  // Get one review
  getReview: async (reviewId) => {
    const response = await api.get(
      `/performance/${reviewId}`
    );

    return response.data;
  },

  // Create review
  createReview: async (data) => {
    const response = await api.post(
      "/performance",
      data
    );

    return response.data;
  },

  // Update review
  updateReview: async (reviewId, data) => {
    const response = await api.put(
      `/performance/${reviewId}`,
      data
    );

    return response.data;
  },

  // Delete review
  deleteReview: async (reviewId) => {
    const response = await api.delete(
      `/performance/${reviewId}`
    );

    return response.data;
  },
};

export default performanceService;