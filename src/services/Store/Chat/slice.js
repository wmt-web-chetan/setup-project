import { createSlice } from "@reduxjs/toolkit";
import { notification } from "antd";
import {
  fetchChatMessageDetailsAction,
  fetchUserChatTable,
  sendChatMessageAction,
  fetchChatList,
  fetchChatRoomList,
  leaveChatRoomAction,
  addChatRoom,
  updateChatRoomAction,
  removeChatRoom,
  fetchChatRoomDetails,
  fetchUserMediaDetails,
  addChatRoomParticipantsAction,
  fetchMeetings,
  fetchDownloadFile,
} from "./action";

const initialState = {
  chatTableData: [],
  chatTableLoading: false,
  chatTableError: null,

  messageDetails: {},
  messageDetailsLoading: false,
  messageDetailsError: null,

  chatMessage: {},
  chatMessageLoading: false,
  chatMessageError: null,

  chatList: [],
  chatListLoading: false,
  chatListError: null,

  chatRooms: [],
  chatRoomsLoading: false,
  chatRoomsError: null,

  chatRoomLeave: {},
  chatRoomLeaveLoading: false,
  chatRoomLeaveError: null,

  newChatRoom: {},
  newChatRoomLoading: false,
  newChatRoomError: null,

  chatRoomUpdate: {},
  chatRoomUpdateLoading: false,
  chatRoomUpdateError: null,

  deleteChatRoom: {},
  deleteChatRoomLoading: false,
  deleteChatRoomError: null,

  chatRoomDetails: {},
  chatRoomDetailsLoading: false,
  chatRoomDetailsError: null,

  roomParticipants: {},
  roomParticipantsLoading: false,
  roomParticipantsError: null,

  meetings: [],
  meetingsLoading: false,
  meetingsError: null,

  downloadFile: {},
  downloadFileLoading: false,
  downloadFileError: null,
};

const userChatTableSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch user chat table cases
      .addCase(fetchUserChatTable.pending, (state) => {
        state.chatTableLoading = true;
        state.chatTableError = null;
      })
      .addCase(fetchUserChatTable.fulfilled, (state, action) => {
        state.chatTableLoading = false;
        state.chatTableData = action.payload;
        
      })
      .addCase(fetchUserChatTable.rejected, (state, action) => {
        state.chatTableLoading = false;
        state.chatTableError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch chat table data",
          duration: 2,
        });
      });

    builder
      // Fetch chat list cases
      .addCase(fetchChatList.pending, (state) => {
        state.chatListLoading = true;
        state.chatListError = null;
      })
      .addCase(fetchChatList.fulfilled, (state, action) => {
        state.chatListLoading = false;
        state.chatList = action.payload;

      })
      .addCase(fetchChatList.rejected, (state, action) => {
        state.chatListLoading = false;
        state.chatListError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch chat list",
          duration: 2,
        });
      });

    builder
      // Fetch message details cases
      .addCase(fetchChatMessageDetailsAction.pending, (state) => {
        state.messageDetailsLoading = true;
        state.messageDetailsError = null;
      })
      .addCase(fetchChatMessageDetailsAction.fulfilled, (state, action) => {
        state.messageDetails = action.payload;
        state.messageDetailsLoading = false;
      })
      .addCase(fetchChatMessageDetailsAction.rejected, (state, action) => {
        state.messageDetailsLoading = false;
        state.messageDetailsError = action.payload;
        // notification.error({
        //   message: "Error",
        //   description:
        //     action?.payload?.meta?.message || "Failed to fetch message details",
        //   duration: 2,
        // });
      });

    builder
      // Send chat message cases
      .addCase(sendChatMessageAction.pending, (state) => {
        state.chatMessageLoading = true;
        state.chatMessageError = null;
      })
      .addCase(sendChatMessageAction.fulfilled, (state, action) => {
        state.chatMessage = action.payload;
        state.chatMessageLoading = false;
        // if (action?.payload?.meta?.success === true) {
        //   notification.success({
        //     message: "Success",
        //     description:
        //       action?.payload?.meta?.message || "Message sent successfully",
        //     duration: 2,
        //   });
        // } else {
        //   notification.error({
        //     message: "Error",
        //     description: action?.payload?.meta?.message,
        //     duration: 2,
        //   });
        // }
      })
      .addCase(sendChatMessageAction.rejected, (state, action) => {
        state.chatMessageLoading = false;
        state.chatMessageError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to send message",
          duration: 2,
        });
      });
    builder
      // Fetch chat room list cases
      .addCase(fetchChatRoomList.pending, (state) => {
        state.chatRoomsLoading = true;
        state.chatRoomsError = null;
      })
      .addCase(fetchChatRoomList.fulfilled, (state, action) => {
        state.chatRoomsLoading = false;
        state.chatRooms = action.payload;
      })
      .addCase(fetchChatRoomList.rejected, (state, action) => {
        state.chatRoomsLoading = false;
        state.chatRoomsError = action.payload;
        // notification.error({
        //   message: "Error",
        //   description:
        //     action?.payload?.meta?.message || "Failed to fetch chat rooms",
        //   duration: 2,
        // });
      });

    builder
      // Leave chat room cases
      .addCase(leaveChatRoomAction.pending, (state) => {
        state.chatRoomLeaveLoading = true;
        state.chatRoomLeaveError = null;
      })
      .addCase(leaveChatRoomAction.fulfilled, (state, action) => {
        state.chatRoomLeaveLoading = false;
        state.chatRoomLeave = action.payload;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message || "Left chat room successfully",
            duration: 2,
          });
        }
      })
      .addCase(leaveChatRoomAction.rejected, (state, action) => {
        state.chatRoomLeaveLoading = false;
        state.chatRoomLeaveError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to leave chat room",
          duration: 2,
        });
      });

    builder
      // Create chat room cases
      .addCase(addChatRoom.pending, (state) => {
        state.newChatRoomLoading = true;
        state.newChatRoomError = null;
      })
      .addCase(addChatRoom.fulfilled, (state, action) => {
        state.newChatRoom = action.payload;
        state.newChatRoomLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message ||
              "Chat room created successfully",
            duration: 2,
          });
        }
      })
      .addCase(addChatRoom.rejected, (state, action) => {
        state.newChatRoomLoading = false;
        state.newChatRoomError = action.payload;
      });

    builder
      // Update chat room cases
      .addCase(updateChatRoomAction.pending, (state) => {
        state.chatRoomUpdateLoading = true;
        state.chatRoomUpdateError = null;
      })
      .addCase(updateChatRoomAction.fulfilled, (state, action) => {
        state.chatRoomUpdate = action.payload;
        state.chatRoomUpdateLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        }
      })
      .addCase(updateChatRoomAction.rejected, (state, action) => {
        state.chatRoomUpdateLoading = false;
        state.chatRoomUpdateError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to update chat room",
          duration: 2,
        });
      });

    builder
      // Delete chat room cases
      .addCase(removeChatRoom.pending, (state) => {
        state.deleteChatRoomLoading = true;
        state.deleteChatRoomError = null;
      })
      .addCase(removeChatRoom.fulfilled, (state, action) => {
        state.deleteChatRoom = action.payload;
        state.deleteChatRoomLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message ||
              "Chat room deleted successfully",
            duration: 2,
          });
        }
      })
      .addCase(removeChatRoom.rejected, (state, action) => {
        state.deleteChatRoomLoading = false;
        state.deleteChatRoomError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to delete chat room",
          duration: 2,
        });
      });
    builder
      // Fetch chat room details cases
      .addCase(fetchChatRoomDetails.pending, (state) => {
        state.chatRoomDetailsLoading = true;
        state.chatRoomDetailsError = null;
      })
      .addCase(fetchChatRoomDetails.fulfilled, (state, action) => {
        state.chatRoomDetailsLoading = false;
        state.chatRoomDetails = action?.payload;
        // if (action?.payload?.meta?.success !== true) {
        //   notification.error({
        //     message: "Error",
        //     description: action?.payload?.meta?.message,
        //     duration: 2,
        //   });
        // }
      })
      .addCase(fetchChatRoomDetails.rejected, (state, action) => {
        state.chatRoomDetailsLoading = false;
        state.chatRoomDetailsError = action?.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message ||
            "Failed to fetch chat room details",
          duration: 2,
        });
      });

    builder
      // Fetch user media details cases
      .addCase(fetchUserMediaDetails.pending, (state) => {
        state.userMediaDetailsLoading = true;
        state.userMediaDetailsError = null;
      })
      .addCase(fetchUserMediaDetails.fulfilled, (state, action) => {
        state.userMediaDetailsLoading = false;
        state.userMediaDetails = action.payload;
        // if (action?.payload?.meta?.success === true) {
        //   notification.success({
        //     message: "Success",
        //     description: action?.payload?.meta?.message,
        //     duration: 2,
        //   });
        // }
      })
      .addCase(fetchUserMediaDetails.rejected, (state, action) => {
        state.userMediaDetailsLoading = false;
        state.userMediaDetailsError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message ||
            "Failed to fetch user media details",
          duration: 2,
        });
      });

    builder
      // Add chat room participants cases
      .addCase(addChatRoomParticipantsAction.pending, (state) => {
        state.roomParticipantsLoading = true;
        state.roomParticipantsError = null;
      })
      .addCase(addChatRoomParticipantsAction.fulfilled, (state, action) => {
        state.roomParticipants = action.payload;
        state.roomParticipantsLoading = false;
        // if (action?.payload?.meta?.success === true) {
        //   notification.success({
        //     message: "Success",
        //     description:
        //       action?.payload?.meta?.message ||
        //       "Participants added successfully",
        //     duration: 2,
        //   });
        // }
      })
      .addCase(addChatRoomParticipantsAction.rejected, (state, action) => {
        state.roomParticipantsLoading = false;
        state.roomParticipantsError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to add participants",
          duration: 2,
        });
      });

      builder
      // Fetch meetings list cases
      .addCase(fetchMeetings.pending, (state) => {
        state.meetingsLoading = true;
        state.meetingsError = null;
      })
      .addCase(fetchMeetings.fulfilled, (state, action) => {
        state.meetingsLoading = false;
        state.meetings = action.payload;
      
      })
      .addCase(fetchMeetings.rejected, (state, action) => {
        state.meetingsLoading = false;
        state.meetingsError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to fetch meetings",
          duration: 2,
        });
      });

      builder
      // Download file cases
      .addCase(fetchDownloadFile.pending, (state) => {
        state.downloadFileLoading = true;
        state.downloadFileError = null;
      })
      .addCase(fetchDownloadFile.fulfilled, (state, action) => {
        state.downloadFileLoading = false;
        state.downloadFile = action.payload;
        // if (action?.payload?.meta?.success === true) {
        //   notification.success({
        //     message: "Success",
        //     description: action?.payload?.meta?.message || "File downloaded successfully",
        //     duration: 2,
        //   });
        // } else {
        //   notification.error({
        //     message: "Error",
        //     description: action?.payload?.meta?.message,
        //     duration: 2,
        //   });
        // }
      })
      .addCase(fetchDownloadFile.rejected, (state, action) => {
        state.downloadFileLoading = false;
        state.downloadFileError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to download file",
          duration: 2,
        });
      });
  },
});

export default userChatTableSlice.reducer;
