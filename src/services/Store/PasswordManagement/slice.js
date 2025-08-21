import { createSlice } from "@reduxjs/toolkit";
import { notification } from "antd";
import { 
  fetchPasswordsList,
  addPassword,
  updatePasswordAction,
  removePassword,
  fetchPasswordForEdit
} from "./actions";

const initialState = {
  passwords: [],
  passwordsLoading: false,
  passwordsError: null,

  newPassword: {},
  newPasswordLoading: false,
  newPasswordError: null,

  passwordUpdate: {},
  passwordUpdateLoading: false,
  passwordUpdateError: null,

  passwordDeletion: {},
  passwordDeletionLoading: false,
  passwordDeletionError: null,

  passwordEdit: {},
  passwordEditLoading: false,
  passwordEditError: null,
};

const passwordsSlice = createSlice({
  name: "passwords",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch passwords list cases
      .addCase(fetchPasswordsList.pending, (state) => {
        state.passwordsLoading = true;
        state.passwordsError = null;
      })
      .addCase(fetchPasswordsList.fulfilled, (state, action) => {
        state.passwordsLoading = false;
        state.passwords = action.payload;
        // if (action?.payload?.meta?.success !== true) {
        //   notification.error({
        //     message: "Error",
        //     description: action?.payload?.meta?.message,
        //     duration: 2,
        //   });
        // }
      })
      .addCase(fetchPasswordsList.rejected, (state, action) => {
        state.passwordsLoading = false;
        state.passwordsError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to fetch passwords",
          duration: 2,
        });
      })

      // Create password cases
      .addCase(addPassword.pending, (state) => {
        state.newPasswordLoading = true;
        state.newPasswordError = null;
      })
      .addCase(addPassword.fulfilled, (state, action) => {
        state.newPassword = action.payload;
        state.newPasswordLoading = false;
        if (action?.payload?.meta?.success === true) {
          // If we're on the first page, add the new password to the list
          if (state.passwords?.data?.pagination?.currentPage === 1) {
            // Update this line to correctly handle the response structure
            state.passwords.data.password = [
              action.payload?.data?.password,
              ...state.passwords.data.password,
            ];
          }
          // Increment total count
          if (state.passwords?.data?.pagination) {
            state.passwords.data.pagination.totalRecords += 1;
          }
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message || "Password created successfully",
            duration: 2,
          });
        } 
      })
      .addCase(addPassword.rejected, (state, action) => {
        state.newPasswordLoading = false;
        state.newPasswordError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to create password",
          duration: 2,
        });
      })

      // Update password cases
      .addCase(updatePasswordAction.pending, (state) => {
        state.passwordUpdateLoading = true;
        state.passwordUpdateError = null;
      })
      .addCase(updatePasswordAction.fulfilled, (state, action) => {
        state.passwordUpdate = action.payload;
        state.passwordUpdateLoading = false;
        if (state.passwords?.data?.password) {
          state.passwords.data.password = state.passwords.data.password.map(
            (password) => password.id === action.payload?.data?.password?.id ? action.payload.data.password : password
          );
        }
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        } 
      })
      .addCase(updatePasswordAction.rejected, (state, action) => {
        state.passwordUpdateLoading = false;
        state.passwordUpdateError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to update password",
          duration: 2,
        });
      })

      // Delete password cases
      .addCase(removePassword.pending, (state) => {
        state.passwordDeletionLoading = true;
        state.passwordDeletionError = null;
      })
      .addCase(removePassword.fulfilled, (state, action) => {
        state.passwordDeletion = action.payload;
        state.passwordDeletionLoading = false;
        if (state.passwords?.data?.password) {
          state.passwords.data.password = state.passwords.data.password.filter(
            (password) => password.id !== action.payload?.id
          );
          if (state.passwords?.data?.pagination) {
            state.passwords.data.pagination.totalRecords -= 1;
          }
        }
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        } 
      })
      .addCase(removePassword.rejected, (state, action) => {
        state.passwordDeletionLoading = false;
        state.passwordDeletionError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to delete password",
          duration: 2,
        });
      })

      builder
      // Fetch password for edit cases
      .addCase(fetchPasswordForEdit.pending, (state) => {
        state.passwordEditLoading = true;
        state.passwordEditError = null;
      })
      .addCase(fetchPasswordForEdit.fulfilled, (state, action) => {
        state.passwordEditLoading = false;
        state.passwordEdit = action.payload;

      })
      .addCase(fetchPasswordForEdit.rejected, (state, action) => {
        state.passwordEditLoading = false;
        state.passwordEditError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to fetch password for edit",
          duration: 2,
        });
      });
  },
});

export default passwordsSlice.reducer;