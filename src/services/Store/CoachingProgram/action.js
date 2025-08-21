import { createAsyncThunk } from "@reduxjs/toolkit";
import { createCoachingProgram, getCoachingProgramById, getCoachingPrograms, updateCoachingProgram } from "../../Apis/coachingProgram";

// Thunk action for getting coaching programs
export const fetchCoachingPrograms = createAsyncThunk(
  "coachingPrograms/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getCoachingPrograms(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const addCoachingProgram = createAsyncThunk(
    "coachingPrograms/create",
    async (data, { rejectWithValue }) => {
      try {
        const response = await createCoachingProgram(data);
        return response;
      } catch (error) {
        return rejectWithValue(error.response.data);
      }
    }
  );

  export const fetchCoachingProgramById = createAsyncThunk(
    "coachingPrograms/fetchById",
    async (id, { rejectWithValue }) => {
      try {
        const response = await getCoachingProgramById(id);
        return response;
      } catch (error) {
        return rejectWithValue(error.response.data);
      }
    }
  );

  export const updateCoachingProgramAction = createAsyncThunk(
    "coachingPrograms/update",
    async (data, { rejectWithValue }) => {
      try {
        const response = await updateCoachingProgram(data);
        return response;
      } catch (error) {
        return rejectWithValue(error.response.data);
      }
    }
  );