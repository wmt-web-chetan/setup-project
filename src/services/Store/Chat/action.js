import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getChatMessageDetails,
  getUserChatTable,
  sendChatMessage,
  getChatList,
  getChatRoomList,
  leaveChatRoom,
  createChatRoom,
  updateChatRoom,
  deleteChatRoom,
  addParticipantsByMeeting,
  getUserMediaDetails,
  getChatRoomDetails,
  getMeetings,
  getDownloadFile,
} from "../../Apis/chat";

// Thunk action for getting user chat table
export const fetchUserChatTable = createAsyncThunk(
  "userChatTable/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getUserChatTable(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for getting chat message details
export const fetchChatMessageDetailsAction = createAsyncThunk(
  "chatMessageDetails/fetch",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getChatMessageDetails(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for sending a chat message
export const sendChatMessageAction = createAsyncThunk(
  "chat/sendMessage",
  async (data, { rejectWithValue }) => {
    try {
      const response = await sendChatMessage(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for getting chat list
export const fetchChatList = createAsyncThunk(
  "chat/fetchList",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getChatList(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for getting chat room list
export const fetchChatRoomList = createAsyncThunk(
  "chatRooms/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getChatRoomList(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for leaving a chat room
export const leaveChatRoomAction = createAsyncThunk(
  "chatRoom/leave",
  async (data, { rejectWithValue }) => {
    try {
      const response = await leaveChatRoom(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for creating a chat room
export const addChatRoom = createAsyncThunk(
  "chatRooms/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createChatRoom(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for updating a chat room
export const updateChatRoomAction = createAsyncThunk(
  "chatRoom/update",
  async (data, { rejectWithValue }) => {
    try {
      const response = await updateChatRoom(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for deleting a chat room
export const removeChatRoom = createAsyncThunk(
  "chatRooms/delete",
  async (id, { rejectWithValue }) => {
    try {
      const response = await deleteChatRoom(id);
      return { ...response, id }; // Including id in response for state update
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for getting chat room details
export const fetchChatRoomDetails = createAsyncThunk(
  "chatRoom/fetchDetails",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getChatRoomDetails(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for getting user media details
export const fetchUserMediaDetails = createAsyncThunk(
  "userMedia/fetchDetails",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getUserMediaDetails(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for adding participants by meeting
export const addChatRoomParticipantsAction = createAsyncThunk(
  "chatRoom/addParticipants",
  async (data, { rejectWithValue }) => {
    try {
      const response = await addParticipantsByMeeting(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const fetchMeetings = createAsyncThunk(
  "meetings/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getMeetings(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const fetchDownloadFile = createAsyncThunk(
  "downloadFile/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getDownloadFile(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);