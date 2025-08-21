import { createSlice } from "@reduxjs/toolkit";
import { notification } from "antd";
import {
  createRecommendationActionGPT,
  fetchChatConversationsGPT,
  fetchChatHistoryGPT,
  removeChatConversationGPT,
  renameConversationActionGPT,
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

const gptSlice = createSlice({
  name: "gpt",
  initialState,
  reducers: {
    updateGPTHistory: (state, action) => {
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
    deleteGPTHistory: (state, action) => {

      state.chatHistory.data.conversations =
        state.chatHistory.data.conversations.filter(
          (conversation) =>
            conversation.conversation_id !==
            action.payload?.conversation?.conversation_id
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
      .addCase(fetchChatHistoryGPT.pending, (state) => {
        state.chatHistoryLoading = true;
        state.chatHistoryError = null;
      })
      .addCase(fetchChatHistoryGPT.fulfilled, (state, action) => {
        state.chatHistoryLoading = false;
        state.chatHistory = action.payload;
       
      })
      .addCase(fetchChatHistoryGPT.rejected, (state, action) => {
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
      .addCase(createRecommendationActionGPT.pending, (state) => {
        state.recommendationLoading = true;
        state.recommendationError = null;
      })
      .addCase(createRecommendationActionGPT.fulfilled, (state, action) => {
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
      .addCase(createRecommendationActionGPT.rejected, (state, action) => {
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
      .addCase(fetchChatConversationsGPT.pending, (state) => {
        state.conversationsLoading = true;
        state.conversationsError = null;
      })
      .addCase(fetchChatConversationsGPT.fulfilled, (state, action) => {
        state.conversationsLoading = false;
        state.conversations = action.payload;
      
      })
      .addCase(fetchChatConversationsGPT.rejected, (state, action) => {
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
      .addCase(removeChatConversationGPT.pending, (state) => {
        state.conversationDeleteLoading = true;
        state.conversationDeleteError = null;
      })
      .addCase(removeChatConversationGPT.fulfilled, (state, action) => {
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
      .addCase(removeChatConversationGPT.rejected, (state, action) => {
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
      .addCase(renameConversationActionGPT.pending, (state) => {
        state.renamedConversationLoading = true;
        state.renamedConversationError = null;
      })
      .addCase(renameConversationActionGPT.fulfilled, (state, action) => {
        state.renamedConversation = action.payload;
        state.renamedConversationLoading = false;

       

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
      .addCase(renameConversationActionGPT.rejected, (state, action) => {
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

export const { updateGPTHistory, deleteGPTHistory } = gptSlice.actions;
export default gptSlice.reducer;
