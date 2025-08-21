import { createSlice } from "@reduxjs/toolkit";
import { fetchCompanyDetails } from "./actions";
// import { notification } from "antd";

const initialState = {
  companyDetailsData: {},
  companyDetailsLoading: false,
  companyDetailsError: null,
};

const companyDetailsSlice = createSlice({
  name: "companyDetails",
  initialState,
  reducers: {
    clearCompanyDetails: (state) => {
      state.companyDetailsData = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanyDetails.pending, (state) => {
        state.companyDetailsLoading = true;
        state.companyDetailsError = null;
      })
      .addCase(fetchCompanyDetails.fulfilled, (state, action) => {
        state.companyDetailsLoading = false;
        state.companyDetailsData = action.payload.data.companyDetails;
      })
      .addCase(fetchCompanyDetails.rejected, (state, action) => {
        state.companyDetailsLoading = false;
        state.companyDetailsError = action.payload;
      });
  },
});

export const { clearCompanyDetails } = companyDetailsSlice.actions;
export default companyDetailsSlice.reducer;