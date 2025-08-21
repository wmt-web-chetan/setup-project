import { del, get, post } from "../../utils/apiWrapper";

// Get API for fetching Vimeo videos
export const getVimeoVideos = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/vimeo/videos`, config);
};

// Store Vimeo event
export const storeVimeoEvent = async (eventData) => {
  const config = {
    data: eventData,
    Headers: {
      "Content-Type": "application/json",
    },
  };
  return await post(`/vimeo/store-event`, config);
};

// End Vimeo event
export const endVimeoEvent = async (eventData) => {
  const config = {
    data: eventData,
    Headers: {
      "Content-Type": "application/json",
    },
  };
  return await post(`/vimeo/end-event`, config);
};

// Add vimeo event

export const createVimeoVideo = async (videoData) => {
  const config = {
    data: videoData,
    Headers: {
      "Content-Type": "application/json",
    },
  };
  return await post(`/vimeo/videos/upload-url`, config);
};

// Edit Vimeo video

export const updateVimeoVideo = async (videoData, id) => {
  const config = {
    data: videoData,
    Headers: {
      "Content-Type": "application/json",
    },
  };
  return await post(`/vimeo/videos/${id}`, config);
};
// Get API for fetching MCQ details by ID
export const deleteVimeoVideo = async (id) => {
  return await del(`/vimeo/videos/${id}`);
};
