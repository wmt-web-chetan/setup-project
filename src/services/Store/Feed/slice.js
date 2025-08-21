import { createSlice } from "@reduxjs/toolkit";
import { notification } from "antd";
import {
  addComment,
  addFeed,
  deleteFeedAction,
  feedCommentList,
  fetchAllFeeds,
  fetchFeedById,
  publishExistingFeedAction,
  scheduleExistingFeedAction,
  toggleFeedLikeAction,
  toggleFeedLikeCommentAction,
  toggleFeedPinAction,
  updateFeedAction,
} from "./action";

const initialState = {
  feeds: [],
  feedsLoading: false,
  feedsError: null,

  feedData: {},
  feedLoading: false,
  feedError: null,

  feedComment: {},
  feedCommentLoading: false,
  feedCommentError: null,

  comment: {},
  commentLoading: false,
  commentError: null,

  // Publish existing feed states
  publishFeedData: {},
  publishFeedLoading: false,
  publishFeedError: null,

  // Schedule existing feed states
  scheduleFeedData: {},
  scheduleFeedLoading: false,
  scheduleFeedError: null,

  // Delete feed states
  deleteFeedData: {},
  deleteFeedLoading: false,
  deleteFeedError: null,

  feedLikeToggle: {},
  feedLikeToggleLoading: false,
  feedLikeToggleError: null,

  feedLikeCommentToggle: {},
  feedLikeCommentToggleLoading: false,
  feedLikeCommentToggleError: null,

  feedPinToggle: {},
  feedPinToggleLoading: false,
  feedPinToggleError: null,

  updateFeedData: {},
  updateFeedDataLoading: false,
  updateFeedDataError: null,

  feedDetails: {},
  feedDetailsLoading: false,
  feedDetailsError: null,
};

const feedsSlice = createSlice({
  name: "feeds",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch all feeds cases
      .addCase(fetchAllFeeds.pending, (state) => {
        state.feedsLoading = true;
        state.feedsError = null;
      })
      .addCase(fetchAllFeeds.fulfilled, (state, action) => {
        state.feedsLoading = false;
        state.feeds = action.payload;
        // if (action?.payload?.meta?.success !== true) {
        //   notification.error({
        //     message: "Error",
        //     description: action?.payload?.meta?.message,
        //     duration: 2,
        //   });
        // }
      })
      .addCase(fetchAllFeeds.rejected, (state, action) => {
        state.feedsLoading = false;
        state.feedsError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch feeds",
          duration: 2,
        });
      });

    builder
      // Create feed cases
      .addCase(addFeed.pending, (state) => {
        state.feedLoading = true;
        state.feedError = null;
      })
      .addCase(addFeed.fulfilled, (state, action) => {
        state.feedData = action.payload;
        state.feedLoading = false;
        // if (action?.payload?.meta?.success === true) {
        //   notification.success({
        //     message: "Success",
        //     description:
        //       action?.payload?.meta?.message || "Feed created successfully",
        //     duration: 2,
        //   });
        // }
      })
      .addCase(addFeed.rejected, (state, action) => {
        state.feedLoading = false;
        state.feedError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to create feed",
          duration: 2,
        });
      });

    builder
      // Create comment cases
      .addCase(feedCommentList.pending, (state) => {
        state.feedCommentLoading = true;
        state.feedCommentError = null;
      })
      .addCase(feedCommentList.fulfilled, (state, action) => {
        state.feedComment = action.payload;
        state.feedCommentLoading = false;
        if (action?.payload?.meta?.success === true) {
          // notification.success({
          //   message: "Success",
          //   description:
          //     action?.payload?.meta?.message || "Comment added successfully",
          //   duration: 2,
          // });
        }
      })
      .addCase(feedCommentList.rejected, (state, action) => {
        state.feedCommentLoading = false;
        state.feedCommentError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to add comment",
          duration: 2,
        });
      });

    builder
      // Create comment cases
      .addCase(addComment.pending, (state) => {
        state.commentLoading = true;
        state.commentError = null;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.comment = action.payload;
        state.commentLoading = false;
        // if (action?.payload?.meta?.success === true) {
        //   notification.success({
        //     message: "Success",
        //     description:
        //       action?.payload?.meta?.message || "Comment added successfully",
        //     duration: 2,
        //   });
        // }
      })
      .addCase(addComment.rejected, (state, action) => {
        state.commentLoading = false;
        state.commentError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to add comment",
          duration: 2,
        });
      });

    builder
      // Publish existing feed cases
      .addCase(publishExistingFeedAction.pending, (state) => {
        state.publishFeedLoading = true;
        state.publishFeedError = null;
      })
      .addCase(publishExistingFeedAction.fulfilled, (state, action) => {
        state.publishFeedData = action.payload;
        state.publishFeedLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message || "Feed published successfully",
            duration: 2,
          });
        }
      })
      .addCase(publishExistingFeedAction.rejected, (state, action) => {
        state.publishFeedLoading = false;
        state.publishFeedError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to publish feed",
          duration: 2,
        });
      });

    // Schedule existing feed cases
    builder
      .addCase(scheduleExistingFeedAction.pending, (state) => {
        state.scheduleFeedLoading = true;
        state.scheduleFeedError = null;
      })
      .addCase(scheduleExistingFeedAction.fulfilled, (state, action) => {
        state.scheduleFeedData = action.payload;
        state.scheduleFeedLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message || "Feed scheduled successfully",
            duration: 2,
          });
        }
      })
      .addCase(scheduleExistingFeedAction.rejected, (state, action) => {
        state.scheduleFeedLoading = false;
        state.scheduleFeedError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to schedule feed",
          duration: 2,
        });
      });

    // Delete feed cases
    builder
      .addCase(deleteFeedAction.pending, (state) => {
        state.deleteFeedLoading = true;
        state.deleteFeedError = null;
      })
      .addCase(deleteFeedAction.fulfilled, (state, action) => {
        state.deleteFeedData = action.payload;
        state.deleteFeedLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message || "Feed deleted successfully",
            duration: 2,
          });
        }
      })
      .addCase(deleteFeedAction.rejected, (state, action) => {
        state.deleteFeedLoading = false;
        state.deleteFeedError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to delete feed",
          duration: 2,
        });
      });

    builder
      // Toggle feed like cases
      .addCase(toggleFeedLikeAction.pending, (state) => {
        state.feedLikeToggleLoading = true;
        state.feedLikeToggleError = null;
      })
      .addCase(toggleFeedLikeAction.fulfilled, (state, action) => {
        state.feedLikeToggleLoading = false;
        state.feedLikeToggle = action.payload;
      })
      .addCase(toggleFeedLikeAction.rejected, (state, action) => {
        state.feedLikeToggleLoading = false;
        state.feedLikeToggleError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message ||
            "Failed to update feed like status",
          duration: 2,
        });
      });

      builder
      // Toggle feed like cases
      .addCase(toggleFeedLikeCommentAction.pending, (state) => {
        state.feedLikeCommentToggleLoading = true;
        state.feedLikeCommentToggleError = null;
      })
      .addCase(toggleFeedLikeCommentAction.fulfilled, (state, action) => {
        state.feedLikeCommentToggleLoading = false;
        state.feedLikeCommentToggle = action.payload;
      })
      .addCase(toggleFeedLikeCommentAction.rejected, (state, action) => {
        state.feedLikeCommentToggleLoading = false;
        state.feedLikeCommentToggleError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message ||
            "Failed to update feed like status",
          duration: 2,
        });
      });

    // Toggle feed pin cases
    builder
      .addCase(toggleFeedPinAction.pending, (state) => {
        state.feedPinToggleLoading = true;
        state.feedPinToggleError = null;
      })
      .addCase(toggleFeedPinAction.fulfilled, (state, action) => {
        state.feedPinToggleLoading = false;
        state.feedPinToggle = action.payload;
        // if (action?.payload?.meta?.success === true) {
        //   notification.success({
        //     message: "Success",
        //     description:
        //       action?.payload?.meta?.message ||
        //       "Feed pin status updated successfully",
        //     duration: 2,
        //   });
        // }
      })
      .addCase(toggleFeedPinAction.rejected, (state, action) => {
        state.feedPinToggleLoading = false;
        state.feedPinToggleError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message ||
            "Failed to update feed pin status",
          duration: 2,
        });
      });

      builder
      .addCase(updateFeedAction.pending, (state) => {
        state.updateFeedDataLoading = true;
        state.updateFeedDataError = null;
      })
      .addCase(updateFeedAction.fulfilled, (state, action) => {
        state.updateFeedDataLoading = false;
        state.updateFeedData = action.payload;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message ||
              "Feed pin status updated successfully",
            duration: 2,
          });
        }
      })
      .addCase(updateFeedAction.rejected, (state, action) => {
        state.updateFeedDataLoading = false;
        state.updateFeedDataError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message ||
            "Failed to update feed pin status",
          duration: 2,
        });
      });

      builder
      // Fetch feed by ID cases
      .addCase(fetchFeedById.pending, (state) => {
        state.feedDetailsLoading = true;
        state.feedDetailsError = null;
      })
      .addCase(fetchFeedById.fulfilled, (state, action) => {
        state.feedDetailsLoading = false;
        state.feedDetails = action.payload;
       
      })
      .addCase(fetchFeedById.rejected, (state, action) => {
        state.feedDetailsLoading = false;
        state.feedDetailsError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to fetch feed",
          duration: 2,
        });
      });
  },
});

export default feedsSlice.reducer;
