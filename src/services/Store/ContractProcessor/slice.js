// src/redux/contractProcessor/slice.js
import { createSlice } from "@reduxjs/toolkit";
import { notification } from "antd";
import {
  fetchContractProcessorRequests,
  sendFriendRequestAction,
  fetchContractProcessorRequestsForMyConnection,
  toggleLikeStatusAction,
  fetchFavoritesList,
  fetchContractProcessorUserDetails,
  rateContractProcessorAction,
  fetchLoanType,
  toggleBlockUnblockAction,
  toggleBlockUnblockContractProcessorAction,
  fetchFriendRequests,
  respondToFriendRequestAction,
} from "./actions";

const initialState = {
  contractProcessorRequests: {
    data: {
      users: [],
      pagination: {
        currentPage: 1,
        totalPage: 1,
        perPage: 10,
        totalRecords: 0,
      },
    },
  },
  contractProcessorRequestsLoading: false,
  contractProcessorRequestsError: null,
  isLoadingMore: false,

  sendFriendRequest: {},
  sendFriendRequestLoading: false,
  sendFriendRequestError: null,

  contractProcessorRequestsForMyConnection: {
    data: {
      users: [],
      like_count: 0,
      pagination: {
        currentPage: 1,
        totalPage: 1,
        perPage: 10,
        totalRecords: 0,
      },
    },
  },
  contractProcessorRequestsLoadingForMyConnection: false,
  contractProcessorRequestsErrorForMyConnection: null,
  isLoadingMoreForMyConnection: false,

  toggleLike: {},
  toggleLikeLoading: false,
  toggleLikeError: null,

  favoritesList: {
    data: {
      users: [],
      pagination: {
        currentPage: 1,
        totalPage: 1,
        perPage: 10,
        totalRecords: 0,
      },
    },
  },
  favoritesListLoading: false,
  favoritesListError: null,
  isLoadingMoreFavorites: false,

  contractProcessorUserDetails: {},
  contractProcessorUserDetailsLoading: false,
  contractProcessorUserDetailsError: null,

  contractProcessorRating: {},
  contractProcessorRatingLoading: false,
  contractProcessorRatingError: null,

  loanType: {},
  loanTypeLoading: false,
  loanTypeError: null,

  toggleBlockUnblock: {},
  toggleLoading: false,
  toggleError: null,

  friendRequests: [],
  friendRequestsLoading: false,
  friendRequestsError: null,

  respondFriendRequest: {},
  respondFriendRequestLoading: false,
  respondFriendRequestError: null,
};

const contractProcessorSlice = createSlice({
  name: "contractProcessor",
  initialState,
  reducers: {
    // Action to clear contract processor user details
    clearContractProcessorUserDetails: (state) => {
      state.contractProcessorUserDetails = {};
      state.contractProcessorUserDetailsLoading = false;
      state.contractProcessorUserDetailsError = null;
    },
    // Additional helper action to reset all user details related state
    resetUserDetailsState: (state) => {
      state.contractProcessorUserDetails = {};
      state.contractProcessorUserDetailsLoading = false;
      state.contractProcessorUserDetailsError = null;
      state.contractProcessorRating = {};
      state.contractProcessorRatingLoading = false;
      state.contractProcessorRatingError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch contract processor requests cases
      .addCase(fetchContractProcessorRequests.pending, (state, action) => {
        // Check if we're loading more data (page > 1) or initial load
        const isLoadingMore = action.meta.arg?.page > 1;

        if (isLoadingMore) {
          state.isLoadingMore = true;
        } else {
          state.contractProcessorRequestsLoading = true;
        }
        state.contractProcessorRequestsError = null;
      })
      .addCase(fetchContractProcessorRequests.fulfilled, (state, action) => {
        const isLoadingMore = action.meta.arg?.page > 1;

        if (isLoadingMore) {
          // Append new users to existing list
          if (
            state.contractProcessorRequests?.data?.users &&
            action.payload?.data?.users
          ) {
            state.contractProcessorRequests.data.users = [
              ...state.contractProcessorRequests.data.users,
              ...action.payload.data.users,
            ];
          }
          // Update pagination
          if (action.payload?.data?.pagination) {
            state.contractProcessorRequests.data.pagination =
              action.payload.data.pagination;
          }
          state.isLoadingMore = false;
        } else {
          // Initial load or refresh
          state.contractProcessorRequestsLoading = false;
          state.contractProcessorRequests = action.payload;
        }

        if (action?.payload?.meta?.success !== true) {
          notification.error({
            message: "Error",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        }
      })
      .addCase(fetchContractProcessorRequests.rejected, (state, action) => {
        const isLoadingMore = action.meta.arg?.page > 1;

        if (isLoadingMore) {
          state.isLoadingMore = false;
        } else {
          state.contractProcessorRequestsLoading = false;
        }
        state.contractProcessorRequestsError = action?.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch requests",
          duration: 2,
        });
      })
      .addCase(sendFriendRequestAction.pending, (state) => {
        state.sendFriendRequestLoading = true;
        state.sendFriendRequestError = null;
      })
      .addCase(sendFriendRequestAction.fulfilled, (state, action) => {
        state.sendFriendRequest = action.payload;
        state.sendFriendRequestLoading = false;
        if (state.contractProcessorRequests?.data?.users) {
          state.contractProcessorRequests.data.users =
            state.contractProcessorRequests.data.users.map((user) => {
              if (
                user.id === action.payload?.data?.friend_request?.receiver_id
              ) {
                return {
                  ...user,
                  friend_status: {
                    ...user.friend_status,
                    is_sent_by_me: true,
                  },
                };
              }
              return user;
            });
        }
      })
      .addCase(sendFriendRequestAction.rejected, (state, action) => {
        state.sendFriendRequestLoading = false;
        state.sendFriendRequestError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to send friend request",
          duration: 2,
        });
      })
      .addCase(
        fetchContractProcessorRequestsForMyConnection.pending,
        (state, action) => {
          // Check if we're loading more data (page > 1) or initial load
          const isLoadingMore = action.meta.arg?.page > 1;

          if (isLoadingMore) {
            state.isLoadingMoreForMyConnection = true;
          } else {
            state.contractProcessorRequestsLoadingForMyConnection = true;
          }
          state.contractProcessorRequestsErrorForMyConnection = null;
        }
      )
      .addCase(
        fetchContractProcessorRequestsForMyConnection.fulfilled,
        (state, action) => {
          const isLoadingMore = action.meta.arg?.page > 1;

          if (isLoadingMore) {
            // Append new users to existing list
            if (
              state.contractProcessorRequestsForMyConnection?.data?.users &&
              action.payload?.data?.users
            ) {
              state.contractProcessorRequestsForMyConnection.data.users = [
                ...state.contractProcessorRequestsForMyConnection.data.users,
                ...action.payload.data.users,
              ];
            }
            // Update pagination
            if (action.payload?.data?.pagination) {
              state.contractProcessorRequestsForMyConnection.data.pagination =
                action.payload.data.pagination;
            }
            state.isLoadingMoreForMyConnection = false;
          } else {
            // Initial load or refresh
            state.contractProcessorRequestsLoadingForMyConnection = false;
            state.contractProcessorRequestsForMyConnection = action.payload;
          }

          
        }
      )
      .addCase(
        fetchContractProcessorRequestsForMyConnection.rejected,
        (state, action) => {
          const isLoadingMore = action.meta.arg?.page > 1;

          if (isLoadingMore) {
            state.isLoadingMoreForMyConnection = false;
          } else {
            state.contractProcessorRequestsLoadingForMyConnection = false;
          }
          state.contractProcessorRequestsErrorForMyConnection = action?.payload;
          notification.error({
            message: "Error",
            description:
              action?.payload?.meta?.message || "Failed to fetch connections",
            duration: 2,
          });
        }
      )
      // Add these cases to your extraReducers
      .addCase(toggleLikeStatusAction.pending, (state) => {
        state.toggleLikeLoading = true;
        state.toggleLikeError = null;
      })
      .addCase(toggleLikeStatusAction.fulfilled, (state, action) => {
        state.toggleLike = action.payload;
        state.toggleLikeLoading = false;

        // Update user in the main list if exists
        if (
          state.contractProcessorRequests?.data?.users &&
          action.payload?.data?.friend_request?.id
        ) {
          state.contractProcessorRequests.data.users =
            state.contractProcessorRequests.data.users.map((user) => {
              if (user.id === action.payload.data.friend_request.id) {
                return {
                  ...user,
                  like_count: action.payload?.data?.friend_request?.is_like
                    ? (user.like_count || 0) + 1
                    : Math.max((user.like_count || 0) - 1, 0),
                  friend_status: {
                    ...user.friend_status,
                    is_like: action.payload?.data?.friend_request?.is_like,
                  },
                };
              }
              return user;
            });
        }

        // Update user in the connections list if exists
        if (
          state.contractProcessorRequestsForMyConnection?.data?.users &&
          action.payload.data.friend_request.receiver_id
        ) {
          state.contractProcessorRequestsForMyConnection.data.users =
            state.contractProcessorRequestsForMyConnection.data.users.map(
              (user) => {
                if (
                  user.id === action.payload.data.friend_request.receiver_id
                ) {
                  return {
                    ...user,
                    friend_status: {
                      ...user.friend_status,
                      is_like: action.payload?.data?.friend_request?.is_like,
                    },
                  };
                }
                return user;
              }
            );
        }

        // Update the global like count in contractProcessorRequestsForMyConnection
        if (state.contractProcessorRequestsForMyConnection?.data) {
          const currentLikeCount =
            state.contractProcessorRequestsForMyConnection.data.like_count || 0;

          if (action.payload?.data?.friend_request?.is_like) {
            // User liked - increment count
            state.contractProcessorRequestsForMyConnection.data.like_count =
              currentLikeCount + 1;
          } else {
            // User unliked - decrement count (but don't go below 0)
            state.contractProcessorRequestsForMyConnection.data.like_count =
              Math.max(currentLikeCount - 1, 0);
          }
        }

        // If the user unliked a favorite, remove it from favorites list
        if (action.payload?.data?.friend_request?.is_like === false) {
          state.favoritesList.data.users =
            state.favoritesList.data.users.filter(
              (user) =>
                user.id !== action.payload.data.friend_request.receiver_id
            );

          // Update pagination count if we removed a user
          if (state.favoritesList?.data?.pagination) {
            state.favoritesList.data.pagination.totalRecords = Math.max(
              state.favoritesList.data.pagination.totalRecords - 1,
              0
            );
          }
        }

        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        } else {
          notification.error({
            message: "Error",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        }
      })
      .addCase(toggleLikeStatusAction.rejected, (state, action) => {
        state.toggleLikeLoading = false;
        state.toggleLikeError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message ||
            "Failed to update favorite status",
          duration: 2,
        });
      })
      // Add these cases to your extraReducers
      .addCase(fetchFavoritesList.pending, (state, action) => {
        // Check if we're loading more data (page > 1) or initial load
        const isLoadingMore = action.meta.arg?.page > 1;

        if (isLoadingMore) {
          state.isLoadingMoreFavorites = true;
        } else {
          state.favoritesListLoading = true;
        }
        state.favoritesListError = null;
      })
      .addCase(fetchFavoritesList.fulfilled, (state, action) => {
        const isLoadingMore = action.meta.arg?.page > 1;

        if (isLoadingMore) {
          // Append new users to existing list
          if (state.favoritesList?.data?.users && action.payload?.data?.users) {
            state.favoritesList.data.users = [
              ...state.favoritesList.data.users,
              ...action.payload.data.users,
            ];
          }
          // Update pagination
          if (action.payload?.data?.pagination) {
            state.favoritesList.data.pagination =
              action.payload.data.pagination;
          }
          state.isLoadingMoreFavorites = false;
        } else {
          // Initial load or refresh
          state.favoritesListLoading = false;
          state.favoritesList = action.payload;
        }

        
      })
      .addCase(fetchFavoritesList.rejected, (state, action) => {
        const isLoadingMore = action.meta.arg?.page > 1;

        if (isLoadingMore) {
          state.isLoadingMoreFavorites = false;
        } else {
          state.favoritesListLoading = false;
        }
        state.favoritesListError = action?.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch favorites",
          duration: 2,
        });
      })
      .addCase(fetchContractProcessorUserDetails.pending, (state) => {
        state.contractProcessorUserDetailsLoading = true;
        state.contractProcessorUserDetailsError = null;
      })
      .addCase(fetchContractProcessorUserDetails.fulfilled, (state, action) => {
        state.contractProcessorUserDetailsLoading = false;
        state.contractProcessorUserDetails = action?.payload;
      
      })
      .addCase(fetchContractProcessorUserDetails.rejected, (state, action) => {
        state.contractProcessorUserDetailsLoading = false;
        state.contractProcessorUserDetailsError = action?.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch user details",
          duration: 2,
        });
      })
      .addCase(rateContractProcessorAction.pending, (state) => {
        state.contractProcessorRatingLoading = true;
        state.contractProcessorRatingError = null;
      })
      .addCase(rateContractProcessorAction.fulfilled, (state, action) => {
        state.contractProcessorRating = action?.payload;
        state.contractProcessorRatingLoading = false;

        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        } else {
          notification.error({
            message: "Error",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        }
      })
      .addCase(rateContractProcessorAction.rejected, (state, action) => {
        state.contractProcessorRatingLoading = false;
        state.contractProcessorRatingError = action?.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to rate user",
          duration: 2,
        });
      })
      .addCase(fetchLoanType.pending, (state) => {
        state.loanTypeLoading = true;
        state.loanTypeError = null;
      })
      .addCase(fetchLoanType.fulfilled, (state, action) => {
        state.loanType = action?.payload;
        state.loanTypeLoading = false;
      })
      .addCase(fetchLoanType.rejected, (state, action) => {
        state.loanTypeLoading = false;
        state.loanTypeError = action?.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch loan types",
          duration: 2,
        });
      })
      // Toggle Block/Unblock Action Cases
      .addCase(toggleBlockUnblockAction.pending, (state) => {
        state.toggleLoading = true;
        state.toggleError = null;
      })
      .addCase(toggleBlockUnblockAction.fulfilled, (state, action) => {
        state.toggleBlockUnblock = action.payload;
        state.toggleLoading = false;

        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        }
      })
      .addCase(toggleBlockUnblockAction.rejected, (state, action) => {
        state.toggleLoading = false;
        state.toggleError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to update block status",
          duration: 2,
        });
      })
      // Toggle Block/Unblock Contract Processor Action Cases
      .addCase(toggleBlockUnblockContractProcessorAction.pending, (state) => {
        state.toggleLoading = true;
        state.toggleError = null;
      })
      .addCase(
        toggleBlockUnblockContractProcessorAction.fulfilled,
        (state, action) => {
          state.toggleBlockUnblock = action.payload;
          state.toggleLoading = false;

          if (action?.payload?.meta?.success === true) {
            notification.success({
              message: "Success",
              description: action?.payload?.meta?.message,
              duration: 2,
            });
          } else {
            notification.error({
              message: "Error",
              description: action?.payload?.meta?.message,
              duration: 2,
            });
          }
        }
      )
      .addCase(
        toggleBlockUnblockContractProcessorAction.rejected,
        (state, action) => {
          state.toggleLoading = false;
          state.toggleError = action.payload;
          notification.error({
            message: "Error",
            description:
              action?.payload?.meta?.message || "Failed to update block status",
            duration: 2,
          });
        }
      );

    builder
      // Fetch friend requests cases
      .addCase(fetchFriendRequests.pending, (state) => {
        state.friendRequestsLoading = true;
        state.friendRequestsError = null;
      })
      .addCase(fetchFriendRequests.fulfilled, (state, action) => {
        state.friendRequestsLoading = false;
        state.friendRequests = action.payload;
      })
      .addCase(fetchFriendRequests.rejected, (state, action) => {
        state.friendRequestsLoading = false;
        state.friendRequestsError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch friend requests",
          duration: 2,
        });
      });

    builder
      // Respond to friend request cases
      .addCase(respondToFriendRequestAction.pending, (state) => {
        state.respondFriendRequestLoading = true;
        state.respondFriendRequestError = null;
      })
      .addCase(respondToFriendRequestAction.fulfilled, (state, action) => {
        state.respondFriendRequest = action.payload;
        state.respondFriendRequestLoading = false;
        // if (action?.payload?.meta?.success === true) {
        //   notification.success({
        //     message: "Success",
        //     description: action?.payload?.meta?.message,
        //     duration: 2,
        //   });
        // }
      })
      .addCase(respondToFriendRequestAction.rejected, (state, action) => {
        state.respondFriendRequestLoading = false;
        state.respondFriendRequestError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message ||
            "Failed to respond to friend request",
          duration: 2,
        });
      });
  },
});

// Export the action creators
export const { clearContractProcessorUserDetails, resetUserDetailsState } =
  contractProcessorSlice.actions;

export default contractProcessorSlice.reducer;
