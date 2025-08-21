import { createSlice } from "@reduxjs/toolkit";
import { notification } from "antd";
import {
  addRoleAction,
  fetchAllRolesList,
  fetchPermissions,
  fetchRoleDetails,
  fetchRolesList,
  updateRoleData,
} from "./action";

const initialState = {
  permissions: [],
  permissionsLoading: false,
  permissionsError: null,

  createRoleData: {},
  createRoleLoading: false,
  createRoleError: null,

  rolesList: [],
  rolesListLoading: false,
  rolesListError: null,

  roleDetails: {},
  roleDetailsLoading: false,
  roleDetailsError: null,

  allRoles: [],
  allRolesLoading: false,
  allRolesError: null,
  roleData: {},
  roleDataLoading: false,
  roleDataError: null,
};

const permissionsSlice = createSlice({
  name: "permissions",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch permissions cases
      .addCase(fetchPermissions.pending, (state) => {
        state.permissionsLoading = true;
        state.permissionsError = null;
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.permissionsLoading = false;
        state.permissions = action.payload;
       
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.permissionsLoading = false;
        state.permissionsError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch permissions",
          duration: 2,
        });
      });

    builder
      // Create role cases
      .addCase(addRoleAction.pending, (state) => {
        state.createRoleLoading = true;
        state.createRoleError = null;
      })
      .addCase(addRoleAction.fulfilled, (state, action) => {
        state.createRoleData = action.payload;
        state.createRoleLoading = false;

        // If we have roles data and the creation was successful, update the list
        if (
          state.roles?.data?.data &&
          action?.payload?.meta?.success === true
        ) {
          state.roles.data.data = [
            action.payload?.data,
            ...state.roles.data.data,
          ];

          // Increment total count if pagination exists
          if (state.roles?.data?.pagination) {
            state.roles.data.pagination.totalRecords += 1;
          }
        }
      })
      .addCase(addRoleAction.rejected, (state, action) => {
        state.createRoleLoading = false;
        state.createRoleError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to create role",
          duration: 2,
        });
      });

    builder
      // Fetch roles list cases
      .addCase(fetchRolesList.pending, (state) => {
        state.rolesListLoading = true;
        state.rolesListError = null;
      })
      .addCase(fetchRolesList.fulfilled, (state, action) => {
        state.rolesListLoading = false;
        state.rolesList = action.payload;
       
      })
      .addCase(fetchRolesList.rejected, (state, action) => {
        state.rolesListLoading = false;
        state.rolesListError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch roles",
          duration: 2,
        });
      });

    builder
      // Fetch role details cases
      .addCase(fetchRoleDetails.pending, (state) => {
        state.roleDetailsLoading = true;
        state.roleDetailsError = null;
      })
      .addCase(fetchRoleDetails.fulfilled, (state, action) => {
        state.roleDetailsLoading = false;
        state.roleDetails = action.payload;
      
      })
      .addCase(fetchRoleDetails.rejected, (state, action) => {
        state.roleDetailsLoading = false;
        state.roleDetailsError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch role details",
          duration: 2,
        });
      });

     builder
     
     .addCase(fetchAllRolesList.pending, (state) => {
      state.allRolesLoading = true;
      state.allRolesError = null;
    })
    .addCase(fetchAllRolesList.fulfilled, (state, action) => {
      state.allRolesLoading = false;
      state.allRoles = action.payload;
    
    })
    .addCase(fetchAllRolesList.rejected, (state, action) => {
      state.allRolesLoading = false;
      state.allRolesError = action.payload;
      notification.error({
        message: "Error",
        description: action?.payload?.meta?.message || "Failed to fetch roles",
        duration: 2,
      });
    });
    builder
      // Update role data cases
      .addCase(updateRoleData.pending, (state) => {
        state.roleDataLoading = true;
        state.roleDataError = null;
      })
      .addCase(updateRoleData.fulfilled, (state, action) => {
        state.roleData = action.payload;
        state.roleDataLoading = false;
      })
      .addCase(updateRoleData.rejected, (state, action) => {
        state.roleDataLoading = false;
        state.roleDataError = action.payload;
      });
  },
});

export default permissionsSlice.reducer;
