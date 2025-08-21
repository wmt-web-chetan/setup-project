import { createSlice } from "@reduxjs/toolkit";
import { notification } from "antd";
import {
  addCoachingProgram,
  fetchCoachingProgramById,
  fetchCoachingPrograms,
  updateCoachingProgramAction,
} from "./action";

const initialState = {
  coachingPrograms: [],
  coachingProgramsLoading: false,
  coachingProgramsError: null,

  createCoachingProgram: {},
  createCoachingProgramLoading: false,
  createCoachingProgramError: null,

  singleCoachingProgram: {},
  singleCoachingProgramLoading: false,
  singleCoachingProgramError: null,

  updateCoachingProgram: {},
  updateCoachingProgramLoading: false,
  updateCoachingProgramError: null,
};

const coachingProgramsSlice = createSlice({
  name: "coachingPrograms",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch coaching programs cases
      .addCase(fetchCoachingPrograms.pending, (state) => {
        state.coachingProgramsLoading = true;
        state.coachingProgramsError = null;
      })
      .addCase(fetchCoachingPrograms.fulfilled, (state, action) => {
        state.coachingProgramsLoading = false;
        state.coachingPrograms = action.payload;
        // if (action?.payload?.meta?.success !== true) {
        //   notification.error({
        //     message: "Error",
        //     description: action?.payload?.meta?.message,
        //     duration: 2,
        //   });
        // }
      })
      .addCase(fetchCoachingPrograms.rejected, (state, action) => {
        state.coachingProgramsLoading = false;
        state.coachingProgramsError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message ||
            "Failed to fetch coaching programs",
          duration: 2,
        });
      });

    builder

      .addCase(addCoachingProgram.pending, (state) => {
        state.createCoachingProgramLoading = true;
        state.createCoachingProgramError = null;
      })
      .addCase(addCoachingProgram.fulfilled, (state, action) => {
        state.createCoachingProgram = action.payload;
        state.createCoachingProgramLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        }
      })
      .addCase(addCoachingProgram.rejected, (state, action) => {
        state.createCoachingProgramLoading = false;
        state.createCoachingProgramError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message ||
            "Failed to create coaching program",
          duration: 2,
        });
      });

    builder
      .addCase(fetchCoachingProgramById.pending, (state) => {
        state.singleCoachingProgramLoading = true;
        state.singleCoachingProgramError = null;
      })
      .addCase(fetchCoachingProgramById.fulfilled, (state, action) => {
        state.singleCoachingProgramLoading = false;
        state.singleCoachingProgram = action.payload;
      })
      .addCase(fetchCoachingProgramById.rejected, (state, action) => {
        state.singleCoachingProgramLoading = false;
        state.singleCoachingProgramError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message ||
            "Failed to fetch coaching program",
          duration: 2,
        });
      });

    builder

      .addCase(updateCoachingProgramAction.pending, (state) => {
        state.updateCoachingProgramLoading = true;
        state.updateCoachingProgramError = null;
      })
      .addCase(updateCoachingProgramAction.fulfilled, (state, action) => {
        state.updateCoachingProgram = action.payload;
        state.updateCoachingProgramLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        }
      })
      .addCase(updateCoachingProgramAction.rejected, (state, action) => {
        state.updateCoachingProgramLoading = false;
        state.updateCoachingProgramError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message ||
            "Failed to update coaching program",
          duration: 2,
        });
      });
  },
});

export default coachingProgramsSlice.reducer;
