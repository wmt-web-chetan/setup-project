import { get, post } from "../../utils/apiWrapper";

// GET API for vendor store categories list
export const getVendorStoreCategories = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/vendor-store/categories-list`, config);
};

// POST API for creating vendor store category
export const createVendorStoreCategory = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/admin/vendor-store/categories/store`, config);
};

// POST API for updating vendor store category
export const updateVendorStoreCategory = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/admin/vendor-store/categories/update`, config);
};

export const getVendorsList = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/admin/vendors/list`, config);
};

// POST API for creating vendor
export const createVendor = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/admin/vendors/create`, config);
};

export const updateVendor = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/admin/vendors/update`, config);
};

export const getVendorById = async (vendorId) => {
  return await get(`/admin/vendors/edit/${vendorId}`);
};

export const getVendors = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/vendor-store/vendor-list`, config);
};

export const getVendorDetailById = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/vendor-store/vendor-details`,config);
};

export const rateVendor = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/vendor-store/rate-vendor`, config);
};


export const favoriteVendor = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/vendor-store/favorite-vendor`, config);
};

export const unfavoriteVendor = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/vendor-store/unfavorite-vendor`, config);
};

export const createVendorSuggestion = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/vendor-suggestions/create`, config);
};

// GET API for vendor suggestions list
export const getVendorSuggestions = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/vendor-suggestions/list`, config);
}

export const getVendorRatingList = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/vendor-store/vendor-rating-list`, config);
};

export const getVendorStoreCategoryById = async (categoryId) => {
  return await get(`/vendor-store/category-edit/${categoryId}`);

}