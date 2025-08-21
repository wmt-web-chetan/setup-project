import { del, get, post } from "../../utils/apiWrapper";

// Get loan category folders
export const getLoanCategoryFolders = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/admin/loan-category-folder`, config);
};

// Create loan category folder
export const createLoanCategoryFolder = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/admin/loan-category-folder/create`, config);
};

// Update loan category folder
export const updateLoanCategoryFolder = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/admin/loan-category-folder/update`, config);
};

// Delete loan category folder
export const deleteLoanCategoryFolder = async (id) => {
  return await del(`/admin/loan-category-folder/delete/${id}`);
};

// Get loan category folder details with files
export const getLoanCategoryFolderDetails = async (id) => {
  return await get(`/admin/loan-category-folder/edit/${id}`);
};

// Delete loan category folder file
export const deleteLoanCategoryFile = async (fileId) => {
  return await del(`/admin/loan-category-folder/file/delete/${fileId}`);
};

export const uploadLoanCategoryFile = async (formData) => {
  const config = {
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  };
  return await post(`/admin/loan-category-folder/upload-file`, config);
};

export const getDeleteFileList = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/admin/loan-category-folder/delete-file-list`, config);
};

export const restoreFolder = async (folderId) => {
  return await del(`/admin/loan-category-folder/restore/${folderId}`);
};

export const restoreFile = async (fileId) => {
  return await del(`/admin/loan-category-folder/file/restore/${fileId}`);
};