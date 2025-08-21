import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getFriendFolders,
  createFriendFolder,
  updateFriendFolder,
  deleteFriendFolder,
  getDeletedFriendFolders,
  restoreFriendFolder,
  getNestedFolders,
  createNestedFolder,
  updateNestedFolder,
  deleteNestedFolder,
  getDeletedNestedFolders,
  restoreNestedFolder,
  getFriendFolderFiles,
  uploadFriendFolderFile,
  deleteFriendFolderFile,
  deletedFiles,
  restoreDeletedFiles
} from "../../Apis/documentRepository";

// =================== FRIEND FOLDERS ACTIONS ===================

// Thunk action for getting friend folders
export const fetchFriendFolders = createAsyncThunk(
  "friendFolders/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getFriendFolders(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for creating a friend folder
export const addFriendFolder = createAsyncThunk(
  "friendFolders/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createFriendFolder(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for updating a friend folder
export const updateFriendFolderAction = createAsyncThunk(
  "friendFolders/update",
  async (data, { rejectWithValue }) => {
    try {
      const response = await updateFriendFolder(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for deleting a friend folder
export const removeFriendFolder = createAsyncThunk(
  "friendFolders/delete",
  async (id, { rejectWithValue }) => {
    try {
      const response = await deleteFriendFolder(id);
      return { ...response, id }; // Including id in response for state update
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for getting deleted friend folders
export const fetchDeletedFriendFolders = createAsyncThunk(
  "friendFolders/fetchDeleted",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getDeletedFriendFolders(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const fetchDeletedFriendFiles = createAsyncThunk(
  "friendFolders/fetchDeletedFile",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getDeletedFriendFiles(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for restoring a friend folder
export const restoreFriendFolderAction = createAsyncThunk(
  "friendFolders/restore",
  async (id, { rejectWithValue }) => {
    try {
      const response = await restoreFriendFolder(id);
      return { ...response, id }; // Including id in response for state update
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// =================== NESTED FOLDERS ACTIONS ===================

// Thunk action for getting nested folders
export const fetchNestedFolders = createAsyncThunk(
  "nestedFolders/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getNestedFolders(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for creating a nested folder
export const addNestedFolder = createAsyncThunk(
  "nestedFolders/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createNestedFolder(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for updating a nested folder
export const updateNestedFolderAction = createAsyncThunk(
  "nestedFolders/update",
  async (data, { rejectWithValue }) => {
    try {
      const response = await updateNestedFolder(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for deleting a nested folder
export const removeNestedFolder = createAsyncThunk(
  "nestedFolders/delete",
  async (id, { rejectWithValue }) => {
    try {
      const response = await deleteNestedFolder(id);
      return { ...response, id }; // Including id in response for state update
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for getting deleted nested folders
export const fetchDeletedNestedFolders = createAsyncThunk(
  "nestedFolders/fetchDeleted",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getDeletedNestedFolders(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for restoring a nested folder
export const restoreNestedFolderAction = createAsyncThunk(
  "nestedFolders/restore",
  async (id, { rejectWithValue }) => {
    try {
      const response = await restoreNestedFolder(id);
      return { ...response, id }; // Including id in response for state update
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// =================== FILE OPERATIONS ACTIONS ===================

// Thunk action for getting files in a friend folder
export const fetchFriendFolderFiles = createAsyncThunk(
  "friendFolders/fetchFiles",
  async ({ folderId, params }, { rejectWithValue }) => {
    try {
      const response = await getFriendFolderFiles(folderId, params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for uploading file to friend folder
export const uploadFileToFriendFolder = createAsyncThunk(
  "friendFolders/uploadFile",
  async (data, { rejectWithValue }) => {
    try {
      const response = await uploadFriendFolderFile(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for deleting file from friend folder
export const deleteFriendFolderFileAction = createAsyncThunk(
  "friendFolders/deleteFile",
  async (fileId, { rejectWithValue }) => {
    try {
      const response = await deleteFriendFolderFile(fileId);
      return { ...response, fileId }; // Including fileId in response for state update
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);




// Thunk action for getting deleted files
export const fetchDeletedFiles = createAsyncThunk(
  "files/fetchDeleted",
  async (params, { rejectWithValue }) => {
    try {
      const response = await deletedFiles(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for restoring a nested folder
export const restoreDeletedFilesAction = createAsyncThunk(
  "files/restore",
  async (id, { rejectWithValue }) => {
    try {
      const response = await restoreDeletedFiles(id);
      return { ...response, id }; // Including id in response for state update
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);