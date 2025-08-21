import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getPasswordsList,
  createPassword,
  updatePassword,
  deletePassword,
  getPasswordForEdit,
} from "../../Apis/passwordManagement";

// Thunk action for getting passwords list
export const fetchPasswordsList = createAsyncThunk(
  "passwords/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getPasswordsList(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for creating a password
export const addPassword = createAsyncThunk(
  "passwords/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createPassword(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for updating a password
export const updatePasswordAction = createAsyncThunk(
  "passwords/update",
  async (data, { rejectWithValue }) => {
    try {
      const response = await updatePassword(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for deleting a password
export const removePassword = createAsyncThunk(
  "passwords/delete",
  async (id, { rejectWithValue }) => {
    try {
      const response = await deletePassword(id);
      return { ...response, id }; // Including id in response for state update
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const fetchPasswordForEdit = createAsyncThunk(
  "passwords/fetchForEdit",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getPasswordForEdit(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);