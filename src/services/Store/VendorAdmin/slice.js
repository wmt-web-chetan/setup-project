import { createSlice } from "@reduxjs/toolkit";
import { notification } from "antd";
import {
  addVendor,
  addVendorStoreCategory,
  addVendorSuggestion,
  favoriteVendorAction,
  fetchVendorById,
  fetchVendorDetailById,
  fetchVendorRatingList,
  fetchVendors,
  fetchVendorsList,
  fetchVendorStoreCategories,
  fetchVendorStoreCategoryById,
  fetchVendorSuggestions,
  rateVendorAction,
  unfavoriteVendorAction,
  updateVendorAction,
  updateVendorStoreCategoryAction,
} from "./action";

const initialState = {
  vendorCategories: [],
  vendorCategoriesLoading: false,
  vendorCategoriesError: null,

  createVendorCategory: {},
  createVendorCategoryLoading: false,
  createVendorCategoryError: null,

  updateVendorCategory: {},
  updateVendorCategoryLoading: false,
  updateVendorCategoryError: null,

  vendorsList: [],
  vendorsListLoading: false,
  vendorsListError: null,

  createVendor: {},
  createVendorLoading: false,
  createVendorError: null,

  updateVendor: {},
  updateVendorLoading: false,
  updateVendorError: null,

  singleVendor: {},
  singleVendorLoading: false,
  singleVendorError: null,

  vendors: [],
  vendorsLoading: false,
  vendorsError: null,

  vendorDetails: {},
  vendorDetailsLoading: false,
  vendorDetailsError: null,

  rateVendor: {},
  rateVendorLoading: false,
  rateVendorError: null,

  favoriteVendor: {},
  favoriteVendorLoading: false,
  favoriteVendorError: null,

  unfavoriteVendor: {},
  unfavoriteVendorLoading: false,
  unfavoriteVendorError: null,

  createVendorSuggestion: {},
  createVendorSuggestionLoading: false,
  createVendorSuggestionError: null,

  vendorSuggestions: [],
  vendorSuggestionsLoading: false,
  vendorSuggestionsError: null,

  vendorRatings: [],
  vendorRatingsLoading: false,
  vendorRatingsError: null,
  vendorRatingsHasMore: true,
  vendorRatingsCurrentPage: 1,

  vendorStoreCategoryDetails: {},
  vendorStoreCategoryDetailsLoading: false,
  vendorStoreCategoryDetailsError: null,
};

const vendorStoreCategoriesSlice = createSlice({
  name: "vendorStoreCategories",
  initialState,
  reducers: {
    resetVendorRatings: (state) => {
      state.vendorRatings = [];
      state.vendorRatingsLoading = false;
      state.vendorRatingsError = null;
      state.vendorRatingsHasMore = true;
      state.vendorRatingsCurrentPage = 1;
    },
  },  extraReducers: (builder) => {
    builder
      // Fetch vendor store categories cases
      .addCase(fetchVendorStoreCategories.pending, (state) => {
        state.vendorCategoriesLoading = true;
        state.vendorCategoriesError = null;
      })
      .addCase(fetchVendorStoreCategories.fulfilled, (state, action) => {
        state.vendorCategoriesLoading = false;
        state.vendorCategories = action.payload;
      })
      .addCase(fetchVendorStoreCategories.rejected, (state, action) => {
        state.vendorCategoriesLoading = false;
        state.vendorCategoriesError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message ||
            "Failed to fetch vendor store categories",
          duration: 2,
        });
      })

      // Create vendor store category cases
      .addCase(addVendorStoreCategory.pending, (state) => {
        state.createVendorCategoryLoading = true;
        state.createVendorCategoryError = null;
      })
      .addCase(addVendorStoreCategory.fulfilled, (state, action) => {
        state.createVendorCategory = action.payload;
        state.createVendorCategoryLoading = false;
      })
      .addCase(addVendorStoreCategory.rejected, (state, action) => {
        state.createVendorCategoryLoading = false;
        state.createVendorCategoryError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to create category",
          duration: 2,
        });
      })

      // Update vendor store category cases
      .addCase(updateVendorStoreCategoryAction.pending, (state) => {
        state.updateVendorCategoryLoading = true;
        state.updateVendorCategoryError = null;
      })
      .addCase(updateVendorStoreCategoryAction.fulfilled, (state, action) => {
        state.updateVendorCategory = action.payload;
        state.updateVendorCategoryLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message || "Category updated successfully",
            duration: 2,
          });
        }
      })
      .addCase(updateVendorStoreCategoryAction.rejected, (state, action) => {
        state.updateVendorCategoryLoading = false;
        state.updateVendorCategoryError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to update category",
          duration: 2,
        });
      });

    builder
      // Fetch vendors list cases
      .addCase(fetchVendorsList.pending, (state) => {
        state.vendorsListLoading = true;
        state.vendorsListError = null;
      })
      .addCase(fetchVendorsList.fulfilled, (state, action) => {
        state.vendorsListLoading = false;
        state.vendorsList = action.payload;
      })
      .addCase(fetchVendorsList.rejected, (state, action) => {
        state.vendorsListLoading = false;
        state.vendorsListError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch vendors list",
          duration: 2,
        });
      });
    builder
      // Create vendor cases
      .addCase(addVendor.pending, (state) => {
        state.createVendorLoading = true;
        state.createVendorError = null;
      })
      .addCase(addVendor.fulfilled, (state, action) => {
        state.createVendor = action.payload;
        state.createVendorLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        }
      })
      .addCase(addVendor.rejected, (state, action) => {
        state.createVendorLoading = false;
        state.createVendorError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to create vendor",
          duration: 2,
        });
      });

    builder
      .addCase(updateVendorAction.pending, (state) => {
        state.updateVendorLoading = true;
        state.updateVendorError = null;
      })
      .addCase(updateVendorAction.fulfilled, (state, action) => {
        state.updateVendor = action.payload;
        state.updateVendorLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description: action?.payload?.meta?.message,
            duration: 2,
          });
        }
      })
      .addCase(updateVendorAction.rejected, (state, action) => {
        state.updateVendorLoading = false;
        state.updateVendorError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to update vendor",
          duration: 2,
        });
      });

    builder
      .addCase(fetchVendorById.pending, (state) => {
        state.singleVendorLoading = true;
        state.singleVendorError = null;
      })
      .addCase(fetchVendorById.fulfilled, (state, action) => {
        state.singleVendorLoading = false;
        state.singleVendor = action.payload;
      })
      .addCase(fetchVendorById.rejected, (state, action) => {
        state.singleVendorLoading = false;
        state.singleVendorError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch vendor details",
          duration: 2,
        });
      });

    builder
      // Fetch vendors cases
      .addCase(fetchVendors.pending, (state) => {
        state.vendorsLoading = true;
        state.vendorsError = null;
      })
      .addCase(fetchVendors.fulfilled, (state, action) => {
        state.vendorsLoading = false;
        state.vendors = action.payload;
      })
      .addCase(fetchVendors.rejected, (state, action) => {
        state.vendorsLoading = false;
        state.vendorsError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch vendors",
          duration: 2,
        });
      });

    builder
      .addCase(fetchVendorDetailById.pending, (state) => {
        state.vendorDetailsLoading = true;
        state.vendorDetailsError = null;
      })
      .addCase(fetchVendorDetailById.fulfilled, (state, action) => {
        state.vendorDetailsLoading = false;
        state.vendorDetails = action.payload;
      })
      .addCase(fetchVendorDetailById.rejected, (state, action) => {
        state.vendorDetailsLoading = false;
        state.vendorDetailsError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to fetch vendor details",
          duration: 2,
        });
      });

    builder
      .addCase(rateVendorAction.pending, (state) => {
        state.rateVendorLoading = true;
        state.rateVendorError = null;
      })
      .addCase(rateVendorAction.fulfilled, (state, action) => {
        state.rateVendor = action.payload;
        state.rateVendorLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message || "Vendor rated successfully",
            duration: 2,
          });
        }
      })
      .addCase(rateVendorAction.rejected, (state, action) => {
        state.rateVendorLoading = false;
        state.rateVendorError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to rate vendor",
          duration: 2,
        });
      });

    builder
      .addCase(favoriteVendorAction.pending, (state) => {
        state.favoriteVendorLoading = true;
        state.favoriteVendorError = null;
      })
      .addCase(favoriteVendorAction.fulfilled, (state, action) => {
        state.favoriteVendor = action.payload;
        state.favoriteVendorLoading = false;
        // if (action?.payload?.meta?.success === true) {
        //   notification.success({
        //     message: "Success",
        //     description:
        //       action?.payload?.meta?.message || "Vendor favorited successfully",
        //     duration: 2,
        //   });
        // }
      })
      .addCase(favoriteVendorAction.rejected, (state, action) => {
        state.favoriteVendorLoading = false;
        state.favoriteVendorError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to favorite vendor",
          duration: 2,
        });
      });

    builder
      .addCase(unfavoriteVendorAction.pending, (state) => {
        state.unfavoriteVendorLoading = true;
        state.unfavoriteVendorError = null;
      })
      .addCase(unfavoriteVendorAction.fulfilled, (state, action) => {
        state.unfavoriteVendor = action.payload;
        state.unfavoriteVendorLoading = false;
        // if (action?.payload?.meta?.success === true) {
        //   notification.success({
        //     message: "Success",
        //     description:
        //       action?.payload?.meta?.message ||
        //       "Vendor unfavorited successfully",
        //     duration: 2,
        //   });
        // }
      })
      .addCase(unfavoriteVendorAction.rejected, (state, action) => {
        state.unfavoriteVendorLoading = false;
        state.unfavoriteVendorError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message || "Failed to unfavorite vendor",
          duration: 2,
        });
      });

    builder
      // Create vendor suggestion cases
      .addCase(addVendorSuggestion.pending, (state) => {
        state.createVendorSuggestionLoading = true;
        state.createVendorSuggestionError = null;
      })
      .addCase(addVendorSuggestion.fulfilled, (state, action) => {
        state.createVendorSuggestion = action.payload;
        state.createVendorSuggestionLoading = false;
        if (action?.payload?.meta?.success === true) {
          notification.success({
            message: "Success",
            description:
              action?.payload?.meta?.message ||
              "Vendor suggestion created successfully",
            duration: 2,
          });
        }
      })
      .addCase(addVendorSuggestion.rejected, (state, action) => {
        state.createVendorSuggestionLoading = false;
        state.createVendorSuggestionError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message ||
            "Failed to create vendor suggestion",
          duration: 2,
        });
      });

    builder
      // Fetch vendor suggestions cases
      .addCase(fetchVendorSuggestions.pending, (state) => {
        state.vendorSuggestionsLoading = true;
        state.vendorSuggestionsError = null;
      })
      .addCase(fetchVendorSuggestions.fulfilled, (state, action) => {
        state.vendorSuggestionsLoading = false;
        state.vendorSuggestions = action.payload;
      })
      .addCase(fetchVendorSuggestions.rejected, (state, action) => {
        state.vendorSuggestionsLoading = false;
        state.vendorSuggestionsError = action.payload;
        notification.error({
          message: "Error",
          description:
            action?.payload?.meta?.message ||
            "Failed to fetch vendor suggestions",
          duration: 2,
        });
      });


      builder
      // Fetch vendor rating list cases
      .addCase(fetchVendorRatingList.pending, (state) => {
        state.vendorRatingsLoading = true;
        state.vendorRatingsError = null;
      })
      .addCase(fetchVendorRatingList.fulfilled, (state, action) => {
        state.vendorRatingsLoading = false;
        const newRatings = action?.payload?.data?.vendor || [];
        const isFirstPage = action?.meta?.arg?.page === 1;
        
        if (isFirstPage) {
          state.vendorRatings = action.payload;
        } else {
          // Append new ratings to existing ones for infinite scroll
          state.vendorRatings = {
            ...action.payload,
            data: {
              ...action.payload.data,
              vendor: [...(state.vendorRatings?.data?.vendor || []), ...newRatings]
            }
          };
        }
        
        // Update pagination states
        const pagination = action?.payload?.data?.pagination;
        if (pagination) {
          state.vendorRatingsCurrentPage = pagination.current_page;
          state.vendorRatingsHasMore = pagination.current_page < pagination.last_page;
        }
        
       
      })
      .addCase(fetchVendorRatingList.rejected, (state, action) => {
        state.vendorRatingsLoading = false;
        state.vendorRatingsError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to fetch vendor ratings",
          duration: 2,
        });
      });

      builder
      // Fetch vendor store category by ID cases
      .addCase(fetchVendorStoreCategoryById.pending, (state) => {
        state.vendorStoreCategoryDetailsLoading = true;
        state.vendorStoreCategoryDetailsError = null;
      })
      .addCase(fetchVendorStoreCategoryById.fulfilled, (state, action) => {
        state.vendorStoreCategoryDetailsLoading = false;
        state.vendorStoreCategoryDetails = action.payload;
      })
      .addCase(fetchVendorStoreCategoryById.rejected, (state, action) => {
        state.vendorStoreCategoryDetailsLoading = false;
        state.vendorStoreCategoryDetailsError = action.payload;
        notification.error({
          message: "Error",
          description: action?.payload?.meta?.message || "Failed to fetch vendor store category details",
          duration: 2,
        });
      });
  },
});

export const { resetVendorRatings } = vendorStoreCategoriesSlice.actions;

export default vendorStoreCategoriesSlice.reducer;
