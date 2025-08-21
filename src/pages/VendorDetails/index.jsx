/* eslint-disable react/no-unknown-property */
import {
  Button,
  Col,
  Progress,
  Row,
  Tag,
  Typography,
  message,
  Spin,
} from "antd";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LoadingOutlined } from "@ant-design/icons";
import ReportModal from "./VendorReportModal"; // Import the ReportModal component
import VendorAddRating from "./VendorAddRating"; // Import the VendorAddRating component
import VendorRatingsView from "./VendorRatingsView"; // Import the VendorRatingsView component
import "./vendorDetails.scss";
import {
  fetchVendorDetailById,
  favoriteVendorAction,
  unfavoriteVendorAction,
} from "../../services/Store/VendorAdmin/action";

const { Title, Text } = Typography;

const VendorDetails = () => {
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [showRatings, setShowRatings] = useState(false); // New state for toggling between description and ratings
  // Local state for optimistic favorite status updates
  const [localFavoriteStatus, setLocalFavoriteStatus] = useState(null);
  const params = useParams();
  const dispatch = useDispatch();

  // Get vendor details from Redux store
  const { vendorDetails, vendorDetailsLoading, vendorDetailsError } =
    useSelector((state) => state.vendorStoreCategories);

  // Set container height based on screen size
  useEffect(() => {
    const handleResize = () => {
      setContainerHeight(
        window.innerWidth < 768 ? "calc(100vh - 212px)" : "calc(100vh - 241px)"
      );
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  // Fetch vendor details when component mounts or vendor ID changes
  useEffect(() => {
    if (params.id) {
      // Reset local favorite status when switching vendors
      setLocalFavoriteStatus(null);
      setShowRatings(false); // Reset to show description when switching vendors
      const fetchPayload = {
        id: params.id,
        category_id: params.categoryId || null // Include category_id if available
      };
      dispatch(fetchVendorDetailById(fetchPayload))
        .then((result) => {
          console.log("Vendor details fetched successfully:", result);
        })
        .catch((error) => {
          console.error("Error fetching vendor details:", error);
        });
    }
  }, [dispatch, params.id]);

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

  // Handle view ratings button click
  const handleViewRatings = () => {
    setShowRatings(true);
  };

  // Handle back to description
  const handleBackToDescription = () => {
    setShowRatings(false);
  };

  // Handle report submission
  const handleReportSubmit = async (formData) => {
    try {
      // Here you would typically send the data to your API
      console.log("Report submitted:", formData);

      // Show success message
      // message.success("Your report has been submitted successfully");
    } catch (error) {
      console.error("Error submitting report:", error);
      // message.error("Failed to submit report. Please try again");
    }
  };

  // Handle rating submission
  const handleRatingSubmit = async (formData) => {
    try {
      // Here you would typically send the data to your API
      console.log("Rating submitted:", formData);

      // Success message is shown in the modal component
      return true;
    } catch (error) {
      console.error("Error submitting rating:", error);
      throw error;
    }
  };

  // Handle favorite toggle with optimistic updates
  const handleFavoriteToggle = () => {
    if (!vendor || !vendor.id) {
      // message.error("Vendor information not available");
      return;
    }

    // Check if vendor is currently favorited (considering local state)
    const currentFavoriteStatus =
      localFavoriteStatus !== null
        ? localFavoriteStatus
        : vendor.favorite_by_users?.length > 0;

    const payload = { vendor_id: vendor.id };

    console.log(
      `${currentFavoriteStatus ? "Unfavoriting" : "Favoriting"} vendor:`,
      vendor.id,
      "Payload:",
      payload
    );

    // Optimistically update the UI immediately
    setLocalFavoriteStatus(!currentFavoriteStatus);

    // Call the appropriate API based on current favorite status
    if (currentFavoriteStatus) {
      // Call unfavorite API
      dispatch(unfavoriteVendorAction(payload))
        .then((result) => {
          console.log("Unfavorite API response:", result);

          if (result?.payload?.meta?.success === true) {
            console.log("Vendor unfavorited successfully");
            // message.success("Removed from favorites");
          } else {
            console.error(
              "Error unfavoriting vendor:",
              result?.payload?.meta?.message
            );
            // message.error("Failed to remove from favorites. Please try again.");
            // Revert optimistic update on failure
            setLocalFavoriteStatus(currentFavoriteStatus);
          }
        })
        .catch((error) => {
          console.error("Error unfavoriting vendor:", error);
          // message.error("Failed to remove from favorites. Please try again.");
          // Revert optimistic update on error
          setLocalFavoriteStatus(currentFavoriteStatus);
        });
    } else {
      // Call favorite API
      dispatch(favoriteVendorAction(payload))
        .then((result) => {

          if (result?.payload?.meta?.success === true) {
            console.log("Vendor favorited successfully");
            // message.success("Added to favorites");
          } else {
            console.error(
              "Error favoriting vendor:",
              result?.payload?.meta?.message
            );
            // message.error("Failed to add to favorites. Please try again.");
            // Revert optimistic update on failure
            setLocalFavoriteStatus(currentFavoriteStatus);
          }
        })
        .catch((error) => {
          console.error("Error favoriting vendor:", error);
          // message.error("Failed to add to favorites. Please try again.");
          // Revert optimistic update on error
          setLocalFavoriteStatus(currentFavoriteStatus);
        });
    }
  };

  // Handle share
  const handleShare = async () => {
    try {
      const currentUrl = window.location.href;

      // Modern browsers - use the Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(currentUrl);
        message.success("Link copied to clipboard!");
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = currentUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand("copy");
          message.success("Link copied to clipboard!");
        } catch (err) {
          console.error("Fallback: Could not copy text: ", err);
          message.error(
            "Failed to copy link. Please copy manually: " + currentUrl
          );
        }

        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      message.error("Failed to copy link to clipboard");
    }
  };

  // Extract vendor data from API response
  const vendor = vendorDetails?.data?.vendor || {};
  const ratingSummary = vendor.rating_summery || [];

  // Get rating data from the first item in rating_summery array
  const ratingData = ratingSummary.length > 0 ? ratingSummary[0] : null;

  // Extract rating statistics from the new API structure
  const averageRating = ratingData ? parseFloat(ratingData.average_rating) : 0;
  const totalReviews = ratingData ? ratingData.total_ratings : 0;

  // Create rating breakdown for progress bars
  const ratingBreakdown = ratingData
    ? [
        { rating: 5, count: ratingData.five_star_count },
        { rating: 4, count: ratingData.four_star_count },
        { rating: 3, count: ratingData.three_star_count },
        { rating: 2, count: ratingData.two_star_count },
        { rating: 1, count: ratingData.one_star_count },
      ]
    : [];

  // Check if vendor is favorited by current user (considering optimistic updates)
  const isFavorited =
    localFavoriteStatus !== null
      ? localFavoriteStatus
      : vendor.favorite_by_users?.length > 0;

  // Default fallback data
  const logoUrl = vendor.logo_path
    ? `${import.meta.env.VITE_IMAGE_BASE_URL}/${vendor.logo_path}`
    : "https://media.istockphoto.com/id/1353379172/photo/cute-little-african-american-girl-looking-at-camera.jpg?s=170667a&w=is&k=20&c=JJ8IGmBvg9V_VGKdpDP6O0WR_H97epRjO-spB5-2V38=";

  // Show loading state
  if (vendorDetailsLoading) {
    return (
      <Row className="bg-darkGray h-full w-full flex flex-col gap-3 sm:gap-6 px-header-wrapper">
        <div className="loadingClass">
          <Spin size="large" />
        </div>
      </Row>
    );
  }

  // Show error state
  if (vendorDetailsError) {
    return (
      <Row className="bg-darkGray h-full w-full flex flex-col gap-3 sm:gap-6 px-header-wrapper">
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <Text className="text-red-500 text-lg block mb-4">
              Error loading vendor details
            </Text>
            <Button
              type="primary"
              onClick={() => dispatch(fetchVendorDetailById(params.id))}
            >
              Retry
            </Button>
          </div>
        </div>
      </Row>
    );
  }

  return (
    <Row className="bg-darkGray h-full w-full flex flex-col gap-3 sm:gap-6 px-header-wrapper">
      <div className="w-full"></div>

      <Col
        span={24}
        className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0"
      >
        <div className="flex justify-center items-center">
          <Title
            level={3}
            className="text-white !m-0 h-auto flex flex-wrap sm:flex-nowrap justify-center items-center text-base sm:text-lg md:text-xl"
          >
            <Link
              to="/dashboard"
              className="text-primary hover:text-primary flex justify-center"
            >
              <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
                Dashboard
              </Text>
            </Link>
            <Text className="text-grayText mx-2">
              {" "}
              <i className="icon-right-arrow" />{" "}
            </Text>
            <Link
              to="/vendor-store"
              className="text-primary hover:text-primary flex justify-center"
            >
              <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
                Vendor Store
              </Text>
            </Link>
            <Text className="text-grayText mx-2">
              {" "}
              <i className="icon-right-arrow" />{" "}
            </Text>
            <Link
              to={`/vendor-store/${params.categoryId}`}
              className="text-primary hover:text-primary flex justify-center"
            >
              <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg  truncate">
                {vendorDetails?.data?.category?.name}
              </Text>
            </Link>
            <Text className="text-grayText mx-2">
              {" "}
              <i className="icon-right-arrow" />{" "}
            </Text>
            <Text
              className="text-white text-lg sm:text-2xl"
              title={vendor.vendor_name}
            >
              {vendor.vendor_name || "Vendor Details"}
            </Text>
          </Title>
        </div>
      </Col>

      <Row
        gutter={[
          { xs: 0, sm: 16 },
          { xs: 0, sm: 16 },
        ]}
      >
        {/* Left Side */}
        <Col xs={24} md={10} xl={7} className="h-full mb-4">
          <div className="w-full">
            <div
              className="rounded-3xl border overflow-y-auto bg-gray border-solid border-liteGray w-full relative p-4"
              style={{ height: containerHeight }}
            >
              <div className="relative">
                <img
                  src={logoUrl}
                  alt={vendor.vendor_name || "Vendor"}
                  className="w-full h-40 rounded-2xl object-cover"
                  onError={(e) => {
                    e.target.src =
                      "https://media.istockphoto.com/id/1353379172/photo/cute-little-african-american-girl-looking-at-camera.jpg?s=170667a&w=is&k=20&c=JJ8IGmBvg9V_VGKdpDP6O0WR_H97epRjO-spB5-2V38=";
                  }}
                />
                <div className="absolute top-2 right-2">
                  <button
                    type="button"
                    onClick={handleFavoriteToggle}
                    className="flex items-center justify-center text-white bg-gray rounded-full py-[9px]  px-[2px]  h-7 w-7 hover:bg-[#303030] transition-colors cursor-pointer"
                    title={
                      isFavorited ? "Remove from favorites" : "Add to favorites"
                    }
                  >
                    <i
                      className={`text-lg flex items-center justify-center before:!m-0 ${
                        isFavorited
                          ? "icon-heart-filled text-red-500"
                          : "icon-heart-lineal"
                      }`}
                    />
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <div>
                  {vendor.is_new && (
                    <Tag className="bg-yellow-500 rounded-full text-black !text-xs">
                      New
                    </Tag>
                  )}
                  {vendor.is_preferred === 1 && (
                    <Tag className="bg-[#5A76FF] rounded-full text-white !text-xs ml-2">
                      Preferred
                    </Tag>
                  )}
                </div>
                <div className="mt-2">
                  <Text className="text-white font-bold text-xl">
                    {vendor.vendor_name || "Vendor Name"}
                  </Text>
                </div>
              </div>

              {vendor.website && (
                <div className="flex items-center mt-2">
                  <i className="icon-website before:!m-0 mr-2 text-primary text-2xl" />
                  <Link
                    to={vendor.website}
                    target="_blank"
                    className="text-[#5A76FF] truncate text-sm hover:underline"
                  >
                    {vendor.website}
                  </Link>
                </div>
              )}

              <div className="flex gap-3 flex-wrap 2xl:flex-nowrap 3xl:flex-nowrap mt-3">
                <Button
                  type="primary"
                  className="w-full text-sm sm:w-[calc(33.333%-0.5rem)]"
                  onClick={showRatingModal}
                >
                  <i className="icon-add before:!m-0" /> Add Ratings
                </Button>

                <Button
                  className="bg-primaryOpacity border-primary text-sm text-primary w-full sm:w-[calc(33.333%-0.5rem)]"
                  onClick={handleShare}
                >
                  Share <i className="icon-share before:!m-0 text-primary" />
                </Button>

                {/* <Button
                  className="w-full bg-erroOpacityr border-error text-error text-sm sm:w-[calc(33.333%-0.5rem)]"
                  onClick={showReportModal}
                >
                  Report
                </Button> */}
              </div>

              {/* View Ratings Button */}
              <div className="mt-3">
                <Button
                  className="w-full bg-[#4A90E2] border-[#4A90E2] text-white text-sm hover:bg-[#357ABD] hover:border-[#357ABD]"
                  onClick={handleViewRatings}
                >
                  <i className="icon-star before:!m-0" /> View Ratings
                </Button>
              </div>

              <div className="">
                <hr className="border-liteGray my-6" />
              </div>

              <div className="mt-4 mb-3">
                <Text className="text-white font-bold">Ratings </Text>
                <Tag className="bg-liteGray rounded-full text-gray-700 border-0 ml-1">
                  <i className="icon-star text-yellow-600 before:!m-0" />
                  {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
                </Tag>
                {totalReviews > 0 && (
                  <Text className="text-grayText text-xs ml-2">
                    ({totalReviews} reviews)
                  </Text>
                )}
              </div>

              {/* Rating Breakdown */}
              {ratingData && totalReviews > 0
                ? ratingBreakdown.map((ratingItem) => {
                    const percentage =
                      totalReviews > 0
                        ? Math.round((ratingItem.count / totalReviews) * 100)
                        : 0;

                    return (
                      <div
                        key={ratingItem.rating}
                        className="xl:w-4/5 flex gap-2 mb-2"
                      >
                        <div className="flex">
                          <span className="text-white font-medium">
                            {ratingItem.rating}
                          </span>
                          <i className="icon-star text-yellow-600" />
                        </div>
                        <Progress
                          percent={percentage}
                          showInfo={false}
                          strokeColor="#FF6D00"
                          trailColor="#373737"
                          strokeWidth={10}
                        />
                        <div className="text-liteGray">{ratingItem.count}</div>
                      </div>
                    );
                  })
                : // Default rating breakdown when no data
                  [5, 4, 3, 2, 1].map((rating, index) => (
                    <div key={index} className="xl:w-4/5 flex gap-2 mb-2">
                      <div className="flex">
                        <span className="text-white font-medium">{rating}</span>
                        <i className="icon-star text-yellow-600" />
                      </div>
                      <Progress
                        percent={0}
                        showInfo={false}
                        strokeColor="#FF6D00"
                        trailColor="#373737"
                        strokeWidth={10}
                      />
                      <div className="text-liteGray">0</div>
                    </div>
                  ))}
            </div>
          </div>
        </Col>

        {/* Right Side - Description or Ratings */}
        <Col xs={24} md={14} xl={17} className="h-full mb-4">
          <div className="w-full">
            <div
              className="rounded-3xl border overflow-y-auto bg-gray border-solid border-liteGray w-full relative p-4"
              style={{ height: containerHeight }}
            >
              {showRatings ? (
                // Show ratings view
                <div className="h-full">
                  {/* Back button */}
                  <div className="mb-4">
                    <Button
                      type="text"
                      className="text-primary p-0 h-auto font-medium"
                      onClick={handleBackToDescription}
                    >
                      <i className="icon-left-arrow before:!m-0 mr-2 text-primary" />
                      Back to Description
                    </Button>
                  </div>
                  
                  <VendorRatingsView 
                    vendorId={vendor.id} 
                    containerHeight={containerHeight}
                  />
                </div>
              ) : (
                // Show description content (original content)
                <div className="text-white h-full">
                  <div className="vendor-description-content h-full">
                    {vendor.description ? (
                      <div
                        className="description-html-content"
                        dangerouslySetInnerHTML={{ __html: vendor.description }}
                        style={{
                          color: "#fff",
                          lineHeight: "1.6",
                        }}
                      />
                    ) : (
                      <div className="no-description-message text-center py-20 flex flex-col justify-center items-center h-full">
                        <i className="icon-info before:!m-0 text-4xl text-grayText mb-4 block" />
                        <Text className="text-grayText text-lg block mb-2">
                          No Description Available
                        </Text>
                        <Text className="text-grayText text-sm">
                          This vendor hasn't provided a description yet. Please
                          check back later for more information about their
                          services and offerings.
                        </Text>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Custom styles for the HTML content */}
              <style jsx>{`
                .description-html-content {
                  color: #ffffff !important;
                }

                .description-html-content p {
                  color: #ffffff !important;
                  margin-bottom: 16px;
                  line-height: 1.6;
                }

                .description-html-content h1,
                .description-html-content h2,
                .description-html-content h3,
                .description-html-content h4,
                .description-html-content h5,
                .description-html-content h6 {
                  color: #ffffff !important;
                  margin: 20px 0 16px 0;
                  font-weight: bold;
                }

                .description-html-content img {
                  max-width: 100%;
                  height: auto;
                  border-radius: 8px;
                  margin: 16px 0;
                }

                .description-html-content ul,
                .description-html-content ol {
                  color: #ffffff !important;
                  margin: 16px 0;
                  padding-left: 24px;
                }

                .description-html-content li {
                  color: #ffffff !important;
                  margin-bottom: 8px;
                }

                .description-html-content a {
                  color: #5a76ff !important;
                  text-decoration: underline;
                }

                .description-html-content a:hover {
                  color: #4a66ef !important;
                }

                .description-html-content strong,
                .description-html-content b {
                  color: #ffffff !important;
                  font-weight: bold;
                }

                .description-html-content em,
                .description-html-content i {
                  color: #ffffff !important;
                  font-style: italic;
                }

                .description-html-content table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 16px 0;
                  color: #ffffff !important;
                }

                .description-html-content th,
                .description-html-content td {
                  border: 1px solid #373737;
                  padding: 12px;
                  text-align: left;
                  color: #ffffff !important;
                }

                .description-html-content th {
                  background-color: #373737;
                  font-weight: bold;
                }

                .description-html-content blockquote {
                  border-left: 4px solid #5a76ff;
                  padding-left: 16px;
                  margin: 16px 0;
                  color: #cccccc !important;
                  font-style: italic;
                }
              `}</style>
            </div>
          </div>
        </Col>
      </Row>

      {/* Report Modal */}
      <ReportModal
        isVisible={isReportModalVisible}
        onCancel={hideReportModal}
        companyName={vendor.vendor_name || "Vendor"}
        onSubmit={handleReportSubmit}
      />

      {/* Add Rating Modal */}
      <VendorAddRating
        isVisible={isRatingModalVisible}
        onCancel={hideRatingModal}
        companyName={vendor.vendor_name || "Vendor"}
        onSubmit={handleRatingSubmit}
      />
    </Row>
  );
};

export default VendorDetails;