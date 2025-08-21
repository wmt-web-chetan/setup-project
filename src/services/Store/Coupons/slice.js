import { createSlice } from "@reduxjs/toolkit";
import { notification } from "antd";
import {
  addAssigns,
  addCouponAction,
  deleteCouponAction,
  fetchCouponById,
  fetchCoupons,
  updateCouponAction,
} from "./action";

const initialState = {
  coupons: [],
  couponsLoading: false,
  couponsError: null,

  singleCoupon: {},
  singleCouponLoading: false,
  singleCouponError: null,

  createCoupon: {},
  createCouponLoading: false,
  createCouponError: null,

  updateCoupon: {},
  updateCouponLoading: false,
  updateCouponError: null,

  assignCoupon: {},
  assignCouponLoading: false,
  assignCouponError: null,

  deleteCoupon: {},
  deleteCouponLoading: false,
  deleteCouponError: null,
};

const couponsSlice = createSlice({
  name: "coupons",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch coupons cases
      .addCase(fetchCoupons.pending, (state) => {
        state.couponsLoading = true;
        state.couponsError = null;
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.couponsLoading = false;
        state.coupons = action.payload;
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.couponsLoading = false;
        state.couponsError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch coupons",
          duration: 2,
        });
      });

    builder
      .addCase(fetchCouponById.pending, (state) => {
        state.singleCouponLoading = true;
        state.singleCouponError = null;
      })
      .addCase(fetchCouponById.fulfilled, (state, action) => {
        state.singleCouponLoading = false;
        state.singleCoupon = action.payload;
      })
      .addCase(fetchCouponById.rejected, (state, action) => {
        state.singleCouponLoading = false;
        state.singleCouponError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch coupon details",
          duration: 2,
        });
      });
    builder
      .addCase(addCouponAction.pending, (state) => {
        state.createCouponLoading = true;
        state.createCouponError = null;
      })
      .addCase(addCouponAction.fulfilled, (state, action) => {
        state.createCoupon = action.payload;
        state.createCouponLoading = false;
      })
      .addCase(addCouponAction.rejected, (state, action) => {
        state.createCouponLoading = false;
        state.createCouponError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to create coupon",
          duration: 2,
        });
      });
    builder
      .addCase(updateCouponAction.pending, (state) => {
        state.updateCouponLoading = true;
        state.updateCouponError = null;
      })
      .addCase(updateCouponAction.fulfilled, (state, action) => {
        state.updateCoupon = action.payload;
        state.updateCouponLoading = false;
        if (state.coupons?.data?.coupons) {
          state.coupons.data.coupons = state.coupons.data.coupons.map(
            (coupon) =>
              coupon.id === action.payload?.data?.coupon?.id
                ? action.payload.data.coupon
                : coupon
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
      .addCase(updateCouponAction.rejected, (state, action) => {
        state.updateCouponLoading = false;
        state.updateCouponError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to update coupon",
          duration: 2,
        });
      });

    builder
      .addCase(addAssigns.pending, (state) => {
        state.assignCouponLoading = true;
        state.assignCouponError = null;
      })
      .addCase(addAssigns.fulfilled, (state, action) => {
        state.assignCoupon = action.payload;
        state.assignCouponLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        }
      })
      .addCase(addAssigns.rejected, (state, action) => {
        state.assignCouponLoading = false;
        state.assignCouponError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to assign coupon",
          duration: 2,
        });
      });

      builder
      builder
      // Delete coupon cases
      .addCase(deleteCouponAction.pending, (state) => {
        state.deleteCouponLoading = true;
        state.deleteCouponError = null;
      })
      .addCase(deleteCouponAction.fulfilled, (state, action) => {
        state.deleteCoupon = action.payload;
        state.deleteCouponLoading = false;
        
        // Update coupons list by removing deleted coupon
        if (state.coupons?.data?.data) {
          state.coupons.data.data = state.coupons.data.data.filter(
            (coupon) => coupon.id !== action.payload.id
          );
          if (state.coupons?.data?.pagination) {
            state.coupons.data.pagination.totalRecords -= 1;
          }
        }
        
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message || "Coupon deleted successfully",
            duration: 2,
          });
        } else {
          notification.error({
            message: "Error",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        }
      })
      .addCase(deleteCouponAction.rejected, (state, action) => {
        state.deleteCouponLoading = false;
        state.deleteCouponError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to delete coupon",
          duration: 2,
        });
      });
  },
});

export default couponsSlice.reducer;
