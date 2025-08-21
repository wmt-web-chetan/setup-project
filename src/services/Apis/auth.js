import { get, post } from "../../utils/apiWrapper";

export const roleAuth = async () => {
  return await get(`/auth/role`);
};

export const signUpAuth = async (userData) => {
  const config = {
    data: userData,
  };
  return await post(`/auth/register`, config);
};

export const signInAuth = async (userData) => {
  const config = {
    data: userData,
  };
  return await post(`/auth/send-otp`, config);
};

export const otpVerifyAuth = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/auth/verify-otp`, config);
};

export const resendOTPAuth = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/auth/send-otp`, config);
};

export const updateRoleAuth = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/auth/update-login-role`, config);
};

export const getDropdownUsers = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/auth/drop-down-users`, config);
};



export const attemptRemaining = async (userData) => {
  const config = {
    data: userData,
  };
  return await post(`auth/otp-attempts`, config);
};