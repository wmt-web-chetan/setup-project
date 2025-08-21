import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getMeetingCalendar,
  createMeeting,
  updateMeeting,
  getMeetingTags,
  getGuest,
  deleteMeeting,
  statusMeeting
} from "../../Apis/calender";

// Thunk action for getting meeting calendar data
export const fetchMeetingCalendar = createAsyncThunk(
  "meetings/fetchCalendar",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getMeetingCalendar(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for creating a meeting
export const addMeeting = createAsyncThunk(
  "meetings/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createMeeting(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for updating a meeting
export const updateMeetingAction = createAsyncThunk(
  "meetings/update",
  async (data, { rejectWithValue }) => {
    try {
      const response = await updateMeeting(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for updating a meeting
export const statusMeetingAction = createAsyncThunk(
  "meetings/status",
  async (data, { rejectWithValue }) => {
    try {
      const response = await statusMeeting(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for updating a meeting
export const deleteMeetingAction = createAsyncThunk(
  "meetings/delete",
  async (data, { rejectWithValue }) => {
    try {
      const response = await deleteMeeting(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for getting meeting tags
export const fetchMeetingTags = createAsyncThunk(
  "meetings/fetchTags",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMeetingTags();
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const getGuestList= createAsyncThunk(
    "meetings/getGuest",
    async (data, { rejectWithValue }) => {
      try {
        const response = await getGuest(data);
        return response;
      } catch (error) {
        return rejectWithValue(error?.response?.data);
      }
    }
  );


  // Thunk action for getting meeting calendar data
export const fetchMeetingCalendarForMini = createAsyncThunk(
  "meetings/fetchCalendarMini",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getMeetingCalendar(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);