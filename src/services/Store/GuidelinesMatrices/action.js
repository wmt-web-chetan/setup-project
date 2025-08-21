import { createAsyncThunk } from "@reduxjs/toolkit";
import { createLoanCategoryFolder, deleteLoanCategoryFile, deleteLoanCategoryFolder, getDeleteFileList, getLoanCategoryFolderDetails, getLoanCategoryFolders, restoreFile, restoreFolder, updateLoanCategoryFolder, uploadLoanCategoryFile } from "../../Apis/guidelinesandmatrices";

// Thunk action for getting loan category folders
export const fetchLoanCategoryFolders = createAsyncThunk(
  "loanCategories/fetchFolders",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getLoanCategoryFolders(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for creating a loan category folder
export const addLoanCategoryFolder = createAsyncThunk(
  "loanCategories/createFolder",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createLoanCategoryFolder(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for updating a loan category folder
export const updateLoanCategoryFolderAction = createAsyncThunk(
  "loanCategories/updateFolder",
  async (data, { rejectWithValue }) => {
    try {
      const response = await updateLoanCategoryFolder(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);
// Thunk action for deleting a loan category folder
export const deleteLoanCategoryFolderAction = createAsyncThunk(
  "loanCategories/deleteFolder",
  async (id, { rejectWithValue }) => {
    try {
      const response = await deleteLoanCategoryFolder(id);
      return { ...response, id }; // Include id in response for state update
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for getting loan category folder details with files
export const fetchLoanCategoryFolderDetails = createAsyncThunk(
  "loanCategories/fetchFolderDetails",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getLoanCategoryFolderDetails(id);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Action to delete a loan category folder file
export const deleteLoanCategoryFileAction = createAsyncThunk(
  "loanCategories/deleteFile",
  async (fileId, { rejectWithValue }) => {
    try {
      const response = await deleteLoanCategoryFile(fileId);
      return { ...response, fileId }; // Include fileId in response for state update
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for uploading file to loan category folder
export const uploadLoanCategoryFileAction = createAsyncThunk(
  "loanCategoryFolder/uploadFile",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await uploadLoanCategoryFile(formData);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for getting delete file list
export const fetchDeleteFileList = createAsyncThunk(
  "files/fetchDeleteList",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getDeleteFileList(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const restoreFolderAction = createAsyncThunk(
  "folders/restore",
  async (folderId, { rejectWithValue }) => {
    try {
      const response = await restoreFolder(folderId);
      return { ...response, id: folderId }; // Including id in response for state update
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const restoreFileAction = createAsyncThunk(
  "files/restore",
  async (fileId, { rejectWithValue }) => {
    try {
      const response = await restoreFile(fileId);
      return { ...response, id: fileId }; // Including id in response for state update
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);