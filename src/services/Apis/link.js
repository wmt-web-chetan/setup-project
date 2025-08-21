import { del, get, post } from "../../utils/apiWrapper";

// GET API for fetching links
export const getLinks = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/admin/master/link`, config);
};

// POST API for creating a link
export const createLink = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/admin/master/link/create`, config);
};

// POST API for updating a link
export const updateLink = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/admin/master/link/update`, config);
};

// DELETE API for deleting a link
export const deleteLink = async (id) => {
  return await del(`/admin/master/link/delete/${id}`);
};
