import {
  Avatar,
  Button,
  Progress,
  Tag,
  Typography,
  message,
} from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom"; // Add this import for navigation
import {
  fetchContractProcessorUserDetails,
  toggleLikeStatusAction,
  rateContractProcessorAction,
  toggleBlockUnblockAction, // Add this import
} from "../../services/Store/ContractProcessor/actions";
import { UserOutlined } from "@ant-design/icons";
import ReportModal from "./VendorReportModal";
import VendorAddRating from "./VendorAddRating";

const { Text } = Typography;

const ContractProcessorLeftPanel = ({ userData, containerHeight }) => {
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [heartLoading, setHeartLoading] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate(); // Add navigation hook
  const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL;

  const ratingData = userData?.rating_summary || {};

  // Utility function to truncate text
  const truncateText = (text, maxLength) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };


  // FIXED: Check if the user has liked - now using the correct property name
  const hasLikedFriendRequests = userData?.recievedFriendRequests?.is_like === true;

  // FIXED: Get the friend request data to check block status - using correct property name
  const friendRequest = userData?.recievedFriendRequests;
  const isBlocked = friendRequest?.status === "block";

  // FIXED: Check if block/unblock functionality should be enabled
  // Only show buttons if friendRequest exists, has an ID, and is not an empty object
  const isBlockFunctionalityEnabled = friendRequest && 
    friendRequest.id && 
    Object.keys(friendRequest).length > 0;

  // Calculate rating counts for progress bars
  const getRatingCounts = () => {
    const total = ratingData?.total_ratings || 0;
    if (total === 0) return [0, 0, 0, 0, 0];

    return [
      ((ratingData?.five_star_count || 0) / total) * 100,
      ((ratingData?.four_star_count || 0) / total) * 100,
      ((ratingData?.three_star_count || 0) / total) * 100,
      ((ratingData?.two_star_count || 0) / total) * 100,
      ((ratingData?.one_star_count || 0) / total) * 100,
    ];
  };

  const ratingCounts = getRatingCounts();
  const actualCounts = [
    ratingData?.five_star_count || 0,
    ratingData?.four_star_count || 0,
    ratingData?.three_star_count || 0,
    ratingData?.two_star_count || 0,
    ratingData?.one_star_count || 0,
  ];

  // Handle report modal visibility
  const showReportModal = () => {
    setIsReportModalVisible(true);
  };

  const hideReportModal = () => {
    setIsReportModalVisible(false);
  };

  // Handle rating modal visibility
  const showRatingModal = () => {
    setIsRatingModalVisible(true);
  };

  const hideRatingModal = () => {
    setIsRatingModalVisible(false);
  };

  // FIXED: Handle heart like/unlike action - using correct property name
  const handleHeartClick = () => {
    // Validation check before proceeding
    if (!friendRequest || !friendRequest.id) {
      message.error("Unable to process request. Friend request data is missing.");
      return;
    }

    // Set local loading state for heart button
    setHeartLoading(true);
    
    // Dispatch toggleLikeStatusAction with the correct ID
    dispatch(
      toggleLikeStatusAction({
        id: friendRequest.id,
      })
    )
      .then(() => {
        // Refresh user details to get updated like status, but don't use the global loading state
        dispatch(fetchContractProcessorUserDetails(userData?.id, { useGlobalLoading: false }))
          .finally(() => {
            // Stop the heart loading once the action completes (whether success or failure)
            setHeartLoading(false);
          });
      })
      .catch((error) => {
        // Handle error and stop heart loading
        setHeartLoading(false);
        message.error("Failed to update favorite status. Please try again.");
      });
  };

  // Handle block/unblock action with validation
  const handleBlockUnblockClick = () => {
    // Validation check before proceeding
    if (!friendRequest || !friendRequest.id) {
      message.error("Unable to process request. Friend request data is missing.");
      return;
    }

    setBlockLoading(true);
    
    // Determine the new status based on current status
    const newStatus = isBlocked ? "unblock" : "block";
    
    
    
    dispatch(
      toggleBlockUnblockAction({
        id: friendRequest.id,
        status: newStatus,
      })
    )
      .then((response) => {
        
        // If the action was to block the user, navigate to /contract-processor
        if (newStatus === "block") {
          navigate("/account-executive");
        } else {
          // For unblock, refresh user details to get updated status
          return dispatch(fetchContractProcessorUserDetails(userData?.id, { useGlobalLoading: false }));
        }
      })
      .catch((error) => {
        console.error("Block/Unblock Error:", error);
        message.error("Failed to update block status. Please try again.");
      })
      .finally(() => {
        setBlockLoading(false);
      });
  };

  // Handle report submission
  const handleReportSubmit = async (formData) => {
    try {
      // Here you would typically send the data to your API

      // Show success message
      message.success("Your report has been submitted successfully");
    } catch (error) {
      console.error("Error submitting report:", error);
      message.error("Failed to submit report. Please try again");
    }
  };

  // Handle rating submission
  const handleRatingSubmit = async (payload) => {
    try {
      // Dispatch the rating action with the payload from child component
      await dispatch(rateContractProcessorAction(payload));
      
      // Refresh user details to get updated ratings
      dispatch(fetchContractProcessorUserDetails(userData?.id, { useGlobalLoading: false }));
      
      return true;
    } catch (error) {
      console.error("Error submitting rating:", error);
     // Re-throw to let VendorAddRating handle the error message
    }
  };

  // Custom styles to hide scrollbar but keep scrolling functionality
  const scrollableContentStyle = {
    overflowY: "auto",
    scrollbarWidth: "none", // Firefox
    msOverflowStyle: "none", // IE and Edge
  };

  // Additional style to hide WebKit scrollbar (Chrome, Safari, Opera)
  const webkitScrollbarStyle = `
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
  `;



  return (
    <div className="w-full">
      {/* Add style element for WebKit browsers */}
      <style>{webkitScrollbarStyle}</style>

      <div
        className="rounded-3xl border hide-scrollbar bg-gray border-solid border-liteGray w-full relative p-4"
        style={{
          height: containerHeight,
          ...scrollableContentStyle,
        }}
      >
        <div className="flex justify-center">
          {userData?.profile_photo_path ? (
            <img
              src={`${imageBaseUrl}/${userData.profile_photo_path}`}
              alt="Profile"
              className="w-28 h-28 rounded-full object-cover"
            />
          ) : (
            <Avatar
              icon={<UserOutlined className="text-4xl" />}
              className="w-28 h-28"
            />
          )}
        </div>
        <div className="mt-4 flex flex-col items-center">
          <Text className="text-white text-md font-semibold">
            {userData?.name || ""}
          </Text>
          <Text type="secondary" className="text-md">
            {/* Use company name if available or fallback to NMLS number */}
            {userData?.user_detail?.service_name}
          </Text>
          <div className="flex justify-center gap-3 mt-1">
            <div className="flex items-center">
              <i className="icon-location text-primary text-xl" />
              <div className="text-sm">
                {truncateText(userData?.user_detail?.state || "California", 20)}
              </div>
            </div>
            <div className="flex items-center">
              <i className="icon-calendar text-primary text-xl" />
              <div className="text-sm">
                {`${userData?.user_detail?.experience} Years` || "3 Years"}
              </div>
            </div>
          </div>
          <Text type="secondary" className="text-sm flex text-center">
            {truncateText(userData?.user_detail?.description, 200)}
          </Text>
          <div className="flex justify-center gap-2 mt-2">
            <div className="flex items-center">
              <i className="icon-mail text-primary text-xl" />
              <div className="text-xs">{userData?.email || ""}</div>
            </div>
            <div className="flex items-center">
              <i className="icon-phone text-primary text-xl" />
              <div className="text-xs">
                {userData?.phone_number || ""}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap 2xl:flex-nowrap 3xl:flex-nowrap mt-3">
          <Button
            type="primary"
            className="py-4 px-4 flex-1 w-full text-sm"
            onClick={showRatingModal}
          >
            <i className="icon-add before:!m-0" /> Add Ratings
          </Button>

          {/* Block/Unblock button - only shown when friend request exists */}
          {isBlockFunctionalityEnabled && (
            <Button
              className={`py-4 flex-1 w-full text-sm ${
                isBlocked 
                  ? "bg-green-600 hover:bg-green-700 text-white" 
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
              onClick={handleBlockUnblockClick}
              loading={blockLoading}
              disabled={blockLoading}
            >
              {isBlocked ? "Unblock" : "Block"}
            </Button>
          )}
          
          {/* Heart button - only shown when friend request exists */}
          {isBlockFunctionalityEnabled && (
            <Button
              className={`px-1 ${
                hasLikedFriendRequests ? "text-red-500" : ""
              }`}
              onClick={handleHeartClick}
              loading={heartLoading}
              disabled={heartLoading}
            >
              {/* Only show icon when not loading */}
              {!heartLoading && (
                <i
                  className={`${
                    hasLikedFriendRequests
                      ? "icon-heart-filled text-red-800"
                      : "icon-heart-lineal"
                  } before:!m-0 text-2xl`}
                />
              )}
            </Button>
          )}
        </div>

        <div className="">
          <hr className="border-liteGray my-6" />
        </div>
        <div className="mt-4 mb-3">
          <Text className="text-white font-bold">Ratings </Text>
          <Tag className="bg-liteGray rounded-full text-gray-700 border-0 ml-1">
            <i className="icon-star text-yellow-600 before:!m-0" />{" "}
            {ratingData?.average_rating || "0.0"}
          </Tag>
        </div>
        {[1, 2, 3, 4, 5].map((item, index) => (
          <div key={index} className="xl:w-4/5 flex gap-2 mb-2">
            <div className="flex">
              <span className="text-white font-medium">{6 - item}</span>
              <i className="icon-star text-yellow-600" />
            </div>
            <Progress
              percent={ratingCounts[index]}
              showInfo={false}
              strokeColor="#FF6D00"
              trailColor="#373737"
              strokeWidth={10}
            />
            <div className="text-liteGray">{actualCounts[index]}</div>
          </div>
        ))}
      </div>

      {/* Report Modal */}
      <ReportModal
        isVisible={isReportModalVisible}
        onCancel={hideReportModal}
        companyName={userData?.user_detail?.company_name || ""}
        onSubmit={handleReportSubmit}
      />
      {/* Add Rating Modal */}
      <VendorAddRating
        isVisible={isRatingModalVisible}
        onCancel={hideRatingModal}
        companyName={userData?.user_detail?.company_name || ""}
        ratedUserId={userData?.id} // Pass the rated user ID
        onSubmit={handleRatingSubmit}
      />
    </div>
  );
};

export default ContractProcessorLeftPanel;