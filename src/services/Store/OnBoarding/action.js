import { createAsyncThunk } from "@reduxjs/toolkit";
import { getUserOnboardingStep5, submitOnboardingStep2 } from "../../Apis/onBoarding";

// Thunk action for submitting onboarding step 2
export const submitOnboardingStep2Action = createAsyncThunk(
  "onboarding/submitStep2",
  async (data, { rejectWithValue }) => {
    try {
      const response = await submitOnboardingStep2(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for getting user onboarding step 5 data
export const fetchUserOnboardingStep5 = createAsyncThunk(
  "userOnboarding/fetchStep5",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getUserOnboardingStep5(id);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);