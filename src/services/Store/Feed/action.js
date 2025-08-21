import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  createComment,
  createFeed,
  createFeedComment,
  deleteFeed,
  getAllFeeds,
  getFeedById,
  publishExistingFeed,
  scheduleExistingFeed,
  toggleFeedLike,
  toggleFeedLikeComment,
  toggleFeedPin,
  updateFeed,
} from "../../Apis/feed";

// Thunk action for getting all feeds
export const fetchAllFeeds = createAsyncThunk(
  "feeds/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getAllFeeds(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for creating a feed
export const addFeed = createAsyncThunk(
  "feeds/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createFeed(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for creating a feed comment
export const feedCommentList = createAsyncThunk(
  "feedComments/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createFeedComment(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for creating a comment
export const addComment = createAsyncThunk(
  "comments/create",
  async (commentData, { rejectWithValue }) => {
    try {
      const response = await createComment(commentData);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for publishing an existing feed
export const publishExistingFeedAction = createAsyncThunk(
  "feeds/publishExisting",
  async (data, { rejectWithValue }) => {
    try {
      const response = await publishExistingFeed(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for scheduling an existing feed
export const scheduleExistingFeedAction = createAsyncThunk(
  "feeds/scheduleExisting",
  async (data, { rejectWithValue }) => {
    try {
      const response = await scheduleExistingFeed(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for deleting a feed
export const deleteFeedAction = createAsyncThunk(
  "feeds/delete",
  async (id, { rejectWithValue }) => {
    try {
      const response = await deleteFeed(id);
      return { ...response, id }; // Including id in response for state update
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for toggling like on a feed
export const toggleFeedLikeAction = createAsyncThunk(
  "feed/toggleLike",
  async (data, { rejectWithValue }) => {
    try {
      const response = await toggleFeedLike(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for toggling like on a feed
export const toggleFeedLikeCommentAction = createAsyncThunk(
  "feed/toggleLikeComment",
  async (data, { rejectWithValue }) => {
    try {
      const response = await toggleFeedLikeComment(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for toggling pin on a feed
export const toggleFeedPinAction = createAsyncThunk(
  "feed/togglePin",
  async (data, { rejectWithValue }) => {
    try {
      const response = await toggleFeedPin(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const updateFeedAction = createAsyncThunk(
  "feed/update",
  async (data, { rejectWithValue }) => {
    try {
      const response = await updateFeed(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);


export const fetchFeedById = createAsyncThunk(
  "feed/fetchById",
  async (feedId, { rejectWithValue }) => {
    try {
      const response = await getFeedById(feedId);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);
