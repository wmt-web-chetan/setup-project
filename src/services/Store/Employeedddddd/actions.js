import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  registerAdmin,
  getAllAdmins,
  getAdminById,
  deleteAdmin,
  updateAdmin,
  updateAdminProfilePicture,
} from "../../Api/employee";

// Thunk action for registering a new admin
export const createAdminUser = createAsyncThunk(
  "adminUsers/register",
  async (data, { rejectWithValue }) => {
    try {
      const response = await registerAdmin(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Thunk action for getting all admins
export const fetchAdminUsers = createAsyncThunk(
  "adminUsers/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getAllAdmins(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Thunk action for getting admin by ID
export const fetchAdminById = createAsyncThunk(
  "adminUsers/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getAdminById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Thunk action for updating admin
export const updateAdminUser = createAsyncThunk(
  "adminUsers/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await updateAdmin(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Thunk action for deleting an admin
export const removeAdminUser = createAsyncThunk(
  "adminUsers/delete",
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const response = await deleteAdmin(id, { reason });
      return { ...response, id };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Thunk action for updating admin profile picture
export const updateAdminProfilePictureAction = createAsyncThunk(
  "adminUsers/updateProfilePicture",
  async ({id, data}, { rejectWithValue }) => {
    try {
      const response = await updateAdminProfilePicture(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);