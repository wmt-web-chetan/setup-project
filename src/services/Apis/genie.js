import { flaskDel, flaskGet, flaskPost } from "../../utils/apiWrapper";

// Get chat history
export const getChatHistory = async (params) => {
  const config = {
    params: params,
  };
  return await flaskGet(`/chat/history`, config); // gpt/chat-history
};

//User Query
export const createRecommendation = async (data) => {
  const config = {
    data: data,
  };
  return await flaskPost(`/recommend`, config); // gpt/recommend
};

// Get chat conversations
export const getConversations = async (params) => {
  const config = {
    params: params,
  };
  return await flaskGet(`/chat/getconversation`, config); // gpt/chat-getconversation
};

// POST API for renaming a conversation
export const renameConversation = async (data) => {
  const config = {
    data: data,
  };
  return await flaskPost(`/chat/renameconversation`, config); // gpt/chat-renameconversation
};

// Delete chat conversation
export const deleteChatConversation = async (params) => {
  const config = {
    params: params,
  };
  return await flaskDel(`/chat/deleteconversation`, config);  // gpt/chat-deleteconversation
};
