import { createAsyncThunk } from "@reduxjs/toolkit";
import { createReferral, getReferrals } from "../../Apis/refer";


// Thunk action for creating a referral
export const addReferral = createAsyncThunk(
  "referrals/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createReferral(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Thunk action for getting referrals
export const fetchReferrals = createAsyncThunk(
    "referrals/fetch",
    async (params, { rejectWithValue }) => {
      try {
        const response = await getReferrals(params);
        return response;
      } catch (error) {
        return rejectWithValue(error?.response?.data);
      }
    }
  );