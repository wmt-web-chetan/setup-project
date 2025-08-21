import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  createUser,
  getUserDetailById,
  getUserForEdit,
  getUsersList,
  updateUser,
  updateProfile,
  changePhoneNumber,
  getRoleUserList,
  getNotificationsList,
  markAllNotificationsAsRead,
  toggleNotificationMute
} from "../../Apis/users";

// Thunk action for getting user for edit
export const fetchUserForEdit = createAsyncThunk(
  "userEdit/fetch",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await getUserForEdit(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for getting user for edit
export const fetchUserDetailById = createAsyncThunk(
  "userDetailById/fetch",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await getUserDetailById(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for getting users list
export const fetchUsersList = createAsyncThunk(
  "usersList/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getUsersList(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for creating a user
export const createUserAction = createAsyncThunk(
  "usersList/create",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await createUser(userData);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for updating a user
export const updateUserAction = createAsyncThunk(
  "usersList/update",
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      const response = await updateUser(userId, userData);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const updateProfileAction = createAsyncThunk(
  "usersList/updateProfile",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await updateProfile(userData);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const changePhoneNumberAction = createAsyncThunk(
  "users/changePhoneNumber",
  async (data, { rejectWithValue }) => {
    try {
      const response = await changePhoneNumber(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const fetchRoleUserList = createAsyncThunk(
  "roleUser/fetchList",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getRoleUserList(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Thunk action for getting notifications list
export const fetchNotificationsList = createAsyncThunk(
  "notifications/fetchList",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getNotificationsList(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for marking all notifications as read
export const markAllNotificationsAsReadAction = createAsyncThunk(
  "notifications/markAllAsRead",
  async (data, { rejectWithValue }) => {
    try {
      const response = await markAllNotificationsAsRead(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const toggleNotificationMuteAction = createAsyncThunk(
  "notifications/toggleMute",
  async (data, { rejectWithValue }) => {
    try {
      const response = await toggleNotificationMute(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);