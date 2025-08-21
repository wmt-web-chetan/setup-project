import { createSlice } from "@reduxjs/toolkit";
import { notification } from "antd";
import {
  createUserAction,
  fetchUserDetailById,
  fetchUserForEdit,
  fetchUsersList,
  updateUserAction,
  updateProfileAction,
  changePhoneNumberAction,
  fetchRoleUserList,
  fetchNotificationsList,
  markAllNotificationsAsReadAction,
  toggleNotificationMuteAction,
} from "./action";

const initialState = {
  usersList: [],
  usersListLoading: false,
  usersListError: null,

  users: [],
  usersLoading: false,
  usersError: null,

  userDetails: {},
  userDetailsLoading: false,
  userDetailsError: null,

  userForEdit: {},
  userForEditLoading: false,
  userForEditError: null,

  userDetailById: {},
  userDetailByIdLoading: false,
  userDetailByIdError: null,

  createUser: {},
  createUserLoading: false,
  createUserError: null,

  updateUser: {},
  updateUserLoading: false,
  updateUserError: null,

  deleteUser: {},
  deleteUserLoading: false,
  deleteUserError: null,

  updateProfile: {},
  updateProfileLoading: false,
  updateProfileError: null,

  changePhoneNumber: {},
  changePhoneNumberLoading: false,
  changePhoneNumberError: null,

  roleUsers: [],
  roleUsersLoading: false,
  roleUsersError: null,

  notifications: [],
  notificationsLoading: false,
  notificationsError: null,

  markAllAsRead: {},
  markAllAsReadLoading: false,
  markAllAsReadError: null,

  toggleNotificationMute: {},
  toggleNotificationMuteLoading: false,
  toggleNotificationMuteError: null,
};

const usersSlice = createSlice({
  name: "usersmanagement",
  initialState,
  reducers: {
    editeUserData: (state, action) => {
      state.userForEdit = action.payload;
    },
    resetUpdateProfileState: (state) => {
      // Add this reducer to reset the loading and error states
      state.updateProfileLoading = false;
      state.updateProfileError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user for edit cases
      .addCase(fetchUserForEdit.pending, (state) => {
        state.userForEditLoading = true;
        state.userForEditError = null;
      })
      .addCase(fetchUserForEdit.fulfilled, (state, action) => {
        state.userForEditLoading = false;
        state.userForEdit = action.payload.data;
       
      })
      .addCase(fetchUserForEdit.rejected, (state, action) => {
        state.userForEditLoading = false;
        state.userForEditError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch user for edit",
          duration: 2,
        });
      });

    builder
      // Fetch user for edit cases
      .addCase(fetchUserDetailById.pending, (state) => {
        state.userDetailByIdLoading = true;
        state.userDetailByIdError = null;
      })
      .addCase(fetchUserDetailById.fulfilled, (state, action) => {
        state.userDetailByIdLoading = false;
        state.userDetailById = action.payload.data;
       
      })
      .addCase(fetchUserDetailById.rejected, (state, action) => {
        state.userDetailByIdLoading = false;
        state.userDetailByIdError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch user for edit",
          duration: 2,
        });
      });

    builder
      // Fetch users list cases
      .addCase(fetchUsersList.pending, (state) => {
        state.usersListLoading = true;
        state.usersListError = null;
      })
      .addCase(fetchUsersList.fulfilled, (state, action) => {
        state.usersListLoading = false;
        state.usersList = action.payload;
      
      })
      .addCase(fetchUsersList.rejected, (state, action) => {
        state.usersListLoading = false;
        state.usersListError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch users",
          duration: 2,
        });
      });

    builder
      // Create user cases
      .addCase(createUserAction.pending, (state) => {
        state.createUserLoading = true;
        state.createUserError = null;
      })
      .addCase(createUserAction.fulfilled, (state, action) => {
        state.createUserLoading = false;
        state.createUser = action.payload;

        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message || "User created successfully",
            duration: 2,
          });

          // If we have usersList data and are on the first page, add the new user to the list
          if (
            state.usersList?.data?.users &&
            state.usersList?.data?.pagination?.currentPage === 1
          ) {
            state.usersList.data.users = [
              action.payload?.data,
              ...state.usersList.data.users,
            ];

            // Update total count in pagination if it exists
            if (state.usersList?.data?.pagination) {
              state.usersList.data.pagination.totalRecords += 1;
            }
          }
        }
      })
      .addCase(createUserAction.rejected, (state, action) => {
        state.createUserLoading = false;
        state.createUserError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to create user",
          duration: 2,
        });
      });

    builder
      // Update user cases
      .addCase(updateUserAction.pending, (state) => {
        state.updateUserLoading = true;
        state.updateUserError = null;
      })
      .addCase(updateUserAction.fulfilled, (state, action) => {
        state.updateUserLoading = false;
        state.updateUser = action.payload;

        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message || "User updated successfully",
            duration: 2,
          });

          // Update the user in the list if it exists
          if (state.usersList?.data?.users) {
            state.usersList.data.users = state.usersList.data.users.map(
              (user) =>
                user.id === action.payload?.data?.id
                  ? action.payload.data
                  : user
            );
          }
        } else {
          console.log("Error");
        }
      })
      .addCase(updateUserAction.rejected, (state, action) => {
        state.updateUserLoading = false;
        state.updateUserError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to update user",
          duration: 2,
        });
      })

      // updateProfileAction
      .addCase(updateProfileAction.pending, (state) => {
        state.updateProfileLoading = true;
        state.updateProfileError = null;
      })
      .addCase(updateProfileAction.fulfilled, (state, action) => {
        state.updateProfileLoading = false;
        state.updateProfile = action.payload;

        // Only handle successful updates here
        if (
          action?.payload?.meta?.success === true &&
          action?.payload?.meta?.status === 200
        ) {

          // Update the userForEdit state with new data
          if (state.userForEdit?.user) {
            state.userForEdit.user.name = action.payload.data.name;
            state.userForEdit.user.email = action.payload.data.email;
            state.userForEdit.user.nmls_number =
              action.payload.data.nmls_number;
            state.userForEdit.user.phone_number =
              action.payload.data.phone_number;
            state.userForEdit.user.profile_photo_path =
              action.payload.data.profile_photo_path;
          }
        }

        // Don't show error notifications here - let the component handle them
        // This allows for better error handling and prevents form resets
      })
      .addCase(updateProfileAction.rejected, (state, action) => {
        state.updateProfileLoading = false;
        state.updateProfileError = action.payload;
      });
    builder
      // Change phone number cases
      .addCase(changePhoneNumberAction.pending, (state) => {
        state.changePhoneNumberLoading = true;
        state.changePhoneNumberError = null;
      })
      .addCase(changePhoneNumberAction.fulfilled, (state, action) => {
        state.changePhoneNumber = action.payload;
        state.changePhoneNumberLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message ||
              "Phone number changed successfully",
            duration: 2,
          });
        }
      })
      .addCase(changePhoneNumberAction.rejected, (state, action) => {
        state.changePhoneNumberLoading = false;
        state.changePhoneNumberError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to change phone number",
          duration: 2,
        });
      });

    builder
      .addCase(fetchRoleUserList.pending, (state) => {
        state.roleUsersLoading = true;
        state.roleUsersError = null;
      })
      .addCase(fetchRoleUserList.fulfilled, (state, action) => {
        state.roleUsersLoading = false;
        state.roleUsers = action.payload;
       
      })
      .addCase(fetchRoleUserList.rejected, (state, action) => {
        state.roleUsersLoading = false;
        state.roleUsersError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch role user list",
          duration: 2,
        });
      });

    builder
      // Fetch notifications list cases
      .addCase(fetchNotificationsList.pending, (state) => {
        state.notificationsLoading = true;
        state.notificationsError = null;
      })
      .addCase(fetchNotificationsList.fulfilled, (state, action) => {
        state.notificationsLoading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchNotificationsList.rejected, (state, action) => {
        state.notificationsLoading = false;
        state.notificationsError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch notifications",
          duration: 2,
        });
      });

    builder
      // Mark all notifications as read cases
      .addCase(markAllNotificationsAsReadAction.pending, (state) => {
        state.markAllAsReadLoading = true;
        state.markAllAsReadError = null;
      })
      .addCase(markAllNotificationsAsReadAction.fulfilled, (state, action) => {
        state.markAllAsRead = action.payload;
        state.markAllAsReadLoading = false;
        // if (action?.payload?.meta?.success === true) {
        //   notification.success({
        //     message: "Success",
        //     description:
        //       action?.payload?.meta?.message ||
        //       "All notifications marked as read",
        //     duration: 2,
        //   });
        // }
      })
      .addCase(markAllNotificationsAsReadAction.rejected, (state, action) => {
        state.markAllAsReadLoading = false;
        state.markAllAsReadError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message ||
            "Failed to mark all notifications as read",
          duration: 2,
        });
      });

      builder
      // Toggle notification mute cases
      .addCase(toggleNotificationMuteAction.pending, (state) => {
        state.toggleNotificationMuteLoading = true;
        state.toggleNotificationMuteError = null;
      })
      .addCase(toggleNotificationMuteAction.fulfilled, (state, action) => {
        state.toggleNotificationMute = action.payload;
        state.toggleNotificationMuteLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message || "Notification mute toggled successfully",
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
      .addCase(toggleNotificationMuteAction.rejected, (state, action) => {
        state.toggleNotificationMuteLoading = false;
        state.toggleNotificationMuteError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to toggle notification mute",
          duration: 2,
        });
      });
  },
});

export const { editeUserData, resetUpdateProfileState } = usersSlice.actions;
export default usersSlice.reducer;
