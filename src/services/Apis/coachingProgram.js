import { get, post } from "../../utils/apiWrapper";

export const getCoachingPrograms = async (params) => {
  const config = {
    params: params,
  };
  return await get(`/admin/coaching-program/`, config);
};

export const createCoachingProgram = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/admin/coaching-program/create`, config);
};

export const getCoachingProgramById = async (id) => {
  return await get(`/admin/coaching-program/edit/${id}`);
};

export const updateCoachingProgram = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/admin/coaching-program/update`, config);
};
