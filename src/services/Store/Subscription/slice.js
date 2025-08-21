import { createSlice } from "@reduxjs/toolkit";
import { notification } from "antd";
import {
  addSubscription,
  fetchCancleSubscription,
  fetchCurrentSubscriptionDetails,
  fetchInvoiceHistory,
  fetchSubscriptionsList,
  fetchUpdateCard,
  processThreeDSecureSuccess,
} from "./action";

const initialState = {
  subscriptionsList: [],
  subscriptionsListLoading: false,
  subscriptionsListError: null,

  // Create subscription state
  newSubscription: {},
  newSubscriptionLoading: false,
  newSubscriptionError: null,

  currentSubscription: {},
  currentSubscriptionLoading: false,
  currentSubscriptionError: null,

  invoiceHistory: {},
  invoiceHistoryLoading: false,
  invoiceHistoryError: null,

  updateCard: {},
  updateCardLoading: false,
  updateCardError: null,

  cancleSubscription: {},
  cancleSubscriptionLoading: false,
  cancleSubscriptionError: null,

  threeDSecureSuccess: {},
  threeDSecureSuccessLoading: false,
  threeDSecureSuccessError: null,
};

const subscriptionsSlice = createSlice({
  name: "subscriptions",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch subscriptions list cases
      .addCase(fetchSubscriptionsList.pending, (state) => {
        state.subscriptionsListLoading = true;
        state.subscriptionsListError = null;
      })
      .addCase(fetchSubscriptionsList.fulfilled, (state, action) => {
        state.subscriptionsListLoading = false;
        state.subscriptionsList = action.payload;
     
      })
      .addCase(fetchSubscriptionsList.rejected, (state, action) => {
        state.subscriptionsListLoading = false;
        state.subscriptionsListError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch subscriptions",
          duration: 2,
        });
      });

    builder
      // Create subscription cases
      .addCase(addSubscription.pending, (state) => {
        state.newSubscriptionLoading = true;
        state.newSubscriptionError = null;
      })
      .addCase(addSubscription.fulfilled, (state, action) => {
        state.newSubscription = action.payload;
        state.newSubscriptionLoading = false;
      })
      .addCase(addSubscription.rejected, (state, action) => {
        state.newSubscriptionLoading = false;
        state.newSubscriptionError = action.payload;
      });

    builder
      // Fetch current subscription details cases
      .addCase(fetchCurrentSubscriptionDetails.pending, (state) => {
        state.currentSubscriptionLoading = true;
        state.currentSubscriptionError = null;
      })
      .addCase(fetchCurrentSubscriptionDetails.fulfilled, (state, action) => {
        state.currentSubscriptionLoading = false;
        state.currentSubscription = action.payload;
       
      })
      .addCase(fetchCurrentSubscriptionDetails.rejected, (state, action) => {
        state.currentSubscriptionLoading = false;
        state.currentSubscriptionError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message ||
            "Failed to fetch subscription details",
          duration: 2,
        });
      });

    builder
      .addCase(fetchInvoiceHistory.pending, (state) => {
        state.invoiceHistoryLoading = true;
        state.invoiceHistoryError = null;
      })
      .addCase(fetchInvoiceHistory.fulfilled, (state, action) => {
        state.invoiceHistoryLoading = false;
        state.invoiceHistory = action.payload;

      })
      .addCase(fetchInvoiceHistory.rejected, (state, action) => {
        state.invoiceHistoryLoading = false;
        state.invoiceHistoryError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch invoice history",
          duration: 2,
        });
      });

    builder
      .addCase(fetchUpdateCard.pending, (state) => {
        state.updateCardLoading = true;
        state.updateCardError = null;
      })
      .addCase(fetchUpdateCard.fulfilled, (state, action) => {
        state.updateCardLoading = false;
        state.updateCard = action.payload;
      })
      .addCase(fetchUpdateCard.rejected, (state, action) => {
        state.updateCardLoading = false;
        state.updateCardError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch invoice history",
          duration: 2,
        });
      });

    builder
      .addCase(fetchCancleSubscription.pending, (state) => {
        state.cancleSubscriptionLoading = true;
        state.cancleSubscriptionError = null;
      })
      .addCase(fetchCancleSubscription.fulfilled, (state, action) => {
        state.cancleSubscriptionLoading = false;
        state.cancleSubscription = action.payload;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        }
      })
      .addCase(fetchCancleSubscription.rejected, (state, action) => {
        state.cancleSubscriptionLoading = false;
        state.cancleSubscriptionError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch invoice history",
          duration: 2,
        });
      });

      builder
      // Process 3D Secure success cases
      .addCase(processThreeDSecureSuccess.pending, (state) => {
        state.threeDSecureSuccessLoading = true;
        state.threeDSecureSuccessError = null;
      })
      .addCase(processThreeDSecureSuccess.fulfilled, (state, action) => {
        state.threeDSecureSuccess = action.payload;
        state.threeDSecureSuccessLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message || "3D Secure authentication successful",
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
      .addCase(processThreeDSecureSuccess.rejected, (state, action) => {
        state.threeDSecureSuccessLoading = false;
        state.threeDSecureSuccessError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "3D Secure authentication failed",
          duration: 2,
        });
      });
  },
});

export default subscriptionsSlice.reducer;
