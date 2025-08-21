import { get, post } from "../../utils/apiWrapper";

// Get all coupons
export const getCoupons = async (params) => {
  const config = {
    params: params,
  };
  return await get("/admin/master/coupon/", config);
};

// Create new coupon
export const createCoupon = async (data) => {
  const config = {
    data: data,
  };
  return await post("/admin/master/coupon/create", config);
};

// Update existing coupon
export const updateCoupon = async (data) => {
  const config = {
    data: data,
  };
  return await post("/admin/master/coupon/update", config);
};

// Get coupon by ID for editing
export const getCouponById = async (id) => {
  return await get(`/admin/master/coupon/edit/${id}`);
};