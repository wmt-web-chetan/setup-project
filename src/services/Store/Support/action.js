import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  createArticle,
  createCategory,
  deleteArticle,
  deleteCategory,
  getArticleFileById,
  getCategories,
  getCategoriesDetails,
  getCategorySearchSuggestions,
  getVideoById,
  searchCategories,
  updateArticle,
  updateCategory,
} from "../../Apis/support";

// Thunk action for getting categories
export const fetchCategories = createAsyncThunk(
  "categories/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getCategories(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for creating category
export const addCategory = createAsyncThunk(
  "categories/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createCategory(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for updating category
export const updateCategoryAction = createAsyncThunk(
  "categories/update",
  async (data, { rejectWithValue }) => {
    try {
      const response = await updateCategory(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for deleting category
export const removeCategory = createAsyncThunk(
  "categories/delete",
  async (id, { rejectWithValue }) => {
    try {
      const response = await deleteCategory(id);
      return { ...response, id }; // Including id in response for state update
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for getting categories
export const fetchCategoriesDetails = createAsyncThunk(
  "categoriesDetails/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getCategoriesDetails(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for creating an article
export const addArticle = createAsyncThunk(
  "articles/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createArticle(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Thunk action for deleting an article
export const removeArticle = createAsyncThunk(
  "articles/delete",
  async (id, { rejectWithValue }) => {
    try {
      const response = await deleteArticle(id);
      return { ...response, id }; // Including id in response for state update
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Thunk action for getting article file by ID
export const fetchArticleFileById = createAsyncThunk(
  "articleFiles/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getArticleFileById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for getting article file by ID
export const fetchVideoById = createAsyncThunk(
  "video/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getVideoById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for updating an article
export const updateArticleAction = createAsyncThunk(
  "articles/update",
  async (data, { rejectWithValue }) => {
    try {
      const response = await updateArticle(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for getting category search suggestions
export const fetchCategorySearchSuggestions = createAsyncThunk(
  "categorySearch/fetchSuggestions",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getCategorySearchSuggestions(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const fetchCategorySearch = createAsyncThunk(
  "categorySearch/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await searchCategories(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);