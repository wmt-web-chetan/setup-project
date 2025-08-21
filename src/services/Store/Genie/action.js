import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  createRecommendation,
  deleteChatConversation,
  getChatHistory,
  getConversations,
  renameConversation,
} from "../../Apis/genie";

// Thunk action for fetching chat history
export const fetchChatHistory = createAsyncThunk(
  "chat/fetchHistory",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getChatHistory(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data || error);
    }
  }
);

// Thunk action for creating a recommendation
export const createRecommendationAction = createAsyncThunk(
  "recommendations/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createRecommendation(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for fetching chat conversations
export const fetchChatConversations = createAsyncThunk(
  "chat/fetchConversations",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getConversations(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for deleting a chat conversation
export const removeChatConversation = createAsyncThunk(
  "chatConversations/delete",
  async (params, { rejectWithValue }) => {
    try {
      const response = await deleteChatConversation(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for renaming a conversation
export const renameConversationAction = createAsyncThunk(
  "chat/renameConversation",
  async (data, { rejectWithValue }) => {
    try {
      const response = await renameConversation(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);
