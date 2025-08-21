import { del, get, post } from "../../utils/apiWrapper";

// Get meeting calendar data
export const getMeetingCalendar = async (params) => {
  const config = {
    data: params,
  };
  return await post(`/meeting/calendar`, config);
};

// Create a new meeting
export const createMeeting = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/meeting/create`, config);
};

// Update a meeting
export const updateMeeting = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/meeting/update`, config);
};

// Status a meeting
export const statusMeeting = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/meeting/statusChange`, config);
};

// Delete a meeting
export const deleteMeeting = async (data) => {
  return await del(`/meeting/delete/${data}`);
};

// Get meeting tags
export const getMeetingTags = async () => {
  return await get(`/meeting/tags`);
};

export const getGuest = async (data) => {
  const config = {
    params: data,
  };

  return await get(`/users/search`, config);
};
