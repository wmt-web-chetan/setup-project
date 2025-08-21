import { createAsyncThunk } from "@reduxjs/toolkit";
import { createRecommendationGPT, deleteChatConversationGPT, getChatHistoryGPT, getConversationsGPT, renameConversationGPT } from "../../Apis/gptAPI";

// Thunk action for fetching chat history
export const fetchChatHistoryGPT = createAsyncThunk(
  "chat/fetchHistoryGPT",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getChatHistoryGPT(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data || error);
    }
  }
);

// Thunk action for creating a recommendation
export const createRecommendationActionGPT = createAsyncThunk(
  "recommendations/createGPT",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createRecommendationGPT(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for fetching chat conversations
export const fetchChatConversationsGPT = createAsyncThunk(
  "chat/fetchConversationsGPT",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getConversationsGPT(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for deleting a chat conversation
export const removeChatConversationGPT = createAsyncThunk(
  "chatConversations/deleteGPT",
  async (params, { rejectWithValue }) => {
    try {
      const response = await deleteChatConversationGPT(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for renaming a conversation
export const renameConversationActionGPT = createAsyncThunk(
  "chat/renameConversationGPT",
  async (data, { rejectWithValue }) => {
    try {
      const response = await renameConversationGPT(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);
