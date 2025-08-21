import { createSlice } from "@reduxjs/toolkit";
import { notification } from "antd";
import {
  fetchUserOnboardingStep5,
  submitOnboardingStep2Action,
} from "./action";

const initialState = {
  onboardingStep2Data: {},
  onboardingStep2Loading: false,
  onboardingStep2Error: null,

  onboardingStep5Data: {},
  onboardingStep5Loading: false,
  onboardingStep5Error: null,
};

const onboardingSlice = createSlice({
  name: "onboarding",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Submit onboarding step 2 cases
      .addCase(submitOnboardingStep2Action.pending, (state) => {
        state.onboardingStep2Loading = true;
        state.onboardingStep2Error = null;
      })
      .addCase(submitOnboardingStep2Action.fulfilled, (state, action) => {
        state.onboardingStep2Loading = false;
        state.onboardingStep2Data = action.payload;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message || "Step 2 completed successfully",
            duration: 2,
          });
        }
      })
      .addCase(submitOnboardingStep2Action.rejected, (state, action) => {
        state.onboardingStep2Loading = false;
        state.onboardingStep2Error = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to complete step 2",
          duration: 2,
        });
      });

    builder
      // Fetch user onboarding step 5 data cases
      .addCase(fetchUserOnboardingStep5.pending, (state) => {
        state.onboardingStep5Loading = true;
        state.onboardingStep5Error = null;
      })
      .addCase(fetchUserOnboardingStep5.fulfilled, (state, action) => {
        state.onboardingStep5Loading = false;
        state.onboardingStep5Data = action.payload;

      })
      .addCase(fetchUserOnboardingStep5.rejected, (state, action) => {
        state.onboardingStep5Loading = false;
        state.onboardingStep5Error = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message ||
            "Failed to fetch onboarding step 5 data",
          duration: 2,
        });
      });
  },
});

export default onboardingSlice.reducer;
