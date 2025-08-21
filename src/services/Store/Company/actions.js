import { createAsyncThunk } from "@reduxjs/toolkit";
import { getCompanyDetails } from "../../Apis/company";

export const fetchCompanyDetails = createAsyncThunk(
  "companyDetails/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getCompanyDetails(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);
