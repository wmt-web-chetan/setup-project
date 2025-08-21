import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  createSubscription,
  getCancleSubscription,
  getCurrentSubscriptionDetails,
  getInvoiceHistory,
  getSubscriptionsList,
  getUpdateCard,
  submitThreeDSecureSuccess,
} from "../../Apis/subscription";

// Thunk action for getting subscription list
export const fetchSubscriptionsList = createAsyncThunk(
  "subscriptions/fetchList",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getSubscriptionsList(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const addSubscription = createAsyncThunk(
  "subscriptions/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createSubscription(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const fetchCurrentSubscriptionDetails = createAsyncThunk(
  "subscription/fetchCurrentSubscriptionDetails",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getCurrentSubscriptionDetails();
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Thunk action for getting invoice history
export const fetchInvoiceHistory = createAsyncThunk(
  "subscription/fetchInvoiceHistory",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getInvoiceHistory();
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Thunk action for getting update card
export const fetchUpdateCard = createAsyncThunk(
  "subscription/fetchUpdateCard",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getUpdateCard();
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Thunk action for getting cancle subscription
export const fetchCancleSubscription = createAsyncThunk(
  "subscription/fetchCancleSubscription",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getCancleSubscription();
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const processThreeDSecureSuccess = createAsyncThunk(
  "threeDSecure/success",
  async (data, { rejectWithValue }) => {
    try {
      const response = await submitThreeDSecureSuccess(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);