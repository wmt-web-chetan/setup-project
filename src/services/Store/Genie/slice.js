import { createSlice } from "@reduxjs/toolkit";
import { notification } from "antd";
import {
  createRecommendationAction,
  fetchChatConversations,
  fetchChatHistory,
  removeChatConversation,
  renameConversationAction,
} from "./action";

const initialState = {
  chatHistory: {},
  chatHistoryLoading: false,
  chatHistoryError: null,

  recommendation: {},
  recommendationLoading: false,
  recommendationError: null,

  conversations: [],
  conversationsLoading: false,
  conversationsError: null,

  renamedConversation: {},
  renamedConversationLoading: false,
  renamedConversationError: null,

  // State for chat conversation deletion
  deletedConversation: {},
  conversationDeleteLoading: false,
  conversationDeleteError: null,
};

const genieSlice = createSlice({
  name: "genie",
  initialState,
  reducers: {
    updateGenieHistory: (state, action) => {
      // console.log("294 reducers state", state?.chatHistory);


      state.chatHistory.data.conversations =
        state.chatHistory.data.conversations.map((conversation) => {
          return conversation.conversation_id ===
            action.payload?.conversation?.conversation_id
            ? {
                ...conversation,
                title: action.payload?.conversation?.new_title,
              }
            : conversation;
        });
    },
    deleteGenieHistory: (state, action) => {


      state.chatHistory.data.conversations = state.chatHistory.data.conversations.filter(
        (conversation) => conversation.conversation_id !== action.payload?.conversation?.conversation_id
      );

      // state.chatHistory.data.conversations =
      //   state.chatHistory.data.conversations.map((conversation) => {
      //     return conversation.conversation_id ===
      //       action.payload?.conversation?.conversation_id
      //       ? {
      //           ...conversation,
      //           title: action.payload?.conversation?.new_title,
      //         }
      //       : conversation;
      //   });
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch chat history cases
      .addCase(fetchChatHistory.pending, (state) => {
        state.chatHistoryLoading = true;
        state.chatHistoryError = null;
      })
      .addCase(fetchChatHistory.fulfilled, (state, action) => {
        state.chatHistoryLoading = false;
        state.chatHistory = action.payload;
     
      })
      .addCase(fetchChatHistory.rejected, (state, action) => {
        state.chatHistoryLoading = false;
        state.chatHistoryError = action?.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch chat history",
          duration: 2,
        });
      });

    builder
      // Create recommendation cases
      .addCase(createRecommendationAction.pending, (state) => {
        state.recommendationLoading = true;
        state.recommendationError = null;
      })
      .addCase(createRecommendationAction.fulfilled, (state, action) => {
        state.recommendation = action.payload;
        state.recommendationLoading = false;
        if (action?.payload?.meta?.success === true) {
          // notification.success({
          //   message: "Success",
          //   description:
          //     action?.payload?.meta?.message ||
          //     "Recommendation created successfully",
          //   duration: 2,
          // });
        }
      })
      .addCase(createRecommendationAction.rejected, (state, action) => {
        state.recommendationLoading = false;
        state.recommendationError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to create recommendation",
          duration: 2,
        });
      });

    builder
      // Fetch chat conversations cases
      .addCase(fetchChatConversations.pending, (state) => {
        state.conversationsLoading = true;
        state.conversationsError = null;
      })
      .addCase(fetchChatConversations.fulfilled, (state, action) => {
        state.conversationsLoading = false;
        state.conversations = action.payload;
       
      })
      .addCase(fetchChatConversations.rejected, (state, action) => {
        state.conversationsLoading = false;
        state.conversationsError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message ||
            "Failed to fetch chat conversations",
          duration: 2,
        });
      });

    builder
      // Delete chat conversation cases
      .addCase(removeChatConversation.pending, (state) => {
        state.conversationDeleteLoading = true;
        state.conversationDeleteError = null;
      })
      .addCase(removeChatConversation.fulfilled, (state, action) => {
        state.deletedConversation = action.payload;
        state.conversationDeleteLoading = false;

        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message ||
              "Conversation deleted successfully",
            duration: 2,
          });
        }
      })
      .addCase(removeChatConversation.rejected, (state, action) => {
        state.conversationDeleteLoading = false;
        state.conversationDeleteError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to delete conversation",
          duration: 2,
        });
      });

    builder
      // Rename conversation cases
      .addCase(renameConversationAction.pending, (state) => {
        state.renamedConversationLoading = true;
        state.renamedConversationError = null;
      })
      .addCase(renameConversationAction.fulfilled, (state, action) => {
        state.renamedConversation = action.payload;
        state.renamedConversationLoading = false;

        console.log(
          "rename state.chatHistory",
          action.payload?.data?.conversation?.conversation_id
        );

        // state.chatHistory.data.conversations = state.chatHistory.data.conversations.map(
        //                 (conversation) =>
        //                     conversation.conversation_id === action.payload?.data?.conversation?.conversation_id
        //                         ? action.payload?.data?.conversation?.new_title
        //                         : conversation
        //             );

        // Update the conversation in the list if it exists
        // if (state.chatHistory?.data?.conversations) {
        //   state.chatHistory.data.conversations =
        //     state.chatHistory.data.conversations.map((conversation) =>
        //       conversation.conversation_id ===
        //       action.payload?.data?.conversation?.conversation_id
        //         ? {
        //             ...conversation,
        //             title: action.payload?.data?.conversation?.new_title,
        //           }
        //         : conversation
        //     );
        // }

        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message ||
              "Conversation renamed successfully",
            duration: 2,
          });
        }
      })
      .addCase(renameConversationAction.rejected, (state, action) => {
        state.renamedConversationLoading = false;
        state.renamedConversationError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to rename conversation",
          duration: 2,
        });
      });
  },
});

export const { updateGenieHistory, deleteGenieHistory } = genieSlice.actions;
export default genieSlice.reducer;
