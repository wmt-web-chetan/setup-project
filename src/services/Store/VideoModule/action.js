import { createAsyncThunk } from "@reduxjs/toolkit";
import { createVimeoVideo, deleteVimeoVideo, endVimeoEvent, getVimeoVideos, storeVimeoEvent, updateVimeoVideo } from "../../Apis/videomodule";

// Thunk action for getting Vimeo videos
export const fetchVimeoVideos = createAsyncThunk(
  "vimeoVideos/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getVimeoVideos(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for storing Vimeo event
export const storeVimeoEventAction = createAsyncThunk(
  "vimeo/storeEvent",
  async (data, { rejectWithValue }) => {
    try {
      const response = await storeVimeoEvent(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for ending Vimeo event
export const endVimeoEventAction = createAsyncThunk(
  "vimeo/endEvent",
  async (data, { rejectWithValue }) => {
    try {
      const response = await endVimeoEvent(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const addVimeoVideo = createAsyncThunk(
  "vimeo/addvideo",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createVimeoVideo(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const EditVimeoVideo = createAsyncThunk(
  "vimeo/editvideo",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await updateVimeoVideo(data, id); // Pass the video ID and data
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);


export const RemoveVimeoVideo = createAsyncThunk(
  "vimeo/delvideo",
  async (id, { rejectWithValue }) => {
    try {
      const response = await deleteVimeoVideo(id);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);