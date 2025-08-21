import { createSlice } from "@reduxjs/toolkit";
import { notification } from "antd";
import { fetchDashboardData, updateDashboardReorderAction } from "./actions";

const initialState = {
  dashboardData: {},
  dashboardDataLoading: false,
  dashboardDataError: null,

  dashboardReorder: {},
  dashboardReorderLoading: false,
  dashboardReorderError: null,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch dashboard data cases
      .addCase(fetchDashboardData.pending, (state) => {
        state.dashboardDataLoading = true;
        state.dashboardDataError = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.dashboardDataLoading = false;
        state.dashboardData = action.payload;
       
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.dashboardDataLoading = false;
        state.dashboardDataError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch dashboard data",
          duration: 2,
        });
      });

    builder
      // Update dashboard reorder cases
      .addCase(updateDashboardReorderAction.pending, (state) => {
        state.dashboardReorderLoading = true;
        state.dashboardReorderError = null;
      })
      .addCase(updateDashboardReorderAction.fulfilled, (state, action) => {
        state.dashboardReorder = action.payload;
        state.dashboardReorderLoading = false;
        // if (action?.payload?.meta?.success === true) {
        //   notification.success({
        //     message: "Success",
        //     description:
        //       action?.payload?.meta?.message ||
        //       "Dashboard reordered successfully",
        //     duration: 2,
        //   });
        // } else {
        //   notification.error({
        //     message: "Error",
        //     description: action?.payload?.meta?.message,
        //     duration: 2,
        //   });
        // }
      })
      .addCase(updateDashboardReorderAction.rejected, (state, action) => {
        state.dashboardReorderLoading = false;
        state.dashboardReorderError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to reorder dashboard",
          duration: 2,
        });
      });
  },
});

export default dashboardSlice.reducer;
