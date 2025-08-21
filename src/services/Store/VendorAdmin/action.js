import { createAsyncThunk } from "@reduxjs/toolkit";
import { createVendor, createVendorStoreCategory, createVendorSuggestion, favoriteVendor, getVendorById, getVendorDetailById, getVendorRatingList, getVendors, getVendorsList, getVendorStoreCategories, getVendorStoreCategoryById, getVendorSuggestions, rateVendor, unfavoriteVendor, updateVendor, updateVendorStoreCategory } from "../../Apis/vendorAdmin";


// Thunk action for getting vendor store categories
export const fetchVendorStoreCategories = createAsyncThunk(
  "vendorStoreCategories/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getVendorStoreCategories(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for creating vendor store category
export const addVendorStoreCategory = createAsyncThunk(
  "vendorStoreCategories/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createVendorStoreCategory(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for updating vendor store category
export const updateVendorStoreCategoryAction = createAsyncThunk(
  "vendorStoreCategories/update",
  async (data, { rejectWithValue }) => {
    try {
      const response = await updateVendorStoreCategory(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const fetchVendorsList = createAsyncThunk(
  "vendors/fetchList",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getVendorsList(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Thunk action for creating vendor
export const addVendor = createAsyncThunk(
  "vendors/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createVendor(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateVendorAction = createAsyncThunk(
  "vendors/update",
  async (data, { rejectWithValue }) => {
    try {
      const response = await updateVendor(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchVendorById = createAsyncThunk(
  "vendors/fetchById",
  async (vendorId, { rejectWithValue }) => {
    try {
      const response = await getVendorById(vendorId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchVendors = createAsyncThunk(
  "vendors/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getVendors(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const fetchVendorDetailById = createAsyncThunk(
  "vendors/fetchByDetailId",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getVendorDetailById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const rateVendorAction = createAsyncThunk(
  "vendors/rate",
  async (data, { rejectWithValue }) => {
    try {
      const response = await rateVendor(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const favoriteVendorAction = createAsyncThunk(
  "vendors/favorite",
  async (data, { rejectWithValue }) => {
    try {
      const response = await favoriteVendor(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const unfavoriteVendorAction = createAsyncThunk(
  "vendors/unfavorite",
  async (data, { rejectWithValue }) => {
    try {
      const response = await unfavoriteVendor(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const addVendorSuggestion = createAsyncThunk(
  "vendorSuggestions/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createVendorSuggestion(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const fetchVendorSuggestions = createAsyncThunk(
  "vendorSuggestions/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getVendorSuggestions(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const fetchVendorRatingList = createAsyncThunk(
  "vendorRatings/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getVendorRatingList(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchVendorStoreCategoryById = createAsyncThunk(
  "vendorStoreCategory/fetchById",
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await getVendorStoreCategoryById(categoryId);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);