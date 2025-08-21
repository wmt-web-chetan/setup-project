import { createSlice } from "@reduxjs/toolkit";
import { notification } from "antd";
import { addLink, fetchLinks, removeLink, updateLinkAction } from "./action";

const initialState = {
  links: [],
  linksLoading: false,
  linksError: null,

  createLink: {},
  createLinkLoading: false,
  createLinkError: null,

  updateLink: {},
  updateLinkLoading: false,
  updateLinkError: null,

  deleteLink: {},
  deleteLinkLoading: false,
  deleteLinkError: null,
};

const linksSlice = createSlice({
  name: "links",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch links cases
      .addCase(fetchLinks.pending, (state) => {
        state.linksLoading = true;
        state.linksError = null;
      })
      .addCase(fetchLinks.fulfilled, (state, action) => {
        state.linksLoading = false;
        state.links = action.payload;
      })
      .addCase(fetchLinks.rejected, (state, action) => {
        state.linksLoading = false;
        state.linksError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch links",
          duration: 2,
        });
      });

    builder
      // Create link cases
      .addCase(addLink.pending, (state) => {
        state.createLinkLoading = true;
        state.createLinkError = null;
      })
      .addCase(addLink.fulfilled, (state, action) => {
        state.createLink = action.payload;
        state.createLinkLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        }
      })
      .addCase(addLink.rejected, (state, action) => {
        state.createLinkLoading = false;
        state.createLinkError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to create link",
          duration: 2,
        });
      })

      // Update link cases
      .addCase(updateLinkAction.pending, (state) => {
        state.updateLinkLoading = true;
        state.updateLinkError = null;
      })
      .addCase(updateLinkAction.fulfilled, (state, action) => {
        state.updateLink = action.payload;
        state.updateLinkLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        }
      })
      .addCase(updateLinkAction.rejected, (state, action) => {
        state.updateLinkLoading = false;
        state.updateLinkError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to update link",
          duration: 2,
        });
      })

      // Delete link cases
      .addCase(removeLink.pending, (state) => {
        state.deleteLinkLoading = true;
        state.deleteLinkError = null;
      })
      .addCase(removeLink.fulfilled, (state, action) => {
        state.deleteLink = action.payload;
        state.deleteLinkLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        }
      })
      .addCase(removeLink.rejected, (state, action) => {
        state.deleteLinkLoading = false;
        state.deleteLinkError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to delete link",
          duration: 2,
        });
      });
  },
});

export default linksSlice.reducer;
