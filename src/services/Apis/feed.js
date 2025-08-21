import { del, get, post } from "../../utils/apiWrapper";

// Get all feeds
export const getAllFeeds = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/feed/all`, config);
};

// Create a new feed
export const createFeed = async (feedData) => {
  const config = {
    data: feedData,
  };
  return await post(`/feed/create`, config);
};

// Post comment to feed
export const createFeedComment = async (data) => {
  const config = {
    data:data?.data,
    params: data?.params,
  };
  return await post(`/feed/comments`, config);
};

// Post API for creating a comment
export const createComment = async (commentData) => {
  const config = {
    data: commentData,
  };
  return await post(`/feed/comment`, config);
};

// Publish existing feed
export const publishExistingFeed = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/feed/publish-existing`, config);
};

// Schedule existing feed
export const scheduleExistingFeed = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/feed/schedule-existing`, config);
};

// Delete feed
export const deleteFeed = async (id) => {
  return await del(`/feed/delete/${id}`);
};

// Toggle like on a feed
export const toggleFeedLike = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/feed/toggle-like`, config);
};

// Toggle like on a feed
export const toggleFeedLikeComment = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/feed/comment/toggle-like`, config);
};

// Toggle pin on a feed
export const toggleFeedPin = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/feed/toggle-pin`, config);
};

export const updateFeed = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/feed/update`, config);
};

export const getFeedById = async (feedId) => {
  return await get(`/feed/${feedId}`);
};
