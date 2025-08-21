import { flaskDel, flaskGet, flaskPost } from "../../utils/apiWrapper";

// Get chat history
export const getChatHistoryGPT = async (params) => {
  const config = {
    params: params,
  };
  return await flaskGet(`/gpt/chat-history`, config); // gpt/chat-history
};

//User Query
export const createRecommendationGPT = async (data) => {
  const config = {
    data: data,
  };
  return await flaskPost(`/gpt/recommend`, config); // gpt/recommend
};

// Get chat conversations
export const getConversationsGPT = async (params) => {
  const config = {
    params: params,
  };
  return await flaskGet(`/gpt/chat-getconversation`, config); // gpt/chat-getconversation
};

// POST API for renaming a conversation
export const renameConversationGPT = async (data) => {
  const config = {
    data: data,
  };
  return await flaskPost(`/gpt/chat-renameconversation`, config); // gpt/chat-renameconversation
};

// Delete chat conversation
export const deleteChatConversationGPT = async (params) => {
  const config = {
    params: params,
  };
  return await flaskDel(`/gpt/chat-deleteconversation`, config);  // gpt/chat-deleteconversation
};
