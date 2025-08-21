import { get, post } from "../../utils/apiWrapper";

// GET API for fetching permissions
export const getPermissions = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/permissions`);
};

// Create a new role
export const createRole = async (roleData) => {
  const config = {
    data: roleData,
  };
  return await post(`/roles/create`, config);
};

// Get all roles
export const getAllRoles = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/roles`, config);
};

// Get role by ID
export const getRoleById = async (id) => {
  return await get(`/roles/${id}`);
};


// Get all roles (without pagination)
export const getAllRolesList = async () => {
  return await get(`/roles/all`);
}
// POST API for updating a role
export const updateRole = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/roles/update`, config);
};