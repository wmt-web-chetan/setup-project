import { get, post, del } from "../../utils/apiWrapper";

// Get passwords list
export const getPasswordsList = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/passwords/list`, config);
};

// Create password
export const createPassword = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/passwords/create`, config);
};

// Update password
export const updatePassword = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/passwords/update`, config);
};

// Delete password
export const deletePassword = async (id) => {
  return await del(`/passwords/delete/${id}`);
};

export const getPasswordForEdit = async (id) => {
  return await get(`/passwords/edit/${id}`);
};
