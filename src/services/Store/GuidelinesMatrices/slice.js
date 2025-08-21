import { createSlice } from "@reduxjs/toolkit";
import { notification } from "antd";
import { 
  addLoanCategoryFolder, 
  deleteLoanCategoryFileAction, 
  deleteLoanCategoryFolderAction, 
  fetchDeleteFileList, 
  fetchLoanCategoryFolderDetails, 
  fetchLoanCategoryFolders, 
  restoreFileAction, 
  restoreFolderAction, 
  updateLoanCategoryFolderAction, 
  uploadLoanCategoryFileAction 
} from "./action";

const initialState = {
  loanCategoryFolders: {
    data: {
      folders: [],
      pagination: {
        currentPage: 1,
        totalPage: 1,
        perPage: 30,
        totalRecords: 0,
      }
    }
  },
  loanCategoryFoldersLoading: false,
  loanCategoryFoldersError: null,
  isLoadingMoreFolders: false, // Add loading more state

  createLoanCategoryFolder: {},
  createLoanCategoryFolderLoading: false,
  createLoanCategoryFolderError: null,  

  updateLoanCategoryFolder: {},
  updateLoanCategoryFolderLoading: false,
  updateLoanCategoryFolderError: null,

  deleteLoanCategoryFolder: {},
  deleteLoanCategoryFolderLoading: false,
  deleteLoanCategoryFolderError: null,

  loanCategoryFolderDetails: {},
  loanCategoryFolderDetailsLoading: false,
  loanCategoryFolderDetailsError: null,

  fileUpload: {},
  fileUploadLoading: false,
  fileUploadError: null,

  deleteFileList: [],
  deleteFileListLoading: false,
  deleteFileListError: null,

  deleteFile: {},
  deleteFileLoading: false,
  deleteFileError: null,

  restoreFolder: {},
  restoreFolderLoading: false,
  restoreFolderError: null,

  restoreFile: {},
  restoreFileLoading: false,
  restoreFileError: null,
};

const loanCategorySlice = createSlice({
  name: "guidelineMatrices",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch loan category folders cases
      .addCase(fetchLoanCategoryFolders.pending, (state, action) => {
        // Check if we're loading more data (page > 1) or initial load
        const isLoadingMore = action.meta.arg?.page > 1;

        if (isLoadingMore) {
          state.isLoadingMoreFolders = true;
        } else {
          state.loanCategoryFoldersLoading = true;
        }
        state.loanCategoryFoldersError = null;
      })
      .addCase(fetchLoanCategoryFolders.fulfilled, (state, action) => {
        const isLoadingMore = action.meta.arg?.page > 1;
        const responseData = action.payload?.data || {};
        const folders = responseData.folders || [];
        const pagination = responseData.pagination || {
          currentPage: 1,
          totalPage: 1,
          perPage: 30,
          totalRecords: 0
        };

        if (isLoadingMore) {
          // Append new folders to existing list
          if (state.loanCategoryFolders?.data?.folders) {
            state.loanCategoryFolders.data.folders = [
              ...state.loanCategoryFolders.data.folders,
              ...folders
            ];
          }
          // Update pagination
          if (pagination) {
            state.loanCategoryFolders.data.pagination = pagination;
          }
          state.isLoadingMoreFolders = false;
        } else {
          // Initial load or refresh
          state.loanCategoryFoldersLoading = false;
          state.loanCategoryFolders.data.folders = folders;
          state.loanCategoryFolders.data.pagination = pagination;
        }

      
      })
      .addCase(fetchLoanCategoryFolders.rejected, (state, action) => {
        const isLoadingMore = action.meta.arg?.page > 1;

        if (isLoadingMore) {
          state.isLoadingMoreFolders = false;
        } else {
          state.loanCategoryFoldersLoading = false;
        }
        state.loanCategoryFoldersError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to fetch loan category folders",
          duration: 2,
        });
      });

      builder
       // Create loan category folder cases
       .addCase(addLoanCategoryFolder.pending, (state) => {
        state.createLoanCategoryFolderLoading = true;
        state.createLoanCategoryFolderError = null;
      })
      .addCase(addLoanCategoryFolder.fulfilled, (state, action) => {
        state.createLoanCategoryFolderLoading = false;
        state.createLoanCategoryFolder = action.payload;
        
        // If the folder was created successfully, add it to the folders list
        if (action?.payload?.meta?.success === true) {
          // If we have folders data already loaded
          if (state.loanCategoryFolders?.data?.folders) {
            // Add the new folder to the beginning of the list
            state.loanCategoryFolders.data.folders = [
              action.payload?.data,
              ...state.loanCategoryFolders.data.folders,
            ];
            
            // Update the total count in pagination
            if (state.loanCategoryFolders?.data?.pagination) {
              state.loanCategoryFolders.data.pagination.totalRecords += 1;
            }
          }
          
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message || "Folder created successfully",
            duration: 2,
          });
        } 
      })
      .addCase(addLoanCategoryFolder.rejected, (state, action) => {
        state.createLoanCategoryFolderLoading = false;
        state.createLoanCategoryFolderError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to create folder",
          duration: 2,
        });
      });

      builder
       // Update loan category folder cases
       .addCase(updateLoanCategoryFolderAction.pending, (state) => {
        state.updateLoanCategoryFolderLoading = true;
        state.updateLoanCategoryFolderError = null;
      })
      .addCase(updateLoanCategoryFolderAction.fulfilled, (state, action) => {
        state.updateLoanCategoryFolderLoading = false;
        state.updateLoanCategoryFolder = action.payload;
        
        // If the folder was updated successfully, update it in the folders list
        if (action?.payload?.meta?.success === true) {
          // If we have folders data already loaded
          if (state.loanCategoryFolders?.data?.folders) {
            // Update the folder in the list
            state.loanCategoryFolders.data.folders = state.loanCategoryFolders.data.folders.map(
              (folder) => folder.id === action.payload?.data?.id ? action.payload?.data : folder
            );
          }
          
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message || "Folder renamed successfully",
            duration: 2,
          });
        } 
      })
      .addCase(updateLoanCategoryFolderAction.rejected, (state, action) => {
        state.updateLoanCategoryFolderLoading = false;
        state.updateLoanCategoryFolderError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to rename folder",
          duration: 2,
        });
      });

      builder
         // Delete loan category folder cases
         .addCase(deleteLoanCategoryFolderAction.pending, (state) => {
          state.deleteLoanCategoryFolderLoading = true;
          state.deleteLoanCategoryFolderError = null;
        })
        .addCase(deleteLoanCategoryFolderAction.fulfilled, (state, action) => {
          state.deleteLoanCategoryFolderLoading = false;
          state.deleteLoanCategoryFolder = action.payload;
          
          // If the folder was deleted successfully, remove it from the folders list
          if (action?.payload?.meta?.success === true) {
            // If we have folders data already loaded
            if (state.loanCategoryFolders?.data?.folders) {
              // Remove the folder from the list
              state.loanCategoryFolders.data.folders = state.loanCategoryFolders.data.folders.filter(
                (folder) => folder.id !== action.payload.id
              );
              
              // Update the total count in pagination
              if (state.loanCategoryFolders?.data?.pagination && 
                  state.loanCategoryFolders.data.pagination.totalRecords > 0) {
                state.loanCategoryFolders.data.pagination.totalRecords -= 1;
              }
            }
            
            notification.success({
              message: "Success",
              description: action?.payload?.meta?.message || "Folder deleted successfully",
              duration: 2,
            });
          } 
        })
        .addCase(deleteLoanCategoryFolderAction.rejected, (state, action) => {
          state.deleteLoanCategoryFolderLoading = false;
          state.deleteLoanCategoryFolderError = action.payload;
          notification.error({
            message: "Error",
            description: action?.payload?.meta?.message || "Failed to delete folder",
            duration: 2,
          });
        })
        
      builder
      .addCase(fetchLoanCategoryFolderDetails.pending, (state) => {
        state.loanCategoryFolderDetailsLoading = true;
        state.loanCategoryFolderDetailsError = null;
      })
      .addCase(fetchLoanCategoryFolderDetails.fulfilled, (state, action) => {
        state.loanCategoryFolderDetailsLoading = false;
        state.loanCategoryFolderDetails = action.payload;
        
      
      })
      .addCase(fetchLoanCategoryFolderDetails.rejected, (state, action) => {
        state.loanCategoryFolderDetailsLoading = false;
        state.loanCategoryFolderDetailsError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to fetch folder details",
          duration: 2,
        });
      });

      builder

      .addCase(deleteLoanCategoryFileAction.pending, (state) => {
        state.deleteFileLoading = true;
        state.deleteFileError = null;
      })
      .addCase(deleteLoanCategoryFileAction.fulfilled, (state, action) => {
        state.deleteFileLoading = false;
        state.deleteFile = action.payload;
        
        // If the file was deleted successfully, update the folder details
        if (action?.payload?.meta?.success === true && 
            state.loanCategoryFolderDetails?.data?.folder?.folder_items) {
          // Remove the deleted file from folder_items
          state.loanCategoryFolderDetails.data.folder.folder_items = 
            state.loanCategoryFolderDetails.data.folder.folder_items.filter(
              (item) => item.id !== action.payload.fileId
            );
        }
        
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message || "File deleted successfully",
            duration: 2,
          });
        } 
      })
      .addCase(deleteLoanCategoryFileAction.rejected, (state, action) => {
        state.deleteFileLoading = false;
        state.deleteFileError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to delete file",
          duration: 2,
        });
      });

      builder
      .addCase(uploadLoanCategoryFileAction.pending, (state) => {
        state.fileUploadLoading = true;
        state.fileUploadError = null;
      })
      .addCase(uploadLoanCategoryFileAction.fulfilled, (state, action) => {
        state.fileUploadLoading = false;
        state.fileUpload = action.payload;
        if (action?.payload?.meta?.success === true) {
          const fileCount = action?.payload?.data?.files?.length || 0;
          notification.success({
            message: "Success",
            description: fileCount > 1 
              ? `${fileCount} files uploaded successfully` 
              : action?.payload?.meta?.message || "File uploaded successfully",
            duration: 2,
          });
        } 
      })
      .addCase(uploadLoanCategoryFileAction.rejected, (state, action) => {
        state.fileUploadLoading = false;
        state.fileUploadError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to upload file",
          duration: 2,
        });
      });

      builder
      // Fetch delete file list cases
      .addCase(fetchDeleteFileList.pending, (state) => {
        state.deleteFileListLoading = true;
        state.deleteFileListError = null;
      })
      .addCase(fetchDeleteFileList.fulfilled, (state, action) => {
        state.deleteFileListLoading = false;
        state.deleteFileList = action.payload;
       
      })
      .addCase(fetchDeleteFileList.rejected, (state, action) => {
        state.deleteFileListLoading = false;
        state.deleteFileListError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to fetch delete file list",
          duration: 2,
        });
      });

      builder
      // Restore folder cases
      .addCase(restoreFolderAction.pending, (state) => {
        state.restoreFolderLoading = true;
        state.restoreFolderError = null;
      })
      .addCase(restoreFolderAction.fulfilled, (state, action) => {
        state.restoreFolderLoading = false;
        state.restoreFolder = action.payload;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message || "Folder restored successfully",
            duration: 2,
          });
        } 
      })
      .addCase(restoreFolderAction.rejected, (state, action) => {
        state.restoreFolderLoading = false;
        state.restoreFolderError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to restore folder",
          duration: 2,
        });
      });

      builder
      .addCase(restoreFileAction.pending, (state) => {
        state.restoreFileLoading = true;
        state.restoreFileError = null;
      })
      .addCase(restoreFileAction.fulfilled, (state, action) => {
        state.restoreFileLoading = false;
        state.restoreFile = action.payload;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message || "File restored successfully",
            duration: 2,
          });
        } 
      })
      .addCase(restoreFileAction.rejected, (state, action) => {
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

export default loanCategorySlice.reducer;