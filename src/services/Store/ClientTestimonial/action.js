import { createAsyncThunk } from "@reduxjs/toolkit";
import { getReviewList } from "../../Apis/clientTestimonial";

// Thunk action for getting review list
export const fetchReviewList = createAsyncThunk(
  "reviews/fetchList",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getReviewList(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);