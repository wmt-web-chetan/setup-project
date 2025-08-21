import { del, get, post } from "../../utils/apiWrapper";

// GET API for fetching categories
export const getCategories = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/category/list`, config);
};

// POST API for creating category
export const createCategory = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/category/create`, config);
};

// POST API for updating category
export const updateCategory = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/category/update`, config);
};

// DELETE API for deleting category
export const deleteCategory = async (id) => {
  return await del(`/category/delete/${id}`);
};


// GET API for fetching categories with salesforce category_type
export const getCategoriesDetails = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/category`, config);
};

// POST API for creating article
export const createArticle = async (articleData) => {
  const config = {
    data: articleData,
  };
  return await post(`/articles/create`, config);
};

// Delete article
export const deleteArticle = async (id) => {
  return await del(`/articles/delete/${id}`);
};

// GET API for fetching article file by ID
export const getArticleFileById = async (id) => {
  return await get(`/article-files/${id}`);
};

// GET API for fetching article file by ID
export const getVideoById = async (id) => {
  return await get(`/category/videos/${id}`);
};

// POST API for updating article
export const updateArticle = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/articles/update`, config);
};

// GET API for category search suggestions
export const getCategorySearchSuggestions = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/category/search/suggestions`, config);
};

export const searchCategories = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/category/search`, config);
};