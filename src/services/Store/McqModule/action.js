import { createAsyncThunk } from "@reduxjs/toolkit";
import { createMcq, deleteMcqById, getMcqById, getMcqVideos, trackMcqViews, updateMcq } from "../../Apis/mcqmodule";

// Thunk action for getting MCQ videos
export const fetchMcqVideos = createAsyncThunk(
  "mcqVideos/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getMcqVideos(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const fetchMcqById = createAsyncThunk(
    "mcqDetail/fetch",
    async (id, { rejectWithValue }) => {
      try {
        const response = await getMcqById(id);
        return response;
      } catch (error) {
        return rejectWithValue(error?.response?.data);
      }
    }
  );

  export const addMcq = createAsyncThunk(
    "mcq/create",
    async (data, { rejectWithValue }) => {
      try {
        const response = await createMcq(data);
        return response;
      } catch (error) {
        return rejectWithValue(error?.response?.data);
      }
    }
  );  

  // Thunk action for updating an MCQ
export const updateMcqAction = createAsyncThunk(
  "mcq/update",
  async (data, { rejectWithValue }) => {
    try {
      const response = await updateMcq(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for tracking MCQ views
export const trackMcqViewsAction = createAsyncThunk(
  "mcqViewTracking/track",
  async (viewData, { rejectWithValue }) => {
    try {
      const response = await trackMcqViews(viewData);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const deleteMcqsById = createAsyncThunk(
  "mcqDelete/delete",
  async (id, { rejectWithValue }) => {
    try {
      const response = await deleteMcqById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);