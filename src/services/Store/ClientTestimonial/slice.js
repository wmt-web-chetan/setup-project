import { createSlice } from "@reduxjs/toolkit";
import { notification } from "antd";
import { fetchReviewList } from "./action";

const initialState = {
  reviewList: [],
  reviewListLoading: false,
  reviewListError: null,
};

const reviewsSlice = createSlice({
  name: "reviews",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch review list cases
      .addCase(fetchReviewList.pending, (state) => {
        state.reviewListLoading = true;
        state.reviewListError = null;
      })
      .addCase(fetchReviewList.fulfilled, (state, action) => {
        state.reviewListLoading = false;
        state.reviewList = action.payload;
      
      })
      .addCase(fetchReviewList.rejected, (state, action) => {
        state.reviewListLoading = false;
        state.reviewListError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to fetch review list",
          duration: 2,
        });
      });
  },
});

export default reviewsSlice.reducer;