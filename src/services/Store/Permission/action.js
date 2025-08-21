import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  createRole,
  getAllRoles,
  getAllRolesList,
  getPermissions,
  getRoleById,
  updateRole,
} from "../../Apis/permission";

// Thunk action for fetching permissions
export const fetchPermissions = createAsyncThunk(
  "permissions/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getPermissions(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for creating a role
export const addRoleAction = createAsyncThunk(
  "roles/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createRole(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for getting roles
export const fetchRolesList = createAsyncThunk(
  "rolesList/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getAllRoles(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for fetching a role by ID
export const fetchRoleDetails = createAsyncThunk(
  "roleDetails/fetch",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getRoleById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for getting all roles (without pagination)
export const fetchAllRolesList = createAsyncThunk(
  "allRoles/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAllRolesList();
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for updating a role
export const updateRoleData = createAsyncThunk(
  "roleData/update",
  async (data, { rejectWithValue }) => {
    try {
      const response = await updateRole(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);