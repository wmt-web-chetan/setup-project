import { configureStore } from "@reduxjs/toolkit";
import companyDetailsReducer from "./Company/slice";
import authReducer from "./Auth/slice";
import perissionReducer from "./Permission/slice";
import onBordingReducer from "./OnBoarding/slice";
import usersReducer from "./Users/slice";
import subscriptionReducer from "./Subscription/slice";
import dashboardReducer from "./Dashboard/slice";
import videoModuleReducer from "./VideoModule/slice";
import mcqModuleReducer from "./McqModule/slice";
import guidelineReducer from "./GuidelinesMatrices/slice";
import loanCategoriesReducer from "./LoanCategory/slice";
import genieReducer from "./Genie/slice";
import gptReducer from "./GPT/slice";
import feedsReducer from "./Feed/slice";
import meetingsReducer from "./Calender/slice";
import chatReducer from "./Chat/slice";
import contractProcessorReducer from "./ContractProcessor/slice";
import passwordReducer from "./PasswordManagement/slice";
import friendFoldersReducer from "./DocumentRepository/slice";
import couponsReducer from "./Coupons/slice";
import vendorStoreCategoriesReducer from "./VendorAdmin/slice";
import supportReducer from "./Support/slice";
import coachingProgramReducer from "./CoachingProgram/slice";
import reviewReducer from "./ClientTestimonial/slice";
import referralsReducer from "./Refer/slice";
import stateLicenseReducer from "./StateLicense/slice";
import linkModuleReducer from "./Link/slice";

const store = configureStore({
  reducer: {
    companyDetails: companyDetailsReducer,
    auth: authReducer,
    permissions: perissionReducer,
    onboarding: onBordingReducer,
    usersmanagement: usersReducer,
    subscriptions: subscriptionReducer,
    dashboard: dashboardReducer,
    vimeoVideos: videoModuleReducer,
    mcqVideos: mcqModuleReducer,
    guidelineMatrices: guidelineReducer,
    loanCategories: loanCategoriesReducer,
    genie: genieReducer,
    gpt: gptReducer,
    feeds: feedsReducer,
    meetings: meetingsReducer,
    chat: chatReducer,
    contractProcessor: contractProcessorReducer,
    passwords: passwordReducer,
    friendFolders: friendFoldersReducer,
    coupons: couponsReducer,
    vendorStoreCategories: vendorStoreCategoriesReducer,
    support: supportReducer,
    coachingPrograms: coachingProgramReducer,
    reviews: reviewReducer,
    referrals: referralsReducer,
    stateLicenses: stateLicenseReducer,
    links: linkModuleReducer,
    // Add other reducers here if needed
  },
});

export default store;
