import { createSlice } from "@reduxjs/toolkit";
import {
  createAdminUser,
  fetchAdminUsers,
  fetchAdminById,
  removeAdminUser,
  updateAdminUser,
  updateAdminProfilePictureAction
} from "./actions";
import { notification } from "antd";

const initialState = {
  adminUsers: [],
  adminUsersLoading: false,
  adminUsersError: null,

  singleAdmin: {},
  singleAdminLoading: false,
  singleAdminError: null,

  createAdmin: {},
  createAdminLoading: false,
  createAdminError: null,

  updateAdmin: {},
  updateAdminLoading: false,
  updateAdminError: null,

  deleteAdmin: {},
  deleteAdminLoading: false,
  deleteAdminError: null,

  updateAdminProfilePicture: {},
  updateAdminProfilePictureLoading: false,
  updateAdminProfilePictureError: null,
};

const adminUsersSlice = createSlice({
  name: "adminUsers",
  initialState,
  reducers: {
    clearAdminForm: (state) => {
      state.singleAdmin = {};
      state.createAdmin = {};
      state.updateAdmin = {};
      state.singleAdminError = null;
      state.createAdminError = null;
      state.updateAdminError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create admin cases
      .addCase(createAdminUser.pending, (state) => {
        state.createAdminLoading = true;
        state.createAdminError = null;
      })
      .addCase(createAdminUser.fulfilled, (state, action) => {
        state.createAdmin = action.payload;
        state.createAdminLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        } else {
          notification.error({
            message: "Error",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        }
      })
      .addCase(createAdminUser.rejected, (state, action) => {
        state.createAdminLoading = false;
        state.createAdminError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to create admin user",
          duration: 2,
        });
      })

      // Fetch all admins cases
      .addCase(fetchAdminUsers.pending, (state) => {
        state.adminUsersLoading = true;
        state.adminUsersError = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.adminUsersLoading = false;
        state.adminUsers = action.payload;
        if (action?.payload?.meta?.success !== true) {
          notification.error({
            message: "Error",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        }
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.adminUsersLoading = false;
        state.adminUsersError = action.payload;
      })

      // Fetch single admin cases
      .addCase(fetchAdminById.pending, (state) => {
        state.singleAdminLoading = true;
        state.singleAdminError = null;
      })
      .addCase(fetchAdminById.fulfilled, (state, action) => {
        state.singleAdminLoading = false;
        state.singleAdmin = action.payload;
        if (action?.payload?.meta?.success !== true) {
          notification.error({
            message: "Error",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        }
      })
      .addCase(fetchAdminById.rejected, (state, action) => {
        state.singleAdminLoading = false;
        state.singleAdminError = action.payload;
      })

      // Update admin cases
      .addCase(updateAdminUser.pending, (state) => {
        state.updateAdminLoading = true;
        state.updateAdminError = null;
      })
      .addCase(updateAdminUser.fulfilled, (state, action) => {
        state.updateAdmin = action.payload;
        state.updateAdminLoading = false;
        if (action?.payload?.meta?.success === true) {
          // Update the admin in the list if it exists
          if (state.adminUsers?.data?.data) {
            state.adminUsers.data.data = state.adminUsers.data.data.map((admin) =>
              admin.id === action.payload.data.id ? action.payload.data : admin
            );
          }
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        } else {
          notification.error({
            message: "Error",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        }
      })
      .addCase(updateAdminUser.rejected, (state, action) => {
        state.updateAdminLoading = false;
        state.updateAdminError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to update admin user",
          duration: 2,
        });
      })

      // Delete admin cases
      .addCase(removeAdminUser.pending, (state) => {
        state.deleteAdminLoading = true;
        state.deleteAdminError = null;
      })
      .addCase(removeAdminUser.fulfilled, (state, action) => {
        state.deleteAdmin = action.payload;
        state.deleteAdminLoading = false;
        state.adminUsers.data.data = state.adminUsers.data.data.filter(
          (admin) => admin.id !== action.payload.id
        );
        state.adminUsers.data.pagination.totalRecords -= 1;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        } else {
          notification.error({
            message: "Error",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        }
      })
      .addCase(removeAdminUser.rejected, (state, action) => {
        state.deleteAdminLoading = false;
        state.deleteAdminError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to delete admin user",
          duration: 2,
        });
      })

      // Update admin profile picture cases
      .addCase(updateAdminProfilePictureAction.pending, (state) => {
        state.updateAdminProfilePictureLoading = true;
        state.updateAdminProfilePictureError = null;
      })
      .addCase(updateAdminProfilePictureAction.fulfilled, (state, action) => {
        state.updateAdminProfilePicture = action.payload;
        state.updateAdminProfilePictureLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success", 
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        }
      })
      .addCase(updateAdminProfilePictureAction.rejected, (state, action) => {
        state.updateAdminProfilePictureLoading = false;
        state.updateAdminProfilePictureError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to update admin profile picture",
          duration: 2,
        });
      });
  },
});

export const { clearAdminForm } = adminUsersSlice.actions;
export default adminUsersSlice.reducer;