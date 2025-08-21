import { createSlice } from "@reduxjs/toolkit";
import { notification } from "antd";
import {
  fetchCoupons,
  addCoupon,
  fetchCouponById,
  updateCouponAction,
} from "./couponActions";

const initialState = {
  couponList: [],
  couponListLoading: false,
  couponListError: null,

  couponDetails: {},
  couponDetailsLoading: false,
  couponDetailsError: null,

  newCoupon: {},
  newCouponLoading: false,
  newCouponError: null,

  updatedCoupon: {},
  updatedCouponLoading: false,
  updatedCouponError: null,
};

const couponSlice = createSlice({
  name: "coupons",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch all coupons cases
      .addCase(fetchCoupons.pending, (state) => {
        state.couponListLoading = true;
        state.couponListError = null;
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.couponListLoading = false;
        state.couponList = action.payload;

      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.couponListLoading = false;
        state.couponListError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch coupons",
          duration: 2,
        });
      })

      // Create coupon cases
      .addCase(addCoupon.pending, (state) => {
        state.newCouponLoading = true;
        state.newCouponError = null;
      })
      .addCase(addCoupon.fulfilled, (state, action) => {
        state.newCoupon = action.payload;
        state.newCouponLoading = false;
        if (action?.payload?.meta?.success === true) {
          // If we have a list and are on the first page, add the new coupon to the list
          if (state.couponList?.data?.pagination?.currentPage === 1) {
            state.couponList.data.data = [
              action.payload?.data,
              ...state.couponList.data.data,
            ];
          }
          // Increment total count
          if (state.couponList?.data?.pagination) {
            state.couponList.data.pagination.totalRecords += 1;
          }
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message || "Coupon created successfully",
            duration: 2,
          });
        }
      })
      .addCase(addCoupon.rejected, (state, action) => {
        state.newCouponLoading = false;
        state.newCouponError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to create coupon",
          duration: 2,
        });
      })

      // Fetch coupon by ID cases
      .addCase(fetchCouponById.pending, (state) => {
        state.couponDetailsLoading = true;
        state.couponDetailsError = null;
      })
      .addCase(fetchCouponById.fulfilled, (state, action) => {
        state.couponDetailsLoading = false;
        state.couponDetails = action.payload;
       
      })
      .addCase(fetchCouponById.rejected, (state, action) => {
        state.couponDetailsLoading = false;
        state.couponDetailsError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch coupon details",
          duration: 2,
        });
      })

      // Update coupon cases
      .addCase(updateCouponAction.pending, (state) => {
        state.updatedCouponLoading = true;
        state.updatedCouponError = null;
      })
      .addCase(updateCouponAction.fulfilled, (state, action) => {
        state.updatedCoupon = action.payload;
        state.updatedCouponLoading = false;
        if (state.couponList?.data?.data) {
          state.couponList.data.data = state.couponList.data.data.map(
            (coupon) =>
              coupon.id === action.payload?.data?.id
                ? action.payload.data
                : coupon
          );
        }
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message || "Coupon updated successfully",
            duration: 2,
          });
        }
      })
      .addCase(updateCouponAction.rejected, (state, action) => {
        state.updatedCouponLoading = false;
        state.updatedCouponError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to update coupon",
          duration: 2,
        });
      });
  },
});

export default couponSlice.reducer;
