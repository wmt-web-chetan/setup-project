import { createSlice } from "@reduxjs/toolkit";

import { notification } from "antd";
import { addReferral, fetchReferrals } from "./action";

const initialState = {
  createReferral: {},
  createReferralLoading: false,
  createReferralError: null,

  referrals: [],
  referralsLoading: false,
  referralsError: null,
};

const referralsSlice = createSlice({
  name: "referrals",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Create referral cases
      .addCase(addReferral.pending, (state) => {
        state.createReferralLoading = true;
        state.createReferralError = null;
      })
      .addCase(addReferral.fulfilled, (state, action) => {
        state.createReferral = action.payload;
        state.createReferralLoading = false;
      })
      .addCase(addReferral.rejected, (state, action) => {
        state.createReferralLoading = false;
        state.createReferralError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to create referral",
          duration: 2,
        });
      });

    builder
      // Fetch referrals cases
      .addCase(fetchReferrals.pending, (state) => {
        state.referralsLoading = true;
        state.referralsError = null;
      })
      .addCase(fetchReferrals.fulfilled, (state, action) => {
        state.referralsLoading = false;
        state.referrals = action.payload;
      
      })
      .addCase(fetchReferrals.rejected, (state, action) => {
        state.referralsLoading = false;
        state.referralsError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch referrals",
          duration: 2,
        });
      });
  },
});

export default referralsSlice.reducer;
