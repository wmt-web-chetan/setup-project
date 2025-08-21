import { createAsyncThunk } from "@reduxjs/toolkit";
import { assignCoupon, createCoupon, getCouponById, getCoupons, removeCoupon, updateCoupon } from "../../Apis/coupons";

// Thunk action for getting coupons
export const fetchCoupons = createAsyncThunk(
  "coupons/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getCoupons(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const addCouponAction = createAsyncThunk(
  "coupons/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createCoupon(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateCouponAction = createAsyncThunk(
    "coupons/update",
    async (data, { rejectWithValue }) => {
      try {
        const response = await updateCoupon(data);
        return response;
      } catch (error) {
        return rejectWithValue(error.response.data);
      }
    }
  );

  // Thunk action for getting single coupon by ID
export const fetchCouponById = createAsyncThunk(
    "coupons/fetchById",
    async (id, { rejectWithValue }) => {
      try {
        const response = await getCouponById(id);
        return response;
      } catch (error) {
        return rejectWithValue(error.response.data);
      }
    }
  );

  // Thunk action for assigning coupon
export const addAssigns = createAsyncThunk(
    "coupons/assign",
    async (data, { rejectWithValue }) => {
      try {
        const response = await assignCoupon(data);
        return response;
      } catch (error) {
        return rejectWithValue(error.response.data);
      }
    }
  );

  export const deleteCouponAction = createAsyncThunk(
    "coupons/delete",
    async (id, { rejectWithValue }) => {
      try {
        const response = await removeCoupon(id);
        return { ...response, id }; // Including id in response for state update
      } catch (error) {
        return rejectWithValue(error?.response?.data);
      }
    }
  );