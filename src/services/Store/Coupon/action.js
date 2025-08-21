import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  getCouponById,
} from "../../Api/couponService";

// Thunk action for getting all coupons
export const fetchCoupons = createAsyncThunk(
  "coupons/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getCoupons(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for creating a coupon
export const addCoupon = createAsyncThunk(
  "coupons/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createCoupon(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for updating a coupon
export const updateCouponAction = createAsyncThunk(
  "coupons/update",
  async (data, { rejectWithValue }) => {
    try {
      const response = await updateCoupon(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for getting a coupon by ID
export const fetchCouponById = createAsyncThunk(
  "coupons/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getCouponById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);