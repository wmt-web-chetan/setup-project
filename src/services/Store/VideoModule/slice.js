import { createSlice } from "@reduxjs/toolkit";
import { notification } from "antd";
import {
  addVimeoVideo,
  EditVimeoVideo,
  endVimeoEventAction,
  fetchVimeoVideos,
  RemoveVimeoVideo,
  storeVimeoEventAction,
} from "./action";

const initialState = {
  videos: [],
  videosLoading: false,
  videosError: null,

  // Store event states
  storeEvent: {},
  storeEventLoading: false,
  storeEventError: null,

  // End event states
  endEvent: {},
  endEventLoading: false,
  endEventError: null,

  addVideoVimeoData: [],
  addVideoVimeoLoading: false,
  addVideoVimeoError: null,

  editVideoVimeoData: [],
  editVideoVimeoLoading: false,
  editVideoVimeoError: null,

  removeVideoVimeoData: [],
  removeVideoVimeoLoading: false,
  removeVideoVimeoError: null,
};

const vimeoSlice = createSlice({
  name: "vimeoVideos",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Vimeo videos cases
      .addCase(fetchVimeoVideos.pending, (state) => {
        state.videosLoading = true;
        state.videosError = null;
      })
      .addCase(fetchVimeoVideos.fulfilled, (state, action) => {
        state.videosLoading = false;
        state.videos = action.payload;
      
      })
      .addCase(fetchVimeoVideos.rejected, (state, action) => {
        state.videosLoading = false;
        state.videosError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch Vimeo videos",
          duration: 2,
        });
      });

    builder
      // Store Vimeo event cases
      .addCase(storeVimeoEventAction.pending, (state) => {
        state.storeEventLoading = true;
        state.storeEventError = null;
      })
      .addCase(storeVimeoEventAction.fulfilled, (state, action) => {
        state.storeEvent = action.payload;
        state.storeEventLoading = false;
      })
      .addCase(storeVimeoEventAction.rejected, (state, action) => {
        state.storeEventLoading = false;
        state.storeEventError = action.payload;
        // notification.error({
        //   message: "Error",
        //   description:
        //     action?.payload?.meta?.message || "Failed to store event",
        //   duration: 2,
        // });
      });

    builder
      // End Vimeo event cases
      .addCase(endVimeoEventAction.pending, (state) => {
        state.endEventLoading = true;
        state.endEventError = null;
      })
      .addCase(endVimeoEventAction.fulfilled, (state, action) => {
        state.endEvent = action.payload;
        state.endEventLoading = false;
        if (action?.payload?.meta?.status === 200) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message || "Event ended successfully",
            duration: 2,
          });
        } 
      })
      .addCase(endVimeoEventAction.rejected, (state, action) => {
        state.endEventLoading = false;
        state.endEventError = action.payload;
        // notification.error({
        //   message: "Error",
        //   description: action?.payload?.meta?.message || "Failed to end event",
        //   duration: 2,
        // });
      });

    builder
      // End Vimeo event cases
      .addCase(addVimeoVideo.pending, (state) => {
        state.addVideoVimeoLoading = true;
        state.addVideoVimeoError = null;
      })
      .addCase(addVimeoVideo.fulfilled, (state, action) => {
        state.addVideoVimeoData = action.payload;
        state.addVideoVimeoLoading = false;
        if (action?.payload?.meta?.success === true) {
          // notification.success({
          //   message: "Success",
          //   description:
          //     action?.payload?.meta?.message || "Event ended successfully",
          //   duration: 100,
          // });
        }
      })
      .addCase(addVimeoVideo.rejected, (state, action) => {
        state.addVideoVimeoLoading = false;
        state.addVideoVimeoError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to end event",
          duration: 2,
        });
      });

    builder
      // End Vimeo event cases
      .addCase(EditVimeoVideo.pending, (state) => {
        state.editVideoVimeoLoading = true;
        state.editVideoVimeoError = null;
      })
      .addCase(EditVimeoVideo.fulfilled, (state, action) => {
        state.editVideoVimeoData = action.payload;
        state.editVideoVimeoLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message || "Event ended successfully",
            duration: 2,
          });
        } 
      })
      .addCase(EditVimeoVideo.rejected, (state, action) => {
        state.editVideoVimeoLoading = false;
        state.editVideoVimeoError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to end event",
          duration: 2,
        });
      });

    builder
      // End Vimeo event cases
      .addCase(RemoveVimeoVideo.pending, (state) => {
        state.removeVideoVimeoLoading = true;
        state.endEventError = null;
      })
      .addCase(RemoveVimeoVideo.fulfilled, (state, action) => {
        state.removeVideoVimeoData = action.payload;
        state.removeVideoVimeoError = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message || "Event ended successfully",
            duration: 2,
          });
        } 
      })
      .addCase(RemoveVimeoVideo.rejected, (state, action) => {
        state.removeVideoVimeoLoading = false;
        state.removeVideoVimeoError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to end event",
          duration: 2,
        });
      });
  },
});

export default vimeoSlice.reducer;
