import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getDropdownUsers,
  otpVerifyAuth,
  resendOTPAuth,
  roleAuth,
  signInAuth,
  signUpAuth,
  updateRoleAuth,
  attemptRemaining
} from "../../Apis/auth";

export const fetchRole = createAsyncThunk(
  "auth/role",
  async (params, { rejectWithValue }) => {
    try {
      const response = await roleAuth();
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchSignUp = createAsyncThunk(
  "auth/signUp",
  async (params, { rejectWithValue }) => {
    try {
      const response = await signUpAuth(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchSignIn = createAsyncThunk(
  "auth/signIn",
  async (params, { rejectWithValue }) => {
    try {
      const response = await signInAuth(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchOTP = createAsyncThunk(
  "auth/fetchOTP",
  async (params, { rejectWithValue }) => {
    try {
      const response = await otpVerifyAuth(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchResendOTP = createAsyncThunk(
  "auth/fetchResendOTP",
  async (params, { rejectWithValue }) => {
    try {
      const response = await resendOTPAuth(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchUpdateRoleAuth = createAsyncThunk(
  "auth/fetchUpdateRoleAuth",
  async (params, { rejectWithValue }) => {
    try {
      const response = await updateRoleAuth(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchDropdownUsers = createAsyncThunk(
  "dropdownUsers/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getDropdownUsers(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);


export const fetchAttemptCount = createAsyncThunk(
  "auth/alttemptcount",
  async (data, { rejectWithValue }) => {
    try {
      const response = await attemptRemaining(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);