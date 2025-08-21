import { createAsyncThunk } from "@reduxjs/toolkit";
import { getDashboardData, updateDashboardReorder } from "../../Apis/dashboard";

// Thunk action for fetching dashboard data
export const fetchDashboardData = createAsyncThunk(
  "dashboard/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getDashboardData(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const updateDashboardReorderAction = createAsyncThunk(
  "dashboardReorder/update",
  async (data, { rejectWithValue }) => {
    try {
      const response = await updateDashboardReorder(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);