import { get, post } from "../../utils/apiWrapper";

// POST API for creating referral
export const createReferral = async (referralData) => {
  const config = {
    data: referralData,
  };
  return await post(`/referrals/create`, config);
};

// GET API for fetching referrals
export const getReferrals = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/referrals`, config);
};
