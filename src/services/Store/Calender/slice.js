import { createSlice } from "@reduxjs/toolkit";
import { notification } from "antd";
import {
  fetchMeetingCalendar,
  addMeeting,
  updateMeetingAction,
  fetchMeetingTags,
  getGuestList,
  fetchMeetingCalendarForMini,
  deleteMeetingAction,
  statusMeetingAction,
} from "./action";

const initialState = {
  meetingCalendar: [],
  meetingCalendarLoading: false,
  meetingCalendarError: null,

  createMeeting: {},
  createMeetingLoading: false,
  createMeetingError: null,

  updateMeeting: {},
  updateMeetingLoading: false,
  updateMeetingError: null,

  statusMeeting: {},
  statusMeetingLoading: false,
  statusMeetingError: null,

  deleteMeeting: {},
  deleteMeetingLoading: false,
  deleteMeetingError: null,

  meetingTags: [],
  meetingTagsLoading: false,
  meetingTagsError: null,

  guest: {},
  guestLoading: false,
  guestError: null,

  meetingCalendarMini: [],
  meetingCalendarLoadingMini: false,
  meetingCalendarErrorMini: null,
};

const meetingsSlice = createSlice({
  name: "meetings",
  initialState,
  reducers: {
    clearGuest: (state) => {
      state.guest = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch meeting calendar cases
      .addCase(fetchMeetingCalendar.pending, (state) => {
        state.meetingCalendarLoading = true;
        state.meetingCalendarError = null;
      })
      .addCase(fetchMeetingCalendar.fulfilled, (state, action) => {
        state.meetingCalendarLoading = false;
        state.meetingCalendar = action.payload;
        // if (action?.payload?.meta?.success !== true) {
        //   notification.error({
        //     message: "Error",
        //     description: action?.payload?.meta?.message,
        //     duration: 2,
        //   });
        // }
      })
      .addCase(fetchMeetingCalendar.rejected, (state, action) => {
        state.meetingCalendarLoading = false;
        state.meetingCalendarError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message ||
            "Failed to fetch meeting calendar",
          duration: 2,
        });
      })

      // Create meeting cases
      .addCase(addMeeting.pending, (state) => {
        state.createMeetingLoading = true;
        state.createMeetingError = null;
      })
      .addCase(addMeeting.fulfilled, (state, action) => {
        state.createMeeting = action.payload;
        state.createMeetingLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message || "Meeting created successfully",
            duration: 2,
          });
        }
      })
      .addCase(addMeeting.rejected, (state, action) => {
        state.createMeetingLoading = false;
        state.createMeetingError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to create meeting",
          duration: 2,
        });
      })

      // status meeting cases
      .addCase(statusMeetingAction.pending, (state) => {
        state.statusMeetingLoading = true;
        state.statusMeetingError = null;
      })
      .addCase(statusMeetingAction.fulfilled, (state, action) => {
        state.statusMeeting = action.payload;
        state.statusMeetingLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message || "Meeting updated successfully",
            duration: 2,
          });
        }
      })
      .addCase(statusMeetingAction.rejected, (state, action) => {
        state.statusMeetingLoading = false;
        state.statusMeetingError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to update meeting",
          duration: 2,
        });
      })

      // Update meeting cases
      .addCase(updateMeetingAction.pending, (state) => {
        state.updateMeetingLoading = true;
        state.updateMeetingError = null;
      })
      .addCase(updateMeetingAction.fulfilled, (state, action) => {
        state.updateMeeting = action.payload;
        state.updateMeetingLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message || "Meeting updated successfully",
            duration: 2,
          });
        }
      })
      .addCase(updateMeetingAction.rejected, (state, action) => {
        state.updateMeetingLoading = false;
        state.updateMeetingError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to update meeting",
          duration: 2,
        });
      })

      // Delete meeting cases
      .addCase(deleteMeetingAction.pending, (state) => {
        state.deleteMeetingLoading = true;
        state.deleteMeetingError = null;
      })
      .addCase(deleteMeetingAction.fulfilled, (state, action) => {
        state.deleteMeeting = action.payload;
        state.deleteMeetingLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message || "Meeting deleted successfully",
            duration: 2,
          });
        }
      })
      .addCase(deleteMeetingAction.rejected, (state, action) => {
        state.deleteMeetingLoading = false;
        state.deleteMeetingError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to delete meeting",
          duration: 2,
        });
      })

      // Fetch meeting tags cases
      .addCase(fetchMeetingTags.pending, (state) => {
        state.meetingTagsLoading = true;
        state.meetingTagsError = null;
      })
      .addCase(fetchMeetingTags.fulfilled, (state, action) => {
        state.meetingTagsLoading = false;
        state.meetingTags = action.payload;
        // if (action?.payload?.meta?.success !== true) {
        //   notification.error({
        //     message: "Error",
        //     description: action?.payload?.meta?.message,
        //     duration: 2,
        //   });
        // }
      })
      .addCase(fetchMeetingTags.rejected, (state, action) => {
        state.meetingTagsLoading = false;
        state.meetingTagsError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch meeting tags",
          duration: 2,
        });
      })

      .addCase(getGuestList.pending, (state) => {
        state.guestLoading = true;
        state.guestError = null;
      })
      .addCase(getGuestList.fulfilled, (state, action) => {
        state.guestLoading = false;
        state.guest = action.payload;
        // if (action?.payload?.meta?.success !== true) {
        //   notification.error({
        //     message: "Error",
        //     description: action?.payload?.meta?.message,
        //     duration: 2,
        //   });
        // }
      })
      .addCase(getGuestList.rejected, (state, action) => {
        state.guestLoading = false;
        state.guestError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch meeting tags",
          duration: 2,
        });
      })
      .addCase(fetchMeetingCalendarForMini.pending, (state) => {
        state.meetingCalendarLoadingMini = true;
        state.meetingCalendarErrorMini = null;
      })
      .addCase(fetchMeetingCalendarForMini.fulfilled, (state, action) => {
        state.meetingCalendarLoadingMini = false;
        state.meetingCalendarMini = action.payload;
        // if (action?.payload?.meta?.success !== true) {
        //   notification.error({
        //     message: "Error",
        //     description: action?.payload?.meta?.message,
        //     duration: 2,
        //   });
        // }
      })
      .addCase(fetchMeetingCalendarForMini.rejected, (state, action) => {
        state.meetingCalendarLoadingMini = false;
        state.meetingCalendarErrorMini = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message ||
            "Failed to fetch meeting calendar",
          duration: 2,
        });
      });
  },
});
export const { clearGuest } = meetingsSlice.actions;
export default meetingsSlice.reducer;
