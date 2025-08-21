import { del, get, post } from "../../utils/apiWrapper";

// GET API for fetching state licenses
export const getStateLicenses = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/state-licenses`, config);
};

// POST API for creating state license
export const createStateLicense = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/state-licenses/create`, config);
};

// DELETE API for deleting state license
export const deleteStateLicense = async (id) => {
  return await del(`/state-licenses/delete/${id}`);
};

export const updateStateLicenseStatus = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/state-licenses/status`, config);
};