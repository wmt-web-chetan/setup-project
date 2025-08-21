import { createSlice } from "@reduxjs/toolkit";
import { notification } from "antd";
import {
  addArticle,
  addCategory,
  fetchArticleFileById,
  fetchCategories,
  fetchCategoriesDetails,
  fetchCategorySearch,
  fetchCategorySearchSuggestions,
  fetchVideoById,
  removeArticle,
  removeCategory,
  updateArticleAction,
  updateCategoryAction,
} from "./action";

const initialState = {
  categories: [],
  categoriesLoading: false,
  categoriesError: null,

  createCategory: {},
  createCategoryLoading: false,
  createCategoryError: null,

  updateCategory: {},
  updateCategoryLoading: false,
  updateCategoryError: null,

  deleteCategory: {},
  deleteCategoryLoading: false,
  deleteCategoryError: null,

  categoriesDetails: [],
  categoriesDetailsLoading: false,
  categoriesDetailsError: null,

  createArticle: {},
  createArticleLoading: false,
  createArticleError: null,

  deleteArticle: {},
  deleteArticleLoading: false,
  deleteArticleError: null,

  articleFileDetails: {},
  articleFileDetailsLoading: false,
  articleFileDetailsError: null,

  videoDetails: {},
  videoDetailsLoading: false,
  videoDetailsError: null,

  updateArticle: {},
  updateArticleLoading: false,
  updateArticleError: null,

  categorySearchSuggestions: [],
  categorySearchSuggestionsLoading: false,
  categorySearchSuggestionsError: null,

  categorySearchResults: [],
  categorySearchLoading: false,
  categorySearchError: null,

};

const categoriesSlice = createSlice({
  name: "support",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch categories cases
      .addCase(fetchCategories.pending, (state) => {
        state.categoriesLoading = true;
        state.categoriesError = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.categoriesError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch categories",
          duration: 2,
        });
      });
    builder
      // Create category cases
      .addCase(addCategory.pending, (state) => {
        state.createCategoryLoading = true;
        state.createCategoryError = null;
      })
      .addCase(addCategory.fulfilled, (state, action) => {
        state.createCategory = action.payload;
        state.createCategoryLoading = false;
        console.log("action", action);
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        }
      })
      .addCase(addCategory.rejected, (state, action) => {
        state.createCategoryLoading = false;
        state.createCategoryError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to create category",
          duration: 2,
        });
      });

    // Update category cases
    builder
      .addCase(updateCategoryAction.pending, (state) => {
        state.updateCategoryLoading = true;
        state.updateCategoryError = null;
      })
      .addCase(updateCategoryAction.fulfilled, (state, action) => {
        state.updateCategory = action.payload;
        state.updateCategoryLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        }
      })
      .addCase(updateCategoryAction.rejected, (state, action) => {
        state.updateCategoryLoading = false;
        state.updateCategoryError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to update category",
          duration: 2,
        });
      });

    // Delete category cases
    builder
      .addCase(removeCategory.pending, (state) => {
        state.deleteCategoryLoading = true;
        state.deleteCategoryError = null;
      })
      .addCase(removeCategory.fulfilled, (state, action) => {
        state.deleteCategory = action.payload;
        state.deleteCategoryLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        }
      })
      .addCase(removeCategory.rejected, (state, action) => {
        state.deleteCategoryLoading = false;
        state.deleteCategoryError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to delete category",
          duration: 2,
        });
      });

    builder
      .addCase(fetchCategoriesDetails.pending, (state) => {
        state.categoriesDetailsLoading = true;
        state.categoriesDetailsError = null;
      })
      .addCase(fetchCategoriesDetails.fulfilled, (state, action) => {
        state.categoriesDetailsLoading = false;
        state.categoriesDetails = action.payload;
      
      })
      .addCase(fetchCategoriesDetails.rejected, (state, action) => {
        state.categoriesDetailsLoading = false;
        state.categoriesDetailsError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch categories",
          duration: 2,
        });
      });

    builder
      // Create article cases
      .addCase(addArticle.pending, (state) => {
        state.createArticleLoading = true;
        state.createArticleError = null;
      })
      .addCase(addArticle.fulfilled, (state, action) => {
        state.createArticle = action.payload;
        state.createArticleLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message || "Article created successfully",
            duration: 2,
          });
        }
      })
      .addCase(addArticle.rejected, (state, action) => {
        state.createArticleLoading = false;
        state.createArticleError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to create article",
          duration: 2,
        });
      });

    builder
      // Delete article cases
      .addCase(removeArticle.pending, (state) => {
        state.deleteArticleLoading = true;
        state.deleteArticleError = null;
      })
      .addCase(removeArticle.fulfilled, (state, action) => {
        state.deleteArticle = action.payload;
        state.deleteArticleLoading = false;

        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        }
      })
      .addCase(removeArticle.rejected, (state, action) => {
        state.deleteArticleLoading = false;
        state.deleteArticleError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to delete article",
          duration: 2,
        });
      });

    builder
      // Fetch article file by ID cases
      .addCase(fetchArticleFileById.pending, (state) => {
        state.articleFileDetailsLoading = true;
        state.articleFileDetailsError = null;
      })
      .addCase(fetchArticleFileById.fulfilled, (state, action) => {
        state.articleFileDetailsLoading = false;
        state.articleFileDetails = action.payload;
       
      })
      .addCase(fetchArticleFileById.rejected, (state, action) => {
        state.articleFileDetailsLoading = false;
        state.articleFileDetailsError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch article file",
          duration: 2,
        });
      });

    builder
      // Fetch article file by ID cases
      .addCase(fetchVideoById.pending, (state) => {
        state.videoDetailsLoading = true;
        state.videoDetailsError = null;
      })
      .addCase(fetchVideoById.fulfilled, (state, action) => {
        state.videoDetailsLoading = false;
        state.videoDetails = action.payload;

      })
      .addCase(fetchVideoById.rejected, (state, action) => {
        state.videoDetailsLoading = false;
        state.videoDetailsError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch article file",
          duration: 2,
        });
      });

    builder
      // Update article cases
      .addCase(updateArticleAction.pending, (state) => {
        state.updateArticleLoading = true;
        state.updateArticleError = null;
      })
      .addCase(updateArticleAction.fulfilled, (state, action) => {
        state.updateArticle = action.payload;
        state.updateArticleLoading = false;

        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message || "Article updated successfully",
            duration: 2,
          });
        }
      })
      .addCase(updateArticleAction.rejected, (state, action) => {
        state.updateArticleLoading = false;
        state.updateArticleError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to update article",
          duration: 2,
        });
      });

    builder
      // Fetch category search suggestions cases
      .addCase(fetchCategorySearchSuggestions.pending, (state) => {
        state.categorySearchSuggestionsLoading = true;
        state.categorySearchSuggestionsError = null;
      })
      .addCase(fetchCategorySearchSuggestions.fulfilled, (state, action) => {
        state.categorySearchSuggestionsLoading = false;
        state.categorySearchSuggestions = action.payload;
      })
      .addCase(fetchCategorySearchSuggestions.rejected, (state, action) => {
        state.categorySearchSuggestionsLoading = false;
        state.categorySearchSuggestionsError = action.payload;
      });

      builder
      // Search categories cases
      .addCase(fetchCategorySearch.pending, (state) => {
        state.categorySearchLoading = true;
        state.categorySearchError = null;
      })
      .addCase(fetchCategorySearch.fulfilled, (state, action) => {
        state.categorySearchLoading = false;
        state.categorySearchResults = action.payload;
       
      })
      .addCase(fetchCategorySearch.rejected, (state, action) => {
        state.categorySearchLoading = false;
        state.categorySearchError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to search categories",
          duration: 2,
        });
      });
  },
});

export default categoriesSlice.reducer;
