import { lazy } from "react";
import { getStorage } from "../utils/commonfunction";

const loginUserPermission = getStorage("loginUserPermission", true);

console.log("route loginUserPermission", loginUserPermission);

const PublicRoutes = [
  {
    path: "/signin",
    title: "Sign In",
    component: lazy(() => import("../pages/Authentication/SignIn")),
    exact: true,
  },
  {
    path: "/signup",
    title: "Sign Up",
    component: lazy(() => import("../pages/Authentication/SignUp")),
    exact: true,
  },
  {
    path: "/otp-verify",
    title: "OTP Verification",
    component: lazy(() => import("../pages/Authentication/OTPVerification")),
    exact: true,
  },
  {
    path: "/under-review",
    title: "Under Review",
    component: lazy(() => import("../pages/Authentication/UnderReview")),
    exact: true,
  },
  {
    path: "/role-selection",
    title: "Role Selection",
    component: lazy(() => import("../pages/Authentication/RoleSelection")),
    exact: true,
  },
  {
    path: "/forgot-password",
    title: "Forgot Password",
    component: lazy(() => import("../pages/Authentication/ForgotPassword")),
    exact: true,
  },
  {
    path: "/new-password",
    title: "New Password",
    component: lazy(() => import("../pages/Authentication/NewPassword")),
    exact: true,
  },
  {
    path: "/typography",
    title: "Typography",
    component: lazy(() => import("../pages/Typograph")),
    exact: true,
  },
  {
    path: "*",
    title: "Page Not Found",
    component: lazy(() => import("../pages/Page404")),
    exact: true,
  },
];




const PrivateRoutes = [
  {
    path: "/dashboard 1",
    title: "Dashboard",
    component: lazy(() => import("../pages/Dashboard")),
    exact: true,
    access: true,
  },
  {
    path: "/admin",
    title: "Admin Dashboard",
    component: lazy(() => import("../pages/Dashboard")),
    exact: true,
    access: [
      "view-back-office-management",
      "create-back-office-management",
      "update-back-office-management",
      "delete-back-office-management",
    ],
  },

  // Admin-only routes
  {
    path: "/admin/user-management",
    title: "User Management",
    component: lazy(() => import("../pages/AdminPanel/UserManagement")),
    exact: true,
    access: true,
  },
  {
    path: "/admin/user-management/new",
    title: "Create User",
    component: lazy(() => import("../pages/AdminPanel/UserManagementForm")),
    exact: true,
    access: true,
  },
  {
    path: "/admin/user-management/:userId",
    title: "Edit User",
    component: lazy(() => import("../pages/AdminPanel/UserManagementForm")),
    exact: true,
    access: true,
  },
  {
    path: "/admin/chat-management",
    title: "Chat Management",
    component: lazy(() => import("../pages/AdminPanel/ChatManagement")),
    exact: true,
    access: true,
  },
  {
    path: "/admin/roles",
    title: "Roles & Permissions",
    component: lazy(() => import("../pages/AdminPanel/RolesList")),
    exact: true,
    access: true,
  },
  {
    path: "/admin/roles/new",
    title: "Create New Role",
    component: lazy(() => import("../pages/AdminPanel/PermissionsManagement")),
    exact: true,
    access: true,
  },
  {
    path: "/admin/roles/:roleId",
    title: "Edit Role",
    component: lazy(() => import("../pages/AdminPanel/PermissionsManagement")),
    exact: true,
    access: true,
  },
  {
    path: "/admin/subscription-management",
    title: "Subscription Management",
    component: lazy(() => import("../pages/AdminPanel/SubscriptionList")),
    exact: true,
    access: true,
  },
  {
    path: "/admin/video-management",
    title: "Video Management",
    component: lazy(() => import("../pages/AdminPanel/VideoManagement")),
    exact: true,
    access: true,
  },
  {
    path: "/admin/mcq-management",
    title: "MCQ Management",
    component: lazy(() => import("../pages/AdminPanel/McqManagement")),
    exact: true,
    access: true,
  },
  {
    path: "/admin/platform-meetings",
    title: "Platform Meetings",
    component: lazy(() => import("../pages/AdminPanel/MeetingModule")),
    exact: true,
    access: true,
  },
  {
    path: "/admin/coupon-management",
    title: "Coupon Management",
    component: lazy(() => import("../pages/AdminPanel/CouponManagement")),
    exact: true,
    access: true,
  },
  {
    path: "/admin/vendor-store-categories",
    title: "Vendor Store Categories",
    component: lazy(() => import("../pages/AdminPanel/VendorStoreCategories")),
    exact: true,
    access: true,
  },
  {
    path: "/admin/vendor-store-management",
    title: "Vendor Store Management",
    component: lazy(() => import("../pages/AdminPanel/VendorStoreManagement")),
    exact: true,
    access: true,
  },
  {
    path: "/admin/vendor-store-management/new",
    title: "Create New Vendor",
    component: lazy(() =>
      import("../pages/AdminPanel/VendorStoreManagement/VendorStoreForm")
    ),
    exact: true,
    access: true,
  },
  {
    path: "/admin/vendor-store-management/:vendorId",
    title: "Edit Vendor",
    component: lazy(() =>
      import("../pages/AdminPanel/VendorStoreManagement/VendorStoreForm")
    ),
    exact: true,
    access: true,
  },
  {
    path: "/admin/vendor-store-management/view-suggestions",
    title: "View Suggestions",
    component: lazy(() =>
      import("../pages/AdminPanel/VendorStoreManagement/ViewSuggestions")
    ),
    exact: true,
    access: true,
  },
  {
    path: "/admin/coaching-program-management",
    title: "Coaching Program Management",
    component: lazy(() =>
      import("../pages/AdminPanel/CoachingProgramManagement")
    ),
    exact: true,
    access: true,
  },
  {
    path: "/admin/coaching-program-management/new",
    title: "Create Coaching Program",
    component: lazy(() =>
      import(
        "../pages/AdminPanel/CoachingProgramManagement/CoachingProgramForm"
      )
    ),
    exact: true,
    access: true,
  },
  {
    path: "/admin/coaching-program-management/:CProgramid",
    title: "Edit Coaching Program",
    component: lazy(() =>
      import(
        "../pages/AdminPanel/CoachingProgramManagement/CoachingProgramForm"
      )
    ),
    exact: true,
    access: true,
  },
  {
    path: "/admin/state-license-management",
    title: "State License Management",
    component: lazy(() => import("../pages/AdminPanel/AdminStateLicenses")),
    exact: true,
    access: true,
  },
  {
    path: "/admin/link-management",
    title: "Link Management",
    component: lazy(() => import("../pages/AdminPanel/LinkManagement")),
    exact: true,
    access: true,
  },
  {
    path: "/admin/guidelines-matrices",
    title: "Guidelines & Matrices",
    key: "Guidelines & Matrices",
    component: lazy(() => import("../pages/GuidelinesMatrices")),
    exact: true,
    access: true,
  },
  {
    path: "/admin/guidelines-matrices/:folderId",
    title: "Folder Details",
    key: "folder-details",
    component: lazy(() =>
      import("../pages/GuidelinesMatrices/FolderDetailsView")
    ),
    exact: true,
    access: true,
  },
  {
    path: "/admin/loan-category-management",
    title: "Loan Category Management",
    component: lazy(() => import("../pages/AdminPanel/LoanCategory")),
    exact: true,
    access: true,
  },
  {
    path: "/admin/support-management",
    title: "Support Management",
    key: "support-management",
    component: lazy(() => import("../pages/SupportManagement")),
    exact: true,
    access: true,
  },
  {
    path: "/admin/support-management/:id",
    title: "Support Management",
    key: "support-management-id",
    component: lazy(() => import("../pages/Support/SupportDetails.jsx")),
    exact: true,
    access: true,
  },

  // Regular user routes (same components, different paths)
  {
    path: "/user-management",
    title: "User Management",
    component: lazy(() => import("../pages/AdminPanel/UserManagement")),
    exact: true,
    access: true,
  },
  {
    path: "/user-management/new",
    title: "Create User",
    component: lazy(() => import("../pages/AdminPanel/UserManagementForm")),
    exact: true,
    access: true,
  },
  {
    path: "/user-management/:userId",
    title: "Edit User",
    component: lazy(() => import("../pages/AdminPanel/UserManagementForm")),
    exact: true,
    access: true,
  },
  {
    path: "/chat-management",
    title: "Chat Management",
    component: lazy(() => import("../pages/AdminPanel/ChatManagement")),
    exact: true,
    access: true,
  },
  {
    path: "/roles",
    title: "Roles & Permissions",
    component: lazy(() => import("../pages/AdminPanel/RolesList")),
    exact: true,
    access: true,
  },
  {
    path: "/roles/new",
    title: "Create New Role",
    component: lazy(() => import("../pages/AdminPanel/PermissionsManagement")),
    exact: true,
    access: true,
  },
  {
    path: "/roles/:roleId",
    title: "Edit Role",
    component: lazy(() => import("../pages/AdminPanel/PermissionsManagement")),
    exact: true,
    access: true,
  },
  {
    path: "/subscription-management",
    title: "Subscription Management",
    component: lazy(() => import("../pages/AdminPanel/SubscriptionList")),
    exact: true,
    access: true,
  },
  {
    path: "/video-management",
    title: "Video Management",
    component: lazy(() => import("../pages/AdminPanel/VideoManagement")),
    exact: true,
    access: true,
  },
  {
    path: "/mcq-management",
    title: "MCQ Management",
    component: lazy(() => import("../pages/AdminPanel/McqManagement")),
    exact: true,
    access: true,
  },
  {
    path: "/platform-meetings",
    title: "Platform Meetings",
    component: lazy(() => import("../pages/AdminPanel/MeetingModule")),
    exact: true,
    access: true,
  },
  {
    path: "/coupon-management",
    title: "Coupon Management",
    component: lazy(() => import("../pages/AdminPanel/CouponManagement")),
    exact: true,
    access: true,
  },
  {
    path: "/vendor-store-categories",
    title: "Vendor Store Categories",
    component: lazy(() => import("../pages/AdminPanel/VendorStoreCategories")),
    exact: true,
    access: true,
  },
  {
    path: "/vendor-store-management",
    title: "Vendor Store Management",
    component: lazy(() => import("../pages/AdminPanel/VendorStoreManagement")),
    exact: true,
    access: true,
  },
  {
    path: "/vendor-store-management/new",
    title: "Create New Vendor",
    component: lazy(() =>
      import("../pages/AdminPanel/VendorStoreManagement/VendorStoreForm")
    ),
    exact: true,
    access: true,
  },
  {
    path: "/vendor-store-management/:vendorId",
    title: "Edit Vendor",
    component: lazy(() =>
      import("../pages/AdminPanel/VendorStoreManagement/VendorStoreForm")
    ),
    exact: true,
    access: true,
  },
  {
    path: "/vendor-store-management/view-suggestions",
    title: "View Suggestions",
    component: lazy(() =>
      import("../pages/AdminPanel/VendorStoreManagement/ViewSuggestions")
    ),
    exact: true,
    access: true,
  },
  {
    path: "/coaching-program-management",
    title: "Coaching Program Management",
    component: lazy(() =>
      import("../pages/AdminPanel/CoachingProgramManagement")
    ),
    exact: true,
    access: true,
  },
  {
    path: "/coaching-program-management/new",
    title: "Create Coaching Program",
    component: lazy(() =>
      import(
        "../pages/AdminPanel/CoachingProgramManagement/CoachingProgramForm"
      )
    ),
    exact: true,
    access: true,
  },
  {
    path: "/coaching-program-management/:CProgramid",
    title: "Edit Coaching Program",
    component: lazy(() =>
      import(
        "../pages/AdminPanel/CoachingProgramManagement/CoachingProgramForm"
      )
    ),
    exact: true,
    access: true,
  },
  {
    path: "/state-license-management",
    title: "State License Management",
    component: lazy(() => import("../pages/AdminPanel/AdminStateLicenses")),
    exact: true,
    access: true,
  },
  {
    path: "/link-management",
    title: "Link Management",
    component: lazy(() => import("../pages/AdminPanel/LinkManagement")),
    exact: true,
    access: true,
  },
  {
    path: "/guidelines-&-matrices",
    title: "Guidelines & Matrices",
    key: "Guidelines & Matrices",
    component: lazy(() => import("../pages/GuidelinesMatrices")),
    exact: true,
    access: true,
  },
  {
    path: "/guidelines-&-matrices/:folderId",
    title: "Folder Details",
    key: "folder-details",
    component: lazy(() =>
      import("../pages/GuidelinesMatrices/FolderDetailsView")
    ),
    exact: true,
    access: true,
  },
  {
    path: "/loan-category-management",
    title: "Loan Category Management",
    component: lazy(() => import("../pages/AdminPanel/LoanCategory")),
    exact: true,
    access: true,
  },
  {
    path: "/support-management",
    title: "Support Management",
    key: "support-management",
    component: lazy(() => import("../pages/SupportManagement")),
    exact: true,
    access: true,
  },
  {
    path: "/support-management/:id",
    title: "Support Management",
    key: "support-management-id",
    component: lazy(() => import("../pages/Support/SupportDetails.jsx")),
    exact: true,
    access: true,
  },

  // Other existing routes
  {
    path: "/onboarding",
    title: "OnBoarding",
    key: "onboarding",
    component: lazy(() => import("../pages/Authentication/OnBoarding")),
    exact: true,
    access: true,
  },
  {
    path: "/profile",
    title: "Profile",
    key: "profile",
    component: lazy(() => import("../pages/Profile")),
    exact: true,
    access: true,
  },
  {
    path: "/ai-genie",
    title: "AI Genie",
    key: "ai-genie",
    component: lazy(() => import("../pages/Genie")),
    exact: true,
    access: true,
  },
  {
    path: "/ai-genie/:id",
    title: "AI Genie",
    key: "ai-genie-detail",
    component: lazy(() => import("../pages/GenieChatDetails")),
    exact: true,
    access: true,
  },
  {
    path: "/gpt",
    title: "GPT",
    key: "gpt",
    component: lazy(() => import("../pages/GPT")),
    exact: true,
    access: true,
  },
  {
    path: "/gpt/:id",
    title: "GPT",
    key: "gpt-detail",
    component: lazy(() => import("../pages/GPTDetails")),
    exact: true,
    access: true,
  },
  {
    path: "/notifications",
    title: "Notifications",
    key: "Notifications",
    component: lazy(() => import("../pages/Notifications")),
    exact: true,
    access: true,
  },
  {
    path: "/support",
    title: "Support",
    key: "support",
    component: lazy(() => import("../pages/Support")),
    exact: true,
    access: true,
  },
  {
    path: "/support/:id",
    title: "Support Salesforce",
    key: "support-salesforce",
    component: lazy(() => import("../pages/Support/SupportDetails.jsx")),
    exact: true,
    access: true,
  },
  {
    path: "/support/video/:id",
    title: "Support Video",
    key: "support-video",
    component: lazy(() => import("../pages/Support/VideoDetails.jsx")),
    exact: true,
    access: true,
  },
  {
    path: "/support/article/:id",
    title: "Support Article",
    key: "support-artice",
    component: lazy(() => import("../pages/Support/ArticleDetails.jsx")),
    exact: true,
    access: true,
  },
  {
    path: "/contract-processor",
    title: "Contract Processor",
    key: "contract-processor",
    component: lazy(() => import("../pages/ContractProcessor")),
    exact: true,
    access: true,
  },
  {
    path: "/loan-officer",
    title: "Loan Officer",
    key: "loan-officers",
    component: lazy(() => import("../pages/ContractProcessor")),
    exact: true,
    access: true,
  },
  {
    path: "/account-executive",
    title: "Account Executive",
    key: "account-executive",
    component: lazy(() => import("../pages/ContractProcessor")),
    exact: true,
    access: true,
  },
  {
    path: "/real-estate-agent",
    title: "Real Estate Agent",
    key: "real-estate-agent",
    component: lazy(() => import("../pages/ContractProcessor")),
    exact: true,
    access: true,
  },
  {
    path: "/password-management",
    title: "Password Management",
    key: "password-management",
    component: lazy(() => import("../pages/PasswordManagment")),
    exact: true,
    access: true,
  },
  {
    path: "/contract-processor/detail/:id",
    title: "Contract Processor Details",
    key: "contract-processor-details",
    component: lazy(() => import("../pages/ContractProcessorDetails")),
    exact: true,
    access: true,
  },
  {
    path: "/loan-officer/detail/:id",
    title: "Loan Officers Details",
    key: "loan-officers-details",
    component: lazy(() => import("../pages/ContractProcessorDetails")),
    exact: true,
    access: true,
  },
  {
    path: "/account-executive/detail/:id",
    title: "Account Executive Details",
    key: "account-executive-details",
    component: lazy(() => import("../pages/ContractProcessorDetails")),
    exact: true,
    access: true,
  },
  {
    path: "/real-estate-agent/detail/:id",
    title: "Real Estate Agent Details",
    key: "real-estate-agent-details",
    component: lazy(() => import("../pages/ContractProcessorDetails")),
    exact: true,
    access: true,
  },
  {
    path: "/contract-processor/detail/:id/folder/:folderId",
    title: "Contract Processor Folder Details",
    key: "contract-processor-details",
    component: lazy(() =>
      import("../pages/ContractProcessorDetails/ContractprocessorFolder.jsx")
    ),
    exact: true,
    access: true,
  },
  {
    path: "/loan-officer/detail/:id/folder/:folderId",
    title: "Loan Officers Folder Details",
    key: "loan-officers-details",
    component: lazy(() =>
      import("../pages/ContractProcessorDetails/ContractprocessorFolder.jsx")
    ),
    exact: true,
    access: true,
  },
  {
    path: "/account-executive/detail/:id/folder/:folderId",
    title: "Account Executive Folder Details",
    key: "account-executive-details",
    component: lazy(() =>
      import("../pages/ContractProcessorDetails/ContractprocessorFolder.jsx")
    ),
    exact: true,
    access: true,
  },
  {
    path: "/real-estate-agent/detail/:id/folder/:folderId",
    title: "Real Estate Agent Folder Details",
    key: "real-estate-agent-details",
    component: lazy(() =>
      import("../pages/ContractProcessorDetails/ContractprocessorFolder.jsx")
    ),
    exact: true,
    access: true,
  },
  {
    path: "/contract-processor/detail/:id/folder/:folderId/nestedfolder/:folderId2",
    title: "Contract Processor Folder Details",
    key: "contract-processor-details",
    component: lazy(() =>
      import("../pages/ContractProcessorDetails/ContractprocessorFile.jsx")
    ),
    exact: true,
    access: true,
  },
  {
    path: "/loan-officer/detail/:id/folder/:folderId/nestedfolder/:folderId2",
    title: "Loan Officer Folder Details",
    key: "loan-officers-details",
    component: lazy(() =>
      import("../pages/ContractProcessorDetails/ContractprocessorFile.jsx")
    ),
    exact: true,
    access: true,
  },
  {
    path: "/account-executive/detail/:id/folder/:folderId/nestedfolder/:folderId2",
    title: "Account Executive Folder Details",
    key: "account-executive-details",
    component: lazy(() =>
      import("../pages/ContractProcessorDetails/ContractprocessorFile.jsx")
    ),
    exact: true,
    access: true,
  },
  {
    path: "/real-estate-agent/detail/:id/folder/:folderId/nestedfolder/:folderId2",
    title: "Real Estate Agent Details",
    key: "real-estate-agent-details",
    component: lazy(() =>
      import("../pages/ContractProcessorDetails/ContractprocessorFile.jsx")
    ),
    exact: true,
    access: true,
  },
  {
    path: "/contract-processor/detail/:id/recently-deleted",
    title: "Recently Deleted",
    key: "recently-deleted",
    component: lazy(() =>
      import("../pages/ContractProcessorDetails/RecentlyDeleted.jsx")
    ),
    exact: true,
    access: true,
  },
  {
    path: "/loan-officer/detail/:id/recently-deleted",
    title: "Recently Deleted",
    key: "recently-deleted",
    component: lazy(() =>
      import("../pages/ContractProcessorDetails/RecentlyDeleted.jsx")
    ),
    exact: true,
    access: true,
  },
  {
    path: "/account-executive/detail/:id/recently-deleted",
    title: "Recently Deleted",
    key: "recently-deleted",
    component: lazy(() =>
      import("../pages/ContractProcessorDetails/RecentlyDeleted.jsx")
    ),
    exact: true,
    access: true,
  },
  {
    path: "/real-estate-agent/detail/:id/recently-deleted",
    title: "Recently Deleted",
    key: "recently-deleted",
    component: lazy(() =>
      import("../pages/ContractProcessorDetails/RecentlyDeleted.jsx")
    ),
    exact: true,
    access: true,
  },
  {
    path: "/coaching-programs",
    title: "Coaching Programs",
    key: "coaching-programs",
    component: lazy(() => import("../pages/CoachingPrograms")),
    exact: true,
    access: true,
  },
  {
    path: "/vendor-store",
    title: "Vendor Store",
    key: "vendor-store",
    component: lazy(() => import("../pages/Vendors")),
    exact: true,
    access: true,
  },
  {
    path: "/vendor-store/:id",
    title: "Vendor Store",
    key: "vendor-store",
    component: lazy(() => import("../pages/VendorsStore")),
    exact: true,
    access: true,
  },
  {
    path: "/vendor-store/:categoryId/details/:id",
    title: "Vendor Store Detail",
    key: "vendor-store",
    component: lazy(() => import("../pages/VendorDetails")),
    exact: true,
    access: true,
  },
  {
    path: "/vendor-store/:id/favorites",
    title: "Vendor Favorites",
    key: "vendor-store",
    component: lazy(() => import("../pages/VendorFavorites")),
    exact: true,
    access: true,
  },
  {
    path: "/coaching-programs/detail/:id",
    title: "Coaching Program Detail",
    key: "coaching-programs-detail",
    component: lazy(() => import("../pages/CoachingProgramsDetails")),
    exact: true,
    access: true,
  },
  {
    path: "/contract-processor/favorites",
    title: "Contract Processor",
    key: "contract-processor",
    component: lazy(() => import("../pages/ContractProcessorFavouite")),
    exact: true,
    access: true,
  },
  {
    path: "/loan-officer/favorites",
    title: "Loan Officers",
    key: "loan-officers",
    component: lazy(() => import("../pages/ContractProcessorFavouite")),
    exact: true,
    access: true,
  },
  {
    path: "/account-executive/favorites",
    title: "Account Executive",
    key: "account-executive",
    component: lazy(() => import("../pages/ContractProcessorFavouite")),
    exact: true,
    access: true,
  },
  {
    path: "/real-estate-agent/favorites",
    title: "Real Estate Agent",
    key: "real-estate-agent",
    component: lazy(() => import("../pages/ContractProcessorFavouite")),
    exact: true,
    access: true,
  },
  {
    path: "/settings/:tab?", // Make tab parameter optional with '?'
    title: "Settings",
    component: lazy(() => import("../pages/Settings/index.jsx")),
    exact: true,
    access: true,
  },
  {
    path: "/community/:type",
    title: "Community",
    key: "community",
    component: lazy(() => import("../pages/Community")),
    exact: true,
    access: true,
  },
  {
    path: "/training-calendar",
    title: "Training Calendar",
    key: "training-calendar",
    component: lazy(() => import("../pages/Calendar")),
    exact: true,
    access: true,
  },
  {
    path: "/recruitment",
    title: "Recruitment",
    key: "recruitment",
    component: lazy(() => import("../pages/Recruitment")),
    exact: true,
    access: true,
  },
  {
    path: "/recruitment/myreferral",
    title: "My Referral",
    key: "recruitment",
    component: lazy(() => import("../pages/MyReferral")),
    exact: true,
    access: true,
  },
  {
    path: "/lender-price",
    title: "Lender Price",
    key: "lender-price",
    component: lazy(() => import("../pages/LenderPrice")),
    exact: true,
    access: true,
  },
  {
    path: "/typographyy",
    title: "Typography",
    component: lazy(() => import("../pages/Typograph")),
    exact: true,
    access: true,
  },
  {
    path: "*",
    title: "Page Not Found",
    component: lazy(() => import("../pages/Page404")),
    exact: true,
    access: true,
  },
].filter((route) => {
  // Case 1: access is true
  console.log("11111 route loginUserPermission", route);

  if (route?.access === true) {
    return true;
  }

  // Case 2: access is an array with at least one permission that matches
  if (Array.isArray(route?.access)) {
    return route?.access?.some((permission) =>
      loginUserPermission?.includes(permission)
    );
  }

  // Default: route doesn't meet either criteria
  return false;
});

const CommonRoutes = [
  {
    path: "/",
    title: "Landing Page",
    component: lazy(() => import("../pages/LandingPage/index.jsx")),
    exact: true,
  },
];

export { PublicRoutes, PrivateRoutes, CommonRoutes };