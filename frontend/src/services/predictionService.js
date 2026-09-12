import api from "./api";

const predictionService = {
  // Train the attrition model
  trainModel: async (datasetId) => {
    const response = await api.post(
      `/predictions/train/${datasetId}`
    );

    return response.data;
  },

  // Predict employee attrition
  predictAttrition: async (data) => {
    const response = await api.post(
      "/predictions/predict",
      data
    );

    return response.data;
  },

  // Get all prediction history
  getPredictions: async () => {
    const response = await api.get(
      "/predictions"
    );

    return response.data;
  },

  // Get one prediction
  getPrediction: async (predictionId) => {
    const response = await api.get(
      `/predictions/${predictionId}`
    );

    return response.data;
  },
};

export default predictionService;