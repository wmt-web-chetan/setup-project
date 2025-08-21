import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getLoanCategories,
  createOrUpdateLoanCategory,
  deleteLoanCategory,
} from "../../Apis/loancategory";

// Thunk action for fetching loan categories
export const fetchLoanCategories = createAsyncThunk(
  "loanCategories/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getLoanCategories(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for creating a loan category
export const addLoanCategory = createAsyncThunk(
  "loanCategories/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createOrUpdateLoanCategory(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for updating a loan category
export const updateLoanCategoryAction = createAsyncThunk(
  "loanCategories/update",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createOrUpdateLoanCategory(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for deleting a loan category
export const removeLoanCategory = createAsyncThunk(
  "loanCategories/delete",
  async (id, { rejectWithValue }) => {
    try {
      const response = await deleteLoanCategory(id);
      return { ...response, id }; // Including id in response for state update
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);