import { get, post } from "../../utils/apiWrapper";

// Get subscriptions list
export const getSubscriptionsList = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/subscriptions/list`, config);
};

// Create subscription
export const createSubscription = async (subscriptionData) => {
  const config = {
    data: subscriptionData,
    headers: {
      "Content-Type": "application/json",
    },
  };
  return await post(`/subscriptions/create`, config);
};

export const getCurrentSubscriptionDetails = async () => {
  return await get(`/subscriptions/getCurrentSubscriptionDetails`);
};

// GET API for invoice history
export const getInvoiceHistory = async () => {
  return await get(`/subscriptions/getInvoiceHistory`);
};

// GET API for add card
export const getUpdateCard = async () => {
  return await get(`/subscriptions/edit/payment`);
};

// GET API for add card
export const getCancleSubscription = async () => {
  return await get(`/subscriptions/cancel`);
};

export const submitThreeDSecureSuccess = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/subscriptions/three-d-secure/success`, config);
};