import { post, get } from "../../utils/apiWrapper";

// POST API for onboarding step 2
export const submitOnboardingStep2 = async (data) => {
  const config = {
    data: data,
  };
  return await post(`/auth/onboarding/step2`, config);
};

// Get user onboarding step 5 data
export const getUserOnboardingStep5 = async ({id}) => {
  try {
    return await get(`/users/onboarding/step5/${id}`);
  } catch (error) {
    return error?.response?.data;
  }
};
