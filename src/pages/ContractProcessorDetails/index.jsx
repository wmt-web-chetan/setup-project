import {
  Col,
  Row,
  Typography,
  Spin,
} from "antd";
import React, { useEffect, useState, useMemo } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import "./contractprocessorDetail.scss";
import DocumentRepositoryTab from "./DocumentRepositoryTab";
import SimpleChatWindow from "./SimpleChatWindow";
import ClientTestimonialTab from "./ClientTestimonialTab";
import ContractProcessorLeftPanel from "./ContractProcessorLeftPanel";
import { useDispatch, useSelector } from "react-redux";
import { fetchContractProcessorUserDetails } from "../../services/Store/ContractProcessor/actions";
import { clearContractProcessorUserDetails } from "../../services/Store/ContractProcessor/slice";

const { Title, Text } = Typography;

// Custom Segmented Control Component
const CustomSegmented = ({ options, value, onChange }) => {
  return (
    <div className="flex rounded-lg bg-liteGray p-1 mb-4">
      {options.map((option) => (
        <button
          key={option}
          className={`flex-1 py-1 px-4 text-center rounded-md transition-all duration-300 truncate ${
            value === option
              ? "bg-primary text-white font-medium"
              : "bg-transparent text-grayText hover:text-white"
          }`}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

const ContractProcessorDetails = () => {
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  const [value, setValue] = useState("Document Repository");
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const dispatch = useDispatch();

  // Determine base route and entity type based on current route
  const { baseRoute, entityType, entityTypePlural } = useMemo(() => {
    if (location.pathname.includes('/loan-officer/')) {
      return {
        baseRoute: '/loan-officer',
        entityType: 'Loan Officer',
        entityTypePlural: 'Loan Officers'
      };
    }
    if (location.pathname.includes('/account-executive/')) {
      return {
        baseRoute: '/account-executive',
        entityType: 'Account Executive',
        entityTypePlural: 'Account Executives'
      };
    }
    if (location.pathname.includes('/real-estate-agent/')) {
      return {
        baseRoute: '/real-estate-agent',
        entityType: 'Real Estate Agent',
        entityTypePlural: 'Real Estate Agents'
      };
    }
    // Default to Contract Processors
    return {
      baseRoute: '/contract-processor',
      entityType: 'Contract Processor',
      entityTypePlural: 'Contract Processors'
    };
  }, [location.pathname]);

  useEffect(() => {
    dispatch(clearContractProcessorUserDetails())
  }, [location])

  // Get user details from Redux store
  const { contractProcessorUserDetails, contractProcessorUserDetailsLoading } = useSelector((state) => state.contractProcessor);
  const userData = contractProcessorUserDetails?.data?.user || {};


  // Fetch user details when component mounts
  useEffect(() => {
    if (params?.id) {
      dispatch(fetchContractProcessorUserDetails(params.id));
    }
  }, [dispatch, params?.id]);

  // // Check if user is blocked and redirect
  // useEffect(() => {
  //   if (userData?.recievedFriendRequests?.status === "block") {
  //     navigate(baseRoute);
  //   }
  // }, [userData, navigate, baseRoute]);

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

  // Custom styles to hide scrollbar but keep scrolling functionality
  const scrollableContentStyle = {
    overflowY: "auto",
    scrollbarWidth: "none", // Firefox
    msOverflowStyle: "none", // IE and Edge
  };

  // Render loading spinner when global loading is active
  if (contractProcessorUserDetailsLoading) {
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
              to={baseRoute}
              className="text-primary hover:text-primary flex justify-center"
            >
              <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
                {entityTypePlural}
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
        {/* Left Side - Now using separate component */}
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
              {/* Custom Segmented Control replacing Ant Design's Segmented */}
              <CustomSegmented
                options={["Document Repository", "Chat", "Client Testimonials"]}
                value={value}
                onChange={setValue}
              />

              {/* Content area based on selected tab */}
              {value === "Document Repository" && (
                <div>
                  <DocumentRepositoryTab />
                </div>
              )}

              {value === "Chat" && (
                <div className="h-full">
                  <SimpleChatWindow />
                </div>
              )}

              {value === "Client Testimonials" && <ClientTestimonialTab />}
            </div>
          </div>
        </Col>
      </Row>
    </Row>
  );
};

export default ContractProcessorDetails;