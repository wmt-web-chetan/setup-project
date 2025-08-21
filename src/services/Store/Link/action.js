import { createAsyncThunk } from "@reduxjs/toolkit";
import { createLink, deleteLink, getLinks, updateLink } from "../../Apis/link";

// Thunk action for getting links
export const fetchLinks = createAsyncThunk(
  "links/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getLinks(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for creating a link
export const addLink = createAsyncThunk(
  "links/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createLink(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Thunk action for updating a link
export const updateLinkAction = createAsyncThunk(
  "links/update",
  async (data, { rejectWithValue }) => {
    try {
      const response = await updateLink(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Thunk action for deleting a link
export const removeLink = createAsyncThunk(
  "links/delete",
  async (id, { rejectWithValue }) => {
    try {
      const response = await deleteLink(id);
      return { ...response, id }; // Including id in response for state update
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);
