import { get, patch, post } from "../../utils/apiWrapper";

// Get user for edit by ID
export const getUserForEdit = async (userId) => {
  return await get(`/users/edit/${userId}`);
};

export const getUserDetailById = async (userId) => {
  return await get(`/users/edit/${userId}`);
};

// Fetch users with pagination, active status filter, and search
export const getUsersList = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/users/list`, config);
};

export const createUser = async (userData) => {
  const config = {
    data: userData,
  };

  return await post("/users/create", config);
};

// Update an existing user
export const updateUser = async (userId, userData) => {
  const config = {
    data: userData,
  };

  return await post(`/users/update`, config);
};

export const updateProfile = async (data) => {
  const config = {
    data: data
  };

  return await post(`/users/profile-update`, config);
};
export const changePhoneNumber = async (data) => {
  const config = {
    data: data,
   
  };
  return await post(`/users/phone-number-change`, config);
};

export const getRoleUserList = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/users/role-user-list`, config);
};

// GET API for fetching notifications list
export const getNotificationsList = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/notifications/list`, config);
};

// POST API for marking all notifications as read
export const markAllNotificationsAsRead = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/notifications/mark-all-read`, config);
};

export const toggleNotificationMute = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/notifications/toggle-mute`, config);
};