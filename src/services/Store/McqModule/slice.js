import { createSlice } from "@reduxjs/toolkit";
import { notification } from "antd";
import {
  addMcq,
  deleteMcqsById,
  fetchMcqById,
  fetchMcqVideos,
  trackMcqViewsAction,
  updateMcqAction,
} from "./action";

const initialState = {
  mcqVideos: [],
  mcqVideosLoading: false,
  mcqVideosError: null,

  mcqDetail: {},
  mcqDetailLoading: false,
  mcqDetailError: null,

  mcqItem: {},
  mcqCreationLoading: false,
  mcqCreationError: null,

  mcqUpdateItem: {},
  mcqUpdateLoading: false,
  mcqUpdateError: null,

  mcqViewTracking: {},
  mcqViewTrackingLoading: false,
  mcqViewTrackingError: null,

  mcqDeleteDetail: {},
  mcqDeleteDetailLoading: false,
  mcqDeleteDetailError: null,
};

const mcqVideosSlice = createSlice({
  name: "mcqVideos",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch MCQ videos cases
      .addCase(fetchMcqVideos.pending, (state) => {
        state.mcqVideosLoading = true;
        state.mcqVideosError = null;
      })
      .addCase(fetchMcqVideos.fulfilled, (state, action) => {
        state.mcqVideosLoading = false;
        state.mcqVideos = action.payload;
      
      })
      .addCase(fetchMcqVideos.rejected, (state, action) => {
        state.mcqVideosLoading = false;
        state.mcqVideosError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch MCQ videos",
          duration: 2,
        });
      });

    builder
      // Fetch MCQ detail cases
      .addCase(fetchMcqById.pending, (state) => {
        state.mcqDetailLoading = true;
        state.mcqDetailError = null;
      })
      .addCase(fetchMcqById.fulfilled, (state, action) => {
        state.mcqDetailLoading = false;
        state.mcqDetail = action.payload;
        
      })
      .addCase(fetchMcqById.rejected, (state, action) => {
        state.mcqDetailLoading = false;
        state.mcqDetailError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch MCQ details",
          duration: 2,
        });
      });

    builder
      // Create MCQ cases
      .addCase(addMcq.pending, (state) => {
        state.mcqCreationLoading = true;
        state.mcqCreationError = null;
      })
      .addCase(addMcq.fulfilled, (state, action) => {
        state.mcqItem = action.payload;
        state.mcqCreationLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message || "MCQ created successfully",
            duration: 2,
          });
        }
      })
      .addCase(addMcq.rejected, (state, action) => {
        state.mcqCreationLoading = false;
        state.mcqCreationError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to create MCQ",
          duration: 2,
        });
      });

    builder
      .addCase(updateMcqAction.pending, (state) => {
        state.mcqUpdateLoading = true;
        state.mcqUpdateError = null;
      })
      .addCase(updateMcqAction.fulfilled, (state, action) => {
        state.mcqUpdateItem = action.payload;
        state.mcqUpdateLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message || "MCQ updated successfully",
            duration: 2,
          });
        }
      })
      .addCase(updateMcqAction.rejected, (state, action) => {
        state.mcqUpdateLoading = false;
        state.mcqUpdateError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to update MCQ",
          duration: 2,
        });
      });

    builder
      // Track MCQ views cases
      .addCase(trackMcqViewsAction.pending, (state) => {
        state.mcqViewTrackingLoading = true;
        state.mcqViewTrackingError = null;
      })
      .addCase(trackMcqViewsAction.fulfilled, (state, action) => {
        state.mcqViewTrackingLoading = false;
        state.mcqViewTracking = action.payload;
        if (action?.payload?.meta?.status === 200) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message || "View tracked successfully",
            duration: 2,
          });
        }
      })
      .addCase(trackMcqViewsAction.rejected, (state, action) => {
        state.mcqViewTrackingLoading = false;
        state.mcqViewTrackingError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to track view",
          duration: 2,
        });
      });

    builder
      // Track MCQ views cases
      .addCase(deleteMcqsById.pending, (state) => {
        state.mcqDeleteDetailLoading = true;
        state.mcqDeleteDetailError = null;
      })
      .addCase(deleteMcqsById.fulfilled, (state, action) => {
        state.mcqDeleteDetailLoading = false;
        state.mcqDeleteDetail = action.payload;
        if (action?.payload?.meta?.status === 200) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message || "View tracked successfully",
            duration: 2,
          });
        }
      })
      .addCase(deleteMcqsById.rejected, (state, action) => {
        state.mcqDeleteDetailLoading = false;
        state.mcqDeleteDetailError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to track view",
          duration: 2,
        });
      });
  },
});

export default mcqVideosSlice.reducer;
