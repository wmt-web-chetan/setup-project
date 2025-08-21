
import { createSlice } from "@reduxjs/toolkit";
import { notification } from "antd";
import {
  fetchLoanCategories,
  addLoanCategory,
  updateLoanCategoryAction,
  removeLoanCategory
} from "./action";

const initialState = {
  loanCategories: [],
  loanCategoriesLoading: false,
  loanCategoriesError: null,

  createLoanCategory: {},
  createLoanCategoryLoading: false,
  createLoanCategoryError: null,

  updateLoanCategory: {},
  updateLoanCategoryLoading: false,
  updateLoanCategoryError: null,

  deleteLoanCategory: {},
  deleteLoanCategoryLoading: false,
  deleteLoanCategoryError: null,
};

const loanCategoriesSlice = createSlice({
  name: "loanCategories",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch loan categories cases
      .addCase(fetchLoanCategories.pending, (state) => {
        state.loanCategoriesLoading = true;
        state.loanCategoriesError = null;
      })
      .addCase(fetchLoanCategories.fulfilled, (state, action) => {
        state.loanCategoriesLoading = false;
        state.loanCategories = action.payload;
       
      })
      .addCase(fetchLoanCategories.rejected, (state, action) => {
        state.loanCategoriesLoading = false;
        state.loanCategoriesError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to fetch loan categories",
          duration: 2,
        });
      })

      // Create loan category cases
      .addCase(addLoanCategory.pending, (state) => {
        state.createLoanCategoryLoading = true;
        state.createLoanCategoryError = null;
      })
      .addCase(addLoanCategory.fulfilled, (state, action) => {
        state.createLoanCategory = action.payload;
        state.createLoanCategoryLoading = false;
        
        // Update the list if we're on the first page
        if (state.loanCategories?.data?.pagination?.currentPage === 1 && action?.payload?.data) {
          state.loanCategories.data.data = [
            action.payload.data,
            ...state?.loanCategories?.data?.data || [],
          ];
          
          // Increment total count
          if (state.loanCategories?.data?.pagination) {
            state.loanCategories.data.pagination.totalRecords += 1;
          }
        }
        
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message || "Loan category created successfully",
            duration: 2,
          });
        } 
      })
      .addCase(addLoanCategory.rejected, (state, action) => {
        state.createLoanCategoryLoading = false;
        state.createLoanCategoryError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to create loan category",
          duration: 2,
        });
      })

      // Update loan category cases
      .addCase(updateLoanCategoryAction.pending, (state) => {
        state.updateLoanCategoryLoading = true;
        state.updateLoanCategoryError = null;
      })
      .addCase(updateLoanCategoryAction.fulfilled, (state, action) => {
        state.updateLoanCategory = action.payload;
        state.updateLoanCategoryLoading = false;
        
        // Update the item in the list
        if (state.loanCategories?.data?.data && action?.payload?.data) {
          state.loanCategories.data.data = state.loanCategories.data.data.map(
            (category) => category.id === action.payload.data.id ? action.payload.data : category
          );
        }
        
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message || "Loan category updated successfully",
            duration: 2,
          });
        } 
      })
      .addCase(updateLoanCategoryAction.rejected, (state, action) => {
        state.updateLoanCategoryLoading = false;
        state.updateLoanCategoryError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to update loan category",
          duration: 2,
        });
      })

      // Delete loan category cases
      .addCase(removeLoanCategory.pending, (state) => {
        state.deleteLoanCategoryLoading = true;
        state.deleteLoanCategoryError = null;
      })
      .addCase(removeLoanCategory.fulfilled, (state, action) => {
        state.deleteLoanCategory = action.payload;
        state.deleteLoanCategoryLoading = false;
        
        // Remove the item from the list
        if (state.loanCategories?.data?.data) {
          state.loanCategories.data.data = state.loanCategories.data.data.filter(
            (category) => category.id !== action.payload.id
          );
          
          // Decrement total count
          if (state.loanCategories?.data?.pagination) {
            state.loanCategories.data.pagination.totalRecords -= 1;
          }
        }
        
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message || "Loan category deleted successfully",
            duration: 2,
          });
        } 
      })
      .addCase(removeLoanCategory.rejected, (state, action) => {
        state.deleteLoanCategoryLoading = false;
        state.deleteLoanCategoryError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to delete loan category",
          duration: 2,
        });
      });
  },
});

export default loanCategoriesSlice.reducer;