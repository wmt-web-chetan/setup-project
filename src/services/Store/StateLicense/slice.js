import { createSlice } from "@reduxjs/toolkit";
import { notification } from "antd";
import { addStateLicense, fetchStateLicenses, removeStateLicense, updateStateLicenseStatusAction } from "./action";

const initialState = {
  stateLicenses: [],
  stateLicensesLoading: false,
  stateLicensesError: null,

  createStateLicense: {},
  createStateLicenseLoading: false,
  createStateLicenseError: null,

  deleteStateLicense: {},
  deleteStateLicenseLoading: false,
  deleteStateLicenseError: null,

  updateStateLicenseStatus: {},
  updateStateLicenseStatusLoading: false,
  updateStateLicenseStatusError: null,
};

const stateLicensesSlice = createSlice({
  name: "stateLicenses",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch state licenses cases
      .addCase(fetchStateLicenses.pending, (state) => {
        state.stateLicensesLoading = true;
        state.stateLicensesError = null;
      })
      .addCase(fetchStateLicenses.fulfilled, (state, action) => {
        state.stateLicensesLoading = false;
        state.stateLicenses = action.payload;
       
      })
      .addCase(fetchStateLicenses.rejected, (state, action) => {
        state.stateLicensesLoading = false;
        state.stateLicensesError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to fetch state licenses",
          duration: 2,
        });
      });

      builder
        // Create state license cases
        .addCase(addStateLicense.pending, (state) => {
            state.createStateLicenseLoading = true;
            state.createStateLicenseError = null;
          })
          .addCase(addStateLicense.fulfilled, (state, action) => {
            state.createStateLicense = action.payload;
            state.createStateLicenseLoading = false;
           
          })
          .addCase(addStateLicense.rejected, (state, action) => {
            state.createStateLicenseLoading = false;
            state.createStateLicenseError = action.payload;
            notification.error({
              message: "Error",
              description: action?.payload?.meta?.message || "Failed to create state license",
              duration: 2,
            });
          });

          builder
          .addCase(removeStateLicense.pending, (state) => {
            state.deleteStateLicenseLoading = true;
            state.deleteStateLicenseError = null;
          })
          .addCase(removeStateLicense.fulfilled, (state, action) => {
            state.deleteStateLicense = action.payload;
            state.deleteStateLicenseLoading = false;
            // Remove the deleted license from the list if it exists
            if (state.stateLicenses?.data?.state_licenses) {
              state.stateLicenses.data.state_licenses = state.stateLicenses.data.state_licenses.filter(
                (license) => license.id !== action.payload.id
              );
              // Update pagination count
              if (state.stateLicenses?.data?.pagination) {
                state.stateLicenses.data.pagination.totalRecords -= 1;
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
          .addCase(removeStateLicense.rejected, (state, action) => {
            state.deleteStateLicenseLoading = false;
            state.deleteStateLicenseError = action.payload;
            notification.error({
              message: "Error",
              description: action?.payload?.meta?.message || "Failed to delete state license",
              duration: 2,
            });
          });

          builder
          .addCase(updateStateLicenseStatusAction.pending, (state) => {
            state.updateStateLicenseStatusLoading = true;
            state.updateStateLicenseStatusError = null;
          })
          .addCase(updateStateLicenseStatusAction.fulfilled, (state, action) => {
            state.updateStateLicenseStatus = action.payload;
            state.updateStateLicenseStatusLoading = false;
            // Update the status in the current list if it exists
            if (state.stateLicenses?.data?.state_licenses && action?.payload?.data) {
              state.stateLicenses.data.state_licenses = state.stateLicenses.data.state_licenses.map(
                (license) => license.id === action.payload.data.id ? action.payload.data : license
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
          .addCase(updateStateLicenseStatusAction.rejected, (state, action) => {
            state.updateStateLicenseStatusLoading = false;
            state.updateStateLicenseStatusError = action.payload;
            notification.error({
              message: "Error",
              description: action?.payload?.meta?.message || "Failed to update state license status",
              duration: 2,
            });
          });
  },
});

export default stateLicensesSlice.reducer;