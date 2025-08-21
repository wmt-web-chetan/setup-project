import { del, get, post } from "../../utils/apiWrapper";

// Get API for fetching MCQ videos
export const getMcqVideos = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/mcq/videos`, config);
};

// Get API for fetching MCQ details by ID
export const getMcqById = async (id) => {
  return await get(`/mcq/${id}`);
};

// Create MCQ
export const createMcq = async (mcqData) => {
  const config = {
    data: mcqData,
  };
  return await post(`/mcq/create`, config);
};

// Update MCQ
export const updateMcq = async (mcqData) => {
  const config = {
    data: mcqData,
  };
  return await post(`/mcq/update`, config);
};
// Post API for tracking MCQ views
export const trackMcqViews = async (viewData) => {
  const config = {
    data: viewData,
  };
  return await post(`/mcq/track-views`, config);
};

// Get API for fetching MCQ details by ID
export const deleteMcqById = async (id) => {
  return await del(`/mcq/delete/${id}`);
};