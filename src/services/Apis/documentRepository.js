import { get, post, del } from "../../utils/apiWrapper";

// Get friend folders (works for both main folders and nested folders based on params)
export const getFriendFolders = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/friend-folder`, config);
};

// Create friend folder (works for both main folders and nested folders based on data)
export const createFriendFolder = async (data) => {
  const config = {
    data: data,
    Headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  };
  return await post(`/friend-folder/create`, config);
};

// Update friend folder (works for both main folders and nested folders)
export const updateFriendFolder = async (data) => {
  const config = {
    data: data,
    Headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  };
  return await post(`/friend-folder/update`, config);
};

// Delete friend folder (works for both main folders and nested folders)
export const deleteFriendFolder = async (id) => {
  return await del(`/friend-folder/delete/${id}`);
};

// Get deleted friend folders list (works for both main folders and nested folders based on params)
export const getDeletedFriendFolders = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/friend-folder/deleted-folder-list`, config);
};

// Restore friend folder (works for both main folders and nested folders)
export const restoreFriendFolder = async (id) => {
  return await del(`/friend-folder/restore/${id}`);
};

// Get nested folders (using same endpoint with parent_id parameter)
export const getNestedFolders = async (params) => {
  const config = {
    params: params, // includes parent_id to get nested folders
  };
  return await get(`/friend-folder`, config);
};

// Create nested folder (using same endpoint with parent_id in data)
export const createNestedFolder = async (data) => {
  const config = {
    data: data, // includes parent_id to create nested folder
    Headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  };
  return await post(`/friend-folder/create`, config);
};

// Update nested folder (using same endpoint)
export const updateNestedFolder = async (data) => {
  const config = {
    data: data,
    Headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  };
  return await post(`/friend-folder/update`, config);
};

// Delete nested folder (using same endpoint)
export const deleteNestedFolder = async (id) => {
  return await del(`/friend-folder/delete/${id}`);
};

// Get deleted nested folders list (using same endpoint with parent_id parameter)
export const getDeletedNestedFolders = async (params) => {
  const config = {
    params: params, // includes parent_id to get deleted nested folders
  };
  return await get(`/friend-folder/deleted-folder-list`, config);
};

// Restore nested folder (using same endpoint)
export const restoreNestedFolder = async (id) => {
  return await del(`/friend-folder/restore/${id}`);
};

// =================== NEW FILE OPERATIONS ===================

// Get files in a friend folder
export const getFriendFolderFiles = async (folderId, params = {}) => {
  const config = {
    params: params,
  };
  return await get(`/friend-folder/file-list/${folderId}`, config);
};

// Upload file to friend folder
export const uploadFriendFolderFile = async (data) => {
  const config = {
    data: data,
    Headers: {
      "Content-Type": "multipart/form-data",
      "Access-Control-Allow-Origin": "*",
    },
  };
  return await post(`/friend-folder/upload-file`, config);
};

// Delete file from friend folder
export const deleteFriendFolderFile = async (fileId) => {
  return await del(`/friend-folder/file/delete/${fileId}`);
};



export const deletedFiles=async ( params = {}) => {
  const config = {
    params: params,
  };
  return await get(`/friend-folder/delete-file-list`, config);
};

export const restoreDeletedFiles = async (id) => {
  return await del(`/friend-folder/file/restore/${id}`);
};

