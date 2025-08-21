import { get, post, del } from "../../utils/apiWrapper";

// GET API for fetching loan categories with pagination/filters
export const getLoanCategories = async (params) => {
  const config = {
    params: params,
  };
  return await get("/admin/loan-category", config);
};

// POST API for creating or updating a loan category
export const createOrUpdateLoanCategory = async (data) => {
  const config = {
    data: data,
  };
  return await post("/admin/loan-category/create-or-update", config);
};

// DELETE API for removing a loan category
export const deleteLoanCategory = async (id) => {
  return await del(`/admin/loan-category/delete/${id}`);
};