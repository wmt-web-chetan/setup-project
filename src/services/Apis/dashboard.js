import { get, post } from "../../utils/apiWrapper";

// GET API for dashboard data
export const getDashboardData = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/dashboard`, config);
};

export const updateDashboardReorder = async (data) => {
  const config = {
    data: data,
   
  };
  return await post(`/dashboard/reorder`, config);
};