import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  createStateLicense,
  deleteStateLicense,
  getStateLicenses,
  updateStateLicenseStatus,
} from "../../Apis/stateLicense";

// Thunk action for getting state licenses
export const fetchStateLicenses = createAsyncThunk(
  "stateLicenses/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getStateLicenses(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for creating state license
export const addStateLicense = createAsyncThunk(
  "stateLicenses/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createStateLicense(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const removeStateLicense = createAsyncThunk(
  "stateLicenses/delete",
  async (id, { rejectWithValue }) => {
    try {
      const response = await deleteStateLicense(id);
      return { ...response, id }; // Including id in response for state update
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for updating state license status
export const updateStateLicenseStatusAction = createAsyncThunk(
  "stateLicenses/updateStatus",
  async (data, { rejectWithValue }) => {
    try {
      const response = await updateStateLicenseStatus(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);