import { get } from "../../utils/apiWrapper";

 

export const getCompanyDetails = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/company-details`, config);
};