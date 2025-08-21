import { get, post } from "../../utils/apiWrapper";

// GET API for contract processor friend requests
export const getContractProcessorRequests = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/friend-request/user-list`, config);
};

export const sendFriendRequest = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/friend-request/send`, config);
};

export const getContractProcessorRequestsForMyConnection = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/friend-request/user-list`, config);
};

// POST API for toggling like status
export const toggleLikeStatus = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/friend-request/toggle-like`, config);
};

// GET API for favorites list
export const getFavoritesList = async (params) => {
  const config = {
    params: {
      ...params,
      // This parameter indicates we want only favorites
    },
  };
  return await get(`/friend-request/user-list`, config);
};


export const getContractProcessorUserDetails = async (id) => {
  return await get(`/cp-user/details/${id}`);
};


// POST API for rating a user
export const rateContractProcessor = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/rating/rate`, config);
};


export const loanType = async (id) => {
  return await get(`/rating/loan-type-list`);
};

export const toggleBlockUnblock=async(data)=>{
  const config = {
    data: data,
  };
  return post(`/friend-request/respond`, config)
}

// GET API for fetching friend requests
export const getFriendRequests = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/friend-request/get`, config);
};

// POST API for responding to friend request
export const respondToFriendRequest = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/friend-request/respond`, config);
};
