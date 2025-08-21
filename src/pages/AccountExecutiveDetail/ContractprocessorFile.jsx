import { Button, Col, Progress, Row, Spin, Tag, Typography, message } from "antd";
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReportModal from "./VendorReportModal";
import VendorAddRating from "./VendorAddRating";
import "./contractprocessorDetail.scss";
import DocumentRepositoryTab from "./DocumentRepositoryTab";
import ClientTestimonialTab from "./ClientTestimonialTab";
import File from "./File";
import ContractProcessorLeftPanel from "./ContractProcessorLeftPanel";
import { useDispatch, useSelector } from "react-redux";
import { fetchContractProcessorUserDetails } from "../../services/Store/ContractProcessor/actions";

const { Title, Text } = Typography;

const ContractprocessorFile = () => {
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get user details from Redux store
  const { contractProcessorUserDetails, contractProcessorUserDetailsLoading } = useSelector((state) => state.contractProcessor);
  const { friendFolderFiles } = useSelector((state) => state.friendFolders); // Add this to get folder data
  
  const userData = contractProcessorUserDetails?.data?.user || {};
  const folderData = friendFolderFiles?.data?.folderData || {}; // Get folder data from Redux

  // Fetch user details when component mounts - Same pattern as ContractProcessorDetails
  useEffect(() => {
    if (params?.id) {
      dispatch(fetchContractProcessorUserDetails(params.id));
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  }, [dispatch, params?.id]);

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

  const HandleNavigate = () => {
    navigate(`/account-executive/detail/${params.id}/folder/${params.folderId}`);
  };

  // Custom styles to hide scrollbar but keep scrolling functionality - Same as ContractProcessorDetails
  const scrollableContentStyle = {
    overflowY: "auto",
    scrollbarWidth: "none", // Firefox
    msOverflowStyle: "none", // IE and Edge
  };

  // Render loading spinner when global loading is active - Same pattern as ContractProcessorDetails
  if (contractProcessorUserDetailsLoading || loading) {
    return (
      <div className="bg-darkGray h-full w-full flex justify-center items-center" style={{ height: '100vh' }}>
        <Spin size="large" />
      </div>
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
              to="/account-executive"
              className="text-primary hover:text-primary flex justify-center"
            >
              <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
                Account Executives
              </Text>
            </Link>
            <Text className="text-grayText mx-2">
              {" "}
              <i className="icon-right-arrow" />{" "}
            </Text>
            <Text className="text-white text-lg sm:text-2xl">
              {userData?.name || ""}
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
        {/* Left Side - Using ContractProcessorLeftPanel component */}
        <Col xs={24} md={10} xl={7} className="h-full mb-4">
          <ContractProcessorLeftPanel 
            userData={userData}
            containerHeight={containerHeight}
          />
        </Col>

        {/* Right Side */}
        <Col xs={24} md={14} xl={17} className="mb-4">
          <div className="w-full">
            <div
              className="rounded-3xl border overflow-y-auto bg-gray border-solid border-liteGray w-full relative p-4"
              style={{ height: containerHeight, ...scrollableContentStyle }}
            >
              <div className="flex items-center text-lg font-semibold mb-6">
                <Button shape="circle" onClick={HandleNavigate}>
                  <i className="icon-back-arrow" />
                </Button>
                <Link
                  to={`/account-executive/detail/${params.id}/folder/${params.folderId}`}
                  className="text-primary hover:text-primary flex justify-center"
                >
                  <Text className="text-grayText hover:text-primary cursor-pointer text-base ml-2">Loan Application Documents</Text>
                </Link>
                <Text className="text-grayText">
                  {" "}
                  <i className="icon-right-arrow" />{" "}
                </Text>
                <Text>{folderData?.name || "Loading..."}</Text>
              </div>
              <div>
                <File />
              </div>
            </div>
          </div>
        </Col>
      </Row>
      {/* Report Modal */}
      <ReportModal
        isVisible={isReportModalVisible}
        onCancel={hideReportModal}
        companyName="Elite Mortgage Solutions"
        onSubmit={handleReportSubmit}
      />
      {/* Add Rating Modal */}
      <VendorAddRating
        isVisible={isRatingModalVisible}
        onCancel={hideRatingModal}
        companyName="Elite Mortgage Solutions"
        onSubmit={handleRatingSubmit}
      />
    </Row>
  );
};

export default ContractprocessorFile;