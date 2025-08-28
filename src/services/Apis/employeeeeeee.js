import { get, post, del, put } from "../Apiwrapper/apiwrapper";

// Register new admin
export const registerAdmin = async (adminData) => {
  const config = {
    data: adminData,
    headers: {
      "Content-Type": "application/json",
    },
  };
  return await post(`/user/admin/register`, config);
};

// Get all admins
export const getAllAdmins = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/user/admin/employee/all`, config);
};

// Get admin by ID
export const getAdminById = async (id) => {
  return await get(`/user/admin/employee/details/${id}`);
};

// Delete admin
export const deleteAdmin = async (id, data) => {
    const config = {
      data: data // This will contain the reason
    };
    return await del(`/user/admin/employee/${id}/delete`, config);
  };

// Update admin
export const updateAdmin = async (id, data) => {
  const config = {
    data: data,
    headers: {
      "Content-Type": "application/json",
    },
  };
  return await put(`/user/admin/employee/${id}/update`, config);
};

// Update admin profile picture
export const updateAdminProfilePicture = async (id, data) => {
  const config = {
    data: data,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  };
  return await put(`/user/admin/profile-picture/self`, config);
};
