import { get } from "../../utils/apiWrapper";

// Get review list
export const getReviewList = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/rating/review-list`, config);
};