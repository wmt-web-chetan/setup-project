import { createAsyncThunk } from "@reduxjs/toolkit";
import { 
  getContractProcessorRequests, 
  sendFriendRequest,
  getContractProcessorRequestsForMyConnection,
  toggleLikeStatus,
  getFavoritesList,
  getContractProcessorUserDetails,
  rateContractProcessor,
  loanType,
  toggleBlockUnblock,
  getFriendRequests,
  respondToFriendRequest
} from "../../Apis/contractprocessor";

// Thunk action for getting contract processor requests
export const fetchContractProcessorRequests = createAsyncThunk(
  "contractProcessor/fetchRequests",
  async (params = { page: 1 }, { rejectWithValue }) => {
    try {
      const response = await getContractProcessorRequests(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for sending a friend request
export const sendFriendRequestAction = createAsyncThunk(
  "contractProcessor/sendFriendRequest",
  async (data, { rejectWithValue }) => {
    try {
      const response = await sendFriendRequest(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const fetchContractProcessorRequestsForMyConnection = createAsyncThunk(
  "contractProcessor/fetchRequestsForMyConnection",
  async (params = { page: 1 }, { rejectWithValue }) => {
    try {
      const response = await getContractProcessorRequestsForMyConnection(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for toggling like status
export const toggleLikeStatusAction = createAsyncThunk(
  "contractProcessor/toggleLike",
  async (data, { rejectWithValue }) => {
    try {
      const response = await toggleLikeStatus(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for getting favorites list
export const fetchFavoritesList = createAsyncThunk(
  "contractProcessor/fetchFavorites",
  async (params = { page: 1 }, { rejectWithValue }) => {
    try {
      const response = await getFavoritesList(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for getting contract processor user details
export const fetchContractProcessorUserDetails = createAsyncThunk(
  "contractProcessor/fetchUserDetails",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getContractProcessorUserDetails(id);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for rating a contract processor
export const rateContractProcessorAction = createAsyncThunk(
  "contractProcessor/rateUser",
  async (data, { rejectWithValue }) => {
    try {
      const response = await rateContractProcessor(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);


export const fetchLoanType = createAsyncThunk(
  "contractProcessor/loanType",
  async (_, { rejectWithValue }) => {
    try {
      const response = await loanType();
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const toggleBlockUnblockAction=createAsyncThunk(
  "contractProcessor/toggleBlockUnblock",
  async (data, { rejectWithValue }) => {
    try {
      const response = await toggleBlockUnblock(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);


export const toggleBlockUnblockContractProcessorAction=createAsyncThunk(
  "contractProcessor/toggleBlockUnblockContract",
  async (data, { rejectWithValue }) => {
    try {
      const response = await toggleBlockUnblock(data);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data);
    }
  }
);

// Thunk action for getting friend requests
export const fetchFriendRequests = createAsyncThunk(
  "friendRequests/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getFriendRequests(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Thunk action for responding to friend request
export const respondToFriendRequestAction = createAsyncThunk(
  "friendRequest/respond",
  async (data, { rejectWithValue }) => {
    try {
      const response = await respondToFriendRequest(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);