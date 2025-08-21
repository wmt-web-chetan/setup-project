import { createSlice } from "@reduxjs/toolkit";
import {
  fetchFriendFolders,
  addFriendFolder,
  updateFriendFolderAction,
  removeFriendFolder,
  fetchDeletedFriendFolders,
  restoreFriendFolderAction,
  fetchNestedFolders,
  addNestedFolder,
  updateNestedFolderAction,
  removeNestedFolder,
  fetchDeletedNestedFolders,
  restoreNestedFolderAction,
  fetchFriendFolderFiles,
  uploadFileToFriendFolder,
  deleteFriendFolderFileAction,
  fetchDeletedFiles,
  restoreDeletedFilesAction
 
} from "./actions";
import { notification } from "antd";

const initialState = {
  // =================== FRIEND FOLDERS STATE ===================
  friendFolders: [],
  friendFoldersLoading: false,
  friendFoldersError: null,
  loadMoreLoading: false, // New state for load more

  createFriendFolder: {},
  createFriendFolderLoading: false,
  createFriendFolderError: null,

  updateFriendFolder: {},
  updateFriendFolderLoading: false,
  updateFriendFolderError: null,

  deleteFriendFolder: {},
  deleteFriendFolderLoading: false,
  deleteFriendFolderError: null,

  deletedFriendFolders: [],
  deletedFriendFoldersLoading: false,
  deletedFriendFoldersError: null,
  deletedLoadMoreLoading: false, // NEW: Add load more loading for deleted folders

  restoreFriendFolder: {},
  restoreFriendFolderLoading: false,
  restoreFriendFolderError: null,

  // =================== NESTED FOLDERS STATE ===================
  nestedFolders: [],
  nestedFoldersLoading: false,
  nestedFoldersError: null,
  nestedLoadMoreLoading: false, // New state for nested load more

  createNestedFolder: {},
  createNestedFolderLoading: false,
  createNestedFolderError: null,

  updateNestedFolder: {},
  updateNestedFolderLoading: false,
  updateNestedFolderError: null,

  deleteNestedFolder: {},
  deleteNestedFolderLoading: false,
  deleteNestedFolderError: null,

  deletedNestedFolders: [],
  deletedNestedFoldersLoading: false,
  deletedNestedFoldersError: null,

  restoreNestedFolder: {},
  restoreNestedFolderLoading: false,
  restoreNestedFolderError: null,

  // =================== FRIEND FOLDER FILES STATE ===================
  friendFolderFiles: [],
  friendFolderFilesLoading: false,
  friendFolderFilesError: null,
  filesLoadMoreLoading: false, // New state for files load more

  uploadFile: {},
  uploadFileLoading: false,
  uploadFileError: null,

  deleteFile: {},
  deleteFileLoading: false,
  deleteFileError: null,

  // =================== DELETED FILES STATE ===================
  deletedFiles: [],
  deletedFilesLoading: false,
  deletedFilesError: null,
  deletedFilesLoadMoreLoading: false, // NEW: Add load more loading for deleted files

  restoreFile: {},
  restoreFileLoading: false,
  restoreFileError: null,
};

const friendFoldersSlice = createSlice({
  name: "friendFolders",
  initialState,
  reducers: {
    // Action to set load more loading specifically for friend folders
    setLoadMoreLoading: (state, action) => {
      state.loadMoreLoading = action.payload;
    },
    // Action to set load more loading specifically for nested folders
    setNestedLoadMoreLoading: (state, action) => {
      state.nestedLoadMoreLoading = action.payload;
    },
    // Action to set load more loading specifically for files
    setFilesLoadMoreLoading: (state, action) => {
      state.filesLoadMoreLoading = action.payload;
    },
    // NEW: Action to set load more loading specifically for deleted folders
    setDeletedLoadMoreLoading: (state, action) => {
      state.deletedLoadMoreLoading = action.payload;
    },
    // NEW: Action to set load more loading specifically for deleted files
    setDeletedFilesLoadMoreLoading: (state, action) => {
      state.deletedFilesLoadMoreLoading = action.payload;
    },
    // Action to clear friend folders state back to initial values
    clearFriendFoldersState: (state) => {
      state.friendFolders = [];
    },
    // Action to clear nested folders state back to initial values
    clearNestedFoldersState: (state) => {
      state.nestedFolders = [];
    },
    // Action to clear friend folder files state back to initial values
    clearFriendFolderFilesState: (state) => {
      state.friendFolderFiles = [];
    },
    // NEW: Action to clear deleted files state back to initial values
    clearDeletedFilesState: (state) => {
      state.deletedFiles = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // =================== FRIEND FOLDERS REDUCERS ===================
      // Fetch friend folders cases
      .addCase(fetchFriendFolders.pending, (state, action) => {
        // Check if this is a load more request (page > 1)
        const isLoadMore = action.meta.arg?.page > 1;
        
        if (isLoadMore) {
          state.loadMoreLoading = true;
        } else {
          state.friendFoldersLoading = true;
        }
        state.friendFoldersError = null;
      })
      .addCase(fetchFriendFolders.fulfilled, (state, action) => {
        const isLoadMore = action.meta.arg?.page > 1;
        
        if (isLoadMore) {
          state.loadMoreLoading = false;
        } else {
          state.friendFoldersLoading = false;
        }

        // Handle pagination - append data for infinite scroll
        if (action?.payload?.data?.pagination?.currentPage === 1) {
          state.friendFolders = action.payload;
        } else {
          // Append new folders for infinite scroll
          if (state.friendFolders?.data?.folders) {
            state.friendFolders.data.folders = [
              ...state.friendFolders.data.folders,
              ...action.payload.data.folders
            ];
            state.friendFolders.data.pagination = action.payload.data.pagination;
          } else {
            state.friendFolders = action.payload;
          }
        }
        
      })
      .addCase(fetchFriendFolders.rejected, (state, action) => {
        const isLoadMore = action.meta.arg?.page > 1;
        
        if (isLoadMore) {
          state.loadMoreLoading = false;
        } else {
          state.friendFoldersLoading = false;
        }
        
        state.friendFoldersError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to fetch friend folders",
          duration: 2,
        });
      })

      // Create friend folder cases
      .addCase(addFriendFolder.pending, (state) => {
        state.createFriendFolderLoading = true;
        state.createFriendFolderError = null;
      })
      .addCase(addFriendFolder.fulfilled, (state, action) => {
        state.createFriendFolder = action.payload;
        state.createFriendFolderLoading = false;
        if (action?.payload?.meta?.success === true) {
          // Add new folder to the list if on first page
          if (state.friendFolders?.data?.pagination?.currentPage === 1) {
            state.friendFolders.data.folders = [
              action.payload?.data?.folder,
              ...state?.friendFolders?.data?.folders,
            ];
          }
          // Increment total count
          if (state.friendFolders?.data?.pagination) {
            state.friendFolders.data.pagination.totalRecords += 1;
          }
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message || "Friend folder created successfully",
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
      .addCase(addFriendFolder.rejected, (state, action) => {
        state.createFriendFolderLoading = false;
        state.createFriendFolderError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to create friend folder",
          duration: 2,
        });
      })

      // Update friend folder cases
      .addCase(updateFriendFolderAction.pending, (state) => {
        state.updateFriendFolderLoading = true;
        state.updateFriendFolderError = null;
      })
      .addCase(updateFriendFolderAction.fulfilled, (state, action) => {
        state.updateFriendFolder = action.payload;
        state.updateFriendFolderLoading = false;
        if (state.friendFolders?.data?.folders) {
          state.friendFolders.data.folders = state.friendFolders.data.folders.map(
            (folder) => folder.id === action.payload.data?.folder?.id ? action.payload.data.folder : folder
          );
        }
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message || "Friend folder updated successfully",
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
      .addCase(updateFriendFolderAction.rejected, (state, action) => {
        state.updateFriendFolderLoading = false;
        state.updateFriendFolderError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to update friend folder",
          duration: 2,
        });
      })

      // Delete friend folder cases
      .addCase(removeFriendFolder.pending, (state) => {
        state.deleteFriendFolderLoading = true;
        state.deleteFriendFolderError = null;
      })
      .addCase(removeFriendFolder.fulfilled, (state, action) => {
        state.deleteFriendFolder = action.payload;
        state.deleteFriendFolderLoading = false;
        if (state.friendFolders?.data?.folders) {
          state.friendFolders.data.folders = state.friendFolders.data.folders.filter(
            (folder) => folder.id !== action.payload.id
          );
          if (state.friendFolders?.data?.pagination) {
            state.friendFolders.data.pagination.totalRecords -= 1;
          }
        }
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message || "Friend folder deleted successfully",
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
      .addCase(removeFriendFolder.rejected, (state, action) => {
        state.deleteFriendFolderLoading = false;
        state.deleteFriendFolderError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to delete friend folder",
          duration: 2,
        });
      })

      // UPDATED: Fetch deleted friend folders cases with pagination support
      .addCase(fetchDeletedFriendFolders.pending, (state, action) => {
        // Check if this is a load more request (page > 1)
        const isLoadMore = action.meta.arg?.page > 1;
        
        if (isLoadMore) {
          state.deletedLoadMoreLoading = true;
        } else {
          state.deletedFriendFoldersLoading = true;
        }
        state.deletedFriendFoldersError = null;
      })
      .addCase(fetchDeletedFriendFolders.fulfilled, (state, action) => {
        const isLoadMore = action.meta.arg?.page > 1;
        
        if (isLoadMore) {
          state.deletedLoadMoreLoading = false;
        } else {
          state.deletedFriendFoldersLoading = false;
        }

        // Handle pagination - append data for infinite scroll
        if (action?.payload?.data?.pagination?.currentPage === 1) {
          state.deletedFriendFolders = action.payload;
        } else {
          // Append new folders for infinite scroll
          if (state.deletedFriendFolders?.data?.folders) {
            state.deletedFriendFolders.data.folders = [
              ...state.deletedFriendFolders.data.folders,
              ...action.payload.data.folders
            ];
            state.deletedFriendFolders.data.pagination = action.payload.data.pagination;
          } else {
            state.deletedFriendFolders = action.payload;
          }
        }
        
       
      })
      .addCase(fetchDeletedFriendFolders.rejected, (state, action) => {
        const isLoadMore = action.meta.arg?.page > 1;
        
        if (isLoadMore) {
          state.deletedLoadMoreLoading = false;
        } else {
          state.deletedFriendFoldersLoading = false;
        }
        
        state.deletedFriendFoldersError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to fetch deleted friend folders",
          duration: 2,
        });
      })

      // Restore friend folder cases
      .addCase(restoreFriendFolderAction.pending, (state) => {
        state.restoreFriendFolderLoading = true;
        state.restoreFriendFolderError = null;
      })
      .addCase(restoreFriendFolderAction.fulfilled, (state, action) => {
        state.restoreFriendFolder = action.payload;
        state.restoreFriendFolderLoading = false;
        if (state.deletedFriendFolders?.data?.folders) {
          state.deletedFriendFolders.data.folders = state.deletedFriendFolders.data.folders.filter(
            (folder) => folder.id !== action.payload.id
          );
          if (state.deletedFriendFolders?.data?.pagination) {
            state.deletedFriendFolders.data.pagination.totalRecords -= 1;
          }
        }
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message || "Friend folder restored successfully",
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
      .addCase(restoreFriendFolderAction.rejected, (state, action) => {
        state.restoreFriendFolderLoading = false;
        state.restoreFriendFolderError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to restore friend folder",
          duration: 2,
        });
      })

      // =================== NESTED FOLDERS REDUCERS ===================
      // Fetch nested folders cases
      .addCase(fetchNestedFolders.pending, (state, action) => {
        // Check if this is a load more request (page > 1)
        const isLoadMore = action.meta.arg?.page > 1;
        
        if (isLoadMore) {
          state.nestedLoadMoreLoading = true;
        } else {
          state.nestedFoldersLoading = true;
        }
        state.nestedFoldersError = null;
      })
      .addCase(fetchNestedFolders.fulfilled, (state, action) => {
        const isLoadMore = action.meta.arg?.page > 1;
        
        if (isLoadMore) {
          state.nestedLoadMoreLoading = false;
        } else {
          state.nestedFoldersLoading = false;
        }

        // Handle pagination - append data for infinite scroll
        if (action?.payload?.data?.pagination?.currentPage === 1) {
          state.nestedFolders = action.payload;
        } else {
          // Append new folders for infinite scroll
          if (state.nestedFolders?.data?.folders) {
            state.nestedFolders.data.folders = [
              ...state.nestedFolders.data.folders,
              ...action.payload.data.folders
            ];
            state.nestedFolders.data.pagination = action.payload.data.pagination;
          } else {
            state.nestedFolders = action.payload;
          }
        }
        
      })
      .addCase(fetchNestedFolders.rejected, (state, action) => {
        const isLoadMore = action.meta.arg?.page > 1;
        
        if (isLoadMore) {
          state.nestedLoadMoreLoading = false;
        } else {
          state.nestedFoldersLoading = false;
        }
        
        state.nestedFoldersError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to fetch nested folders",
          duration: 2,
        });
      })

      // Create nested folder cases
      .addCase(addNestedFolder.pending, (state) => {
        state.createNestedFolderLoading = true;
        state.createNestedFolderError = null;
      })
      .addCase(addNestedFolder.fulfilled, (state, action) => {
        state.createNestedFolder = action.payload;
        state.createNestedFolderLoading = false;
        if (action?.payload?.meta?.success === true) {
          // Add new folder to the list if on first page
          if (state.nestedFolders?.data?.pagination?.currentPage === 1) {
            state.nestedFolders.data.folders = [
              action.payload?.data?.folder,
              ...state?.nestedFolders?.data?.folders,
            ];
          }
          // Increment total count
          if (state.nestedFolders?.data?.pagination) {
            state.nestedFolders.data.pagination.totalRecords += 1;
          }
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message || "Nested folder created successfully",
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
      .addCase(addNestedFolder.rejected, (state, action) => {
        state.createNestedFolderLoading = false;
        state.createNestedFolderError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to create nested folder",
          duration: 2,
        });
      })

      // Update nested folder cases
      .addCase(updateNestedFolderAction.pending, (state) => {
        state.updateNestedFolderLoading = true;
        state.updateNestedFolderError = null;
      })
      .addCase(updateNestedFolderAction.fulfilled, (state, action) => {
        state.updateNestedFolder = action.payload;
        state.updateNestedFolderLoading = false;
        if (state.nestedFolders?.data?.folders) {
          state.nestedFolders.data.folders = state.nestedFolders.data.folders.map(
            (folder) => folder.id === action.payload.data?.folder?.id ? action.payload.data.folder : folder
          );
        }
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message || "Nested folder updated successfully",
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
      .addCase(updateNestedFolderAction.rejected, (state, action) => {
        state.updateNestedFolderLoading = false;
        state.updateNestedFolderError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to update nested folder",
          duration: 2,
        });
      })

      // Delete nested folder cases
      .addCase(removeNestedFolder.pending, (state) => {
        state.deleteNestedFolderLoading = true;
        state.deleteNestedFolderError = null;
      })
      .addCase(removeNestedFolder.fulfilled, (state, action) => {
        state.deleteNestedFolder = action.payload;
        state.deleteNestedFolderLoading = false;
        if (state.nestedFolders?.data?.folders) {
          state.nestedFolders.data.folders = state.nestedFolders.data.folders.filter(
            (folder) => folder.id !== action.payload.id
          );
          if (state.nestedFolders?.data?.pagination) {
            state.nestedFolders.data.pagination.totalRecords -= 1;
          }
        }
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message || "Nested folder deleted successfully",
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
      .addCase(removeNestedFolder.rejected, (state, action) => {
        state.deleteNestedFolderLoading = false;
        state.deleteNestedFolderError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to delete nested folder",
          duration: 2,
        });
      })

      // Fetch deleted nested folders cases
      .addCase(fetchDeletedNestedFolders.pending, (state) => {
        state.deletedNestedFoldersLoading = true;
        state.deletedNestedFoldersError = null;
      })
      .addCase(fetchDeletedNestedFolders.fulfilled, (state, action) => {
        state.deletedNestedFoldersLoading = false;
        state.deletedNestedFolders = action.payload;
        
      })
      .addCase(fetchDeletedNestedFolders.rejected, (state, action) => {
        state.deletedNestedFoldersLoading = false;
        state.deletedNestedFoldersError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to fetch deleted nested folders",
          duration: 2,
        });
      })

      // Restore nested folder cases
      .addCase(restoreNestedFolderAction.pending, (state) => {
        state.restoreNestedFolderLoading = true;
        state.restoreNestedFolderError = null;
      })
      .addCase(restoreNestedFolderAction.fulfilled, (state, action) => {
        state.restoreNestedFolder = action.payload;
        state.restoreNestedFolderLoading = false;
        if (state.deletedNestedFolders?.data?.folders) {
          state.deletedNestedFolders.data.folders = state.deletedNestedFolders.data.folders.filter(
            (folder) => folder.id !== action.payload.id
          );
          if (state.deletedNestedFolders?.data?.pagination) {
            state.deletedNestedFolders.data.pagination.totalRecords -= 1;
          }
        }
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message || "Nested folder restored successfully",
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
      .addCase(restoreNestedFolderAction.rejected, (state, action) => {
        state.restoreNestedFolderLoading = false;
        state.restoreNestedFolderError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to restore nested folder",
          duration: 2,
        });
      })

      // =================== FRIEND FOLDER FILES REDUCERS ===================
      // Fetch friend folder files cases
      .addCase(fetchFriendFolderFiles.pending, (state, action) => {
        // Check if this is a load more request (page > 1)
        const isLoadMore = action.meta.arg?.params?.page > 1;
        
        if (isLoadMore) {
          state.filesLoadMoreLoading = true;
        } else {
          state.friendFolderFilesLoading = true;
        }
        state.friendFolderFilesError = null;
      })
      .addCase(fetchFriendFolderFiles.fulfilled, (state, action) => {
        const isLoadMore = action.meta.arg?.params?.page > 1;
        
        if (isLoadMore) {
          state.filesLoadMoreLoading = false;
        } else {
          state.friendFolderFilesLoading = false;
        }

        // Handle pagination - append data for infinite scroll
        if (action?.payload?.data?.pagination?.currentPage === 1) {
          state.friendFolderFiles = action.payload;
        } else {
          // Append new files for infinite scroll
          if (state.friendFolderFiles?.data?.files) {
            state.friendFolderFiles.data.files = [
              ...state.friendFolderFiles.data.files,
              ...action.payload.data.files
            ];
            state.friendFolderFiles.data.pagination = action.payload.data.pagination;
          } else {
            state.friendFolderFiles = action.payload;
          }
        }
      
      })
      .addCase(fetchFriendFolderFiles.rejected, (state, action) => {
        const isLoadMore = action.meta.arg?.params?.page > 1;
        
        if (isLoadMore) {
          state.filesLoadMoreLoading = false;
        } else {
          state.friendFolderFilesLoading = false;
        }
        
        state.friendFolderFilesError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to fetch friend folder files",
          duration: 2,
        });
      })

      // Upload file to friend folder cases - FIXED VERSION
      .addCase(uploadFileToFriendFolder.pending, (state) => {
        state.uploadFileLoading = true;
        state.uploadFileError = null;
      })
      .addCase(uploadFileToFriendFolder.fulfilled, (state, action) => {
        state.uploadFile = action.payload;
        state.uploadFileLoading = false;
        if (action?.payload?.meta?.success === true) {
          // Add new file(s) to the list if on first page
          if (state.friendFolderFiles?.data?.pagination?.currentPage === 1 && action.payload?.data?.folder_items) {
            // Add uploaded files to the beginning of the list - FIXED: Include all necessary fields
            const newFiles = action.payload.data.folder_items.map(item => ({
              id: item.id,
              upload_user_id: item.upload_user_id, // Include upload_user_id
              friends_folder_id: item.friends_folder_id,
              file_name: item.file_name,
              file_path: item.file_path,
              created_at: item.created_at,
              updated_at: item.updated_at,
              deleted_at: null,
              upload_user: item.upload_user // FIXED: Include upload_user object for profile photo
            }));
            
            state.friendFolderFiles.data.files = [
              ...newFiles,
              ...state?.friendFolderFiles?.data?.files,
            ];
          }
          // Increment total count
          if (state.friendFolderFiles?.data?.pagination && action.payload?.data?.folder_items) {
            state.friendFolderFiles.data.pagination.totalRecords += action.payload.data.folder_items.length;
          }
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message || "File uploaded successfully",
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
      .addCase(uploadFileToFriendFolder.rejected, (state, action) => {
        state.uploadFileLoading = false;
        state.uploadFileError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to upload file",
          duration: 2,
        });
      })

      // Delete friend folder file cases
      .addCase(deleteFriendFolderFileAction.pending, (state) => {
        state.deleteFileLoading = true;
        state.deleteFileError = null;
      })
      .addCase(deleteFriendFolderFileAction.fulfilled, (state, action) => {
        state.deleteFile = action.payload;
        state.deleteFileLoading = false;
        if (state.friendFolderFiles?.data?.files) {
          state.friendFolderFiles.data.files = state.friendFolderFiles.data.files.filter(
            (file) => file.id !== action.payload.data.id
          );
          if (state.friendFolderFiles?.data?.pagination) {
            state.friendFolderFiles.data.pagination.totalRecords -= 1;
          }
        }
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message || "File deleted successfully",
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
      .addCase(deleteFriendFolderFileAction.rejected, (state, action) => {
        state.deleteFileLoading = false;
        state.deleteFileError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to delete file",
          duration: 2,
        });
      })

      // =================== DELETED FILES REDUCERS ===================
      // NEW: Fetch deleted files cases with pagination support
      .addCase(fetchDeletedFiles.pending, (state, action) => {
        // Check if this is a load more request (page > 1)
        const isLoadMore = action.meta.arg?.page > 1;
        
        if (isLoadMore) {
          state.deletedFilesLoadMoreLoading = true;
        } else {
          state.deletedFilesLoading = true;
        }
        state.deletedFilesError = null;
      })
      .addCase(fetchDeletedFiles.fulfilled, (state, action) => {
        const isLoadMore = action.meta.arg?.page > 1;
        
        if (isLoadMore) {
          state.deletedFilesLoadMoreLoading = false;
        } else {
          state.deletedFilesLoading = false;
        }

        // Handle pagination - append data for infinite scroll
        if (action?.payload?.data?.pagination?.currentPage === 1) {
          state.deletedFiles = action.payload;
        } else {
          // Append new files for infinite scroll
          if (state.deletedFiles?.data?.files) {
            state.deletedFiles.data.files = [
              ...state.deletedFiles.data.files,
              ...action.payload.data.files
            ];
            state.deletedFiles.data.pagination = action.payload.data.pagination;
          } else {
            state.deletedFiles = action.payload;
          }
        }
        
       
      })
      .addCase(fetchDeletedFiles.rejected, (state, action) => {
        const isLoadMore = action.meta.arg?.page > 1;
        
        if (isLoadMore) {
          state.deletedFilesLoadMoreLoading = false;
        } else {
          state.deletedFilesLoading = false;
        }
        
        state.deletedFilesError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to fetch deleted files",
          duration: 2,
        });
      })

      // NEW: Restore deleted files cases
      .addCase(restoreDeletedFilesAction.pending, (state) => {
        state.restoreFileLoading = true;
        state.restoreFileError = null;
      })
      .addCase(restoreDeletedFilesAction.fulfilled, (state, action) => {
        state.restoreFile = action.payload;
        state.restoreFileLoading = false;
        if (state.deletedFiles?.data?.files) {
          state.deletedFiles.data.files = state.deletedFiles.data.files.filter(
            (file) => file.id !== action.payload.data.id
          );
          if (state.deletedFiles?.data?.pagination) {
            state.deletedFiles.data.pagination.totalRecords -= 1;
          }
        }
      
      })
      .addCase(restoreDeletedFilesAction.rejected, (state, action) => {
        state.restoreFileLoading = false;
        state.restoreFileError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to restore file",
          duration: 2,
        });
      });
  },
});

export const { 
  setLoadMoreLoading, 
  setNestedLoadMoreLoading,
  setFilesLoadMoreLoading,
  setDeletedLoadMoreLoading, // NEW: Export the new action
  setDeletedFilesLoadMoreLoading, // NEW: Export the new action for deleted files
  clearFriendFoldersState,
  clearNestedFoldersState,
  clearFriendFolderFilesState,
  clearDeletedFilesState // NEW: Export the new action
} = friendFoldersSlice.actions;
export default friendFoldersSlice.reducer;