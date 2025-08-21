import { createSlice } from "@reduxjs/toolkit";
import {
  fetchDropdownUsers,
  fetchOTP,
  fetchResendOTP,
  fetchRole,
  fetchSignIn,
  fetchSignUp,
  fetchUpdateRoleAuth,
  fetchAttemptCount
} from "./action";
import { notification } from "antd";

const initialState = {
  // Roles states
  roleData: {},
  roleLoading: false,
  roleError: null,

  // Signup states
  signupData: {},
  signupLoading: false,
  signupError: null,

  // Signup states
  signinData: {},
  signinLoading: false,
  signinError: null,

  // Verify OTP states
  otpData: {},
  otpLoading: false,
  otpError: null,

  // Verify OTP states
  resendOTPData: {},
  resendOTPLoading: false,
  resendOTPError: null,

  // Update Role
  updateRoleData: {},
  updateRoleLoading: false,
  updateRoleError: null,

  dropdownUsers: [],
  dropdownUsersLoading: false,
  dropdownUsersError: null,


  remainingAttempt: {},
  remainingLoading: false,
  remainingError: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearSignUp: (state) => {
      state.signupData = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRole.pending, (state) => {
        state.roleLoading = true;
        state.roleError = null;
      })
      .addCase(fetchRole.fulfilled, (state, action) => {
        state.roleLoading = false;
        state.roleData = action.payload.data;
      })
      .addCase(fetchRole.rejected, (state, action) => {
        state.roleLoading = false;
        state.roleError = action.payload;
      });

    builder
      .addCase(fetchSignUp.pending, (state) => {
        state.signupLoading = true;
        state.signupError = null;
      })
      .addCase(fetchSignUp.fulfilled, (state, action) => {
        state.signupLoading = false;
        state.signupData = action.payload.data;
      })
      .addCase(fetchSignUp.rejected, (state, action) => {
        state.signupLoading = false;
        state.signupError = action.payload;
      });

    builder
      .addCase(fetchSignIn.pending, (state) => {
        state.signinLoading = true;
        state.signinError = null;
      })
      .addCase(fetchSignIn.fulfilled, (state, action) => {
        state.signinLoading = false;
        state.signinData = action.payload.data;
      })
      .addCase(fetchSignIn.rejected, (state, action) => {
        state.signinLoading = false;
        state.signinError = action.payload;
      });

    builder
      .addCase(fetchOTP.pending, (state) => {
        state.otpLoading = true;
        state.otpError = null;
      })
      .addCase(fetchOTP.fulfilled, (state, action) => {
        state.otpLoading = false;
        state.otpData = action.payload.data;
      })
      .addCase(fetchOTP.rejected, (state, action) => {
        state.otpLoading = false;
        state.otpError = action.payload;
      });

    builder
      .addCase(fetchResendOTP.pending, (state) => {
        state.resendOTPLoading = true;
        state.resendOTPError = null;
      })
      .addCase(fetchResendOTP.fulfilled, (state, action) => {
        state.resendOTPLoading = false;
        state.resendOTPData = action.payload.data;
      })
      .addCase(fetchResendOTP.rejected, (state, action) => {
        state.resendOTPLoading = false;
        state.resendOTPError = action.payload;
      });

    builder
      .addCase(fetchUpdateRoleAuth.pending, (state) => {
        state.updateRoleLoading = true;
        state.updateRoleError = null;
      })
      .addCase(fetchUpdateRoleAuth.fulfilled, (state, action) => {
        state.updateRoleLoading = false;
        state.updateRoleData = action.payload.data;
      })
      .addCase(fetchUpdateRoleAuth.rejected, (state, action) => {
        state.updateRoleLoading = false;
        state.updateRoleError = action.payload;
      });
      builder
      // Fetch dropdown users cases
      .addCase(fetchDropdownUsers.pending, (state) => {
        state.dropdownUsersLoading = true;
        state.dropdownUsersError = null;
      })
      .addCase(fetchDropdownUsers.fulfilled, (state, action) => {
        state.dropdownUsersLoading = false;
        state.dropdownUsers = action.payload;
        // if (action?.payload?.meta?.success !== true) {
        //   notification.error({
        //     message: "Error",
        //     description: action?.payload?.meta?.message,
        //     duration: 2,
        //   });
        // }
      })
      .addCase(fetchDropdownUsers.rejected, (state, action) => {
        state.dropdownUsersLoading = false;
        state.dropdownUsersError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to fetch dropdown users",
          duration: 2,
        });
      });

    builder
      .addCase(fetchAttemptCount.pending, (state) => {
        state.remainingLoading = true;
        state.remainingError = null;
      })
      .addCase(fetchAttemptCount.fulfilled, (state, action) => {
        state.remainingLoading = false;
        state.remainingAttempt = action.payload.data;
      })
      .addCase(fetchAttemptCount.rejected, (state, action) => {
        state.remainingLoading = false;
        state.remainingError = action.payload;
      });
      
  },
});

export const { clearSignUp } = authSlice.actions;
export default authSlice.reducer;
