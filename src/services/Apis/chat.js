import { del, get, post } from "../../utils/apiWrapper";

// Get user chat table data
export const getUserChatTable = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/users/chattable`, config);
};

export const getChatMessageDetails = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/chat/messages`, config);
};

export const sendChatMessage = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/chat/sendMessage`, config);
};
// Get chat list
export const getChatList = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/chat/list`, config);
};

// Get chat room list
export const getChatRoomList = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/chat/room/list`, config);
};

// POST API for leaving a chat room
export const leaveChatRoom = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/chat/room/leave`, config);
};

// In your chatRoomService.js file
export const createChatRoom = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/chat/room/create`, config);
};

// POST API for updating chat room
export const updateChatRoom = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/chat/room/update`, config);
};

// Delete chat room
export const deleteChatRoom = async (id) => {
  return await del(`/chat/room/delete/${id}`);
};

export const getChatRoomDetails = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/chat/room/chat-room-details`, config);
};

// POST API for user media details
export const getUserMediaDetails = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/chat/userMediadetails`, config);
};
// Add participants to a chat room by meeting
export const addParticipantsByMeeting = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/chat/room/add-participants-by-meeting`, config);
};

export const getMeetings = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/meeting/list`, config);
};

export const getDownloadFile = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/download-file`, config);
};