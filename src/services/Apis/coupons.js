import { del, get, post } from "../../utils/apiWrapper";

// GET API for fetching coupons
export const getCoupons = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/admin/master/coupon/`, config);
};

export const createCoupon = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/admin/master/coupon/create`, config);
};

export const updateCoupon = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/admin/master/coupon/update`, config);
};

export const getCouponById = async (id) => {
  return await get(`/admin/master/coupon/edit/${id}`);
};

export const assignCoupon = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/admin/master/coupon/assign`, config);
};

export const removeCoupon = async (id) => {
  return await del(`/admin/master/coupon/delete/${id}`);
};