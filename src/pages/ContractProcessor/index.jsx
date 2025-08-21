import React, { useState, useEffect, useRef, useMemo } from "react";
import { Typography, Row, Col, Tabs, Spin, Avatar } from "antd";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { SearchOutlined, UserOutlined } from "@ant-design/icons";
import ShadowBoxContainer from "../../components/AuthLayout/ShadowBoxContainer";
import ContractProcessorsTab from "./ContractProcessorsTab";
import MyConnectionTab from "./MyConnectionTab";
import {
  fetchContractProcessorRequests,
  fetchContractProcessorRequestsForMyConnection,
} from "../../services/Store/ContractProcessor/actions";
import PendingRequest from "./PendingRequest";
import { getStorage } from "../../utils/commonfunction";
  
const { Text, Title } = Typography;

const ContractProcessor = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  const [activeKey, setActiveKey] = useState("1");
  const initialLoadDone = useRef(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Determine roles and page title based on current route
  const { roles, pageTitle } = useMemo(() => {
    if (location.pathname === "/loan-officer") {
      return {
        roles: ["LO"],
        pageTitle: "Loan Officers",
      };
    }
    if (location.pathname === "/account-executive") {
      return {
        roles: ["AE"],
        pageTitle: "Account Executive",
      };
    }
    if (location.pathname === "/real-estate-agent") {
      return {
        roles: ["REA"],
        pageTitle: "Real Estate Agent",
      };
    }
    // Default to Contract Processors
    return {
      roles: ["CP"],
      pageTitle: "Contract Processors",
    };
  }, [location.pathname]);

  // Select data from Redux store
  const {
    contractProcessorRequests,
    contractProcessorRequestsLoading,
    contractProcessorRequestsError,
    contractProcessorRequestsForMyConnection,
    contractProcessorRequestsLoadingForMyConnection,
    sendFriendRequest,
    sendFriendRequestLoading,
    toggleLoading,
    toggleLikeLoading,
  } = useSelector((state) => state.contractProcessor);



  // Function to refetch main data for counts
  const refetchMainData = () => {
    dispatch(
      fetchContractProcessorRequests({
        page: 1,
        per_page: 20,
        roles: roles,
      })
    );
  };

  // Function to refetch My Connections data for counts
  const refetchMyConnectionsData = () => {
    dispatch(
      fetchContractProcessorRequestsForMyConnection({
        page: 1,
        per_page: 20,
        friends_only: 1,
        roles: roles,
      })
    );
  };

  // Fetch only the first tab data initially
  useEffect(() => {
    if (!initialLoadDone.current) {
      setInitialLoading(true);

      // Fetch both Contract Processors and My Connections data for counts
      Promise.all([
        dispatch(
          fetchContractProcessorRequests({
            page: 1,
            per_page: 20,
            roles: roles,
          })
        ),
        dispatch(
          fetchContractProcessorRequestsForMyConnection({
            page: 1,
            per_page: 20,
            friends_only: 1,
            roles: roles,
          })
        ),
      ]).finally(() => {
        setInitialLoading(false);
        initialLoadDone.current = true;
      });
    }
  }, [dispatch, roles]);

  // Listen for friend request actions completion and refetch data
  useEffect(() => {
    if (
      !sendFriendRequestLoading &&
      sendFriendRequest &&
      initialLoadDone.current
    ) {
      // Refetch main data to update counts after friend request is sent
      refetchMainData();
    }
  }, [sendFriendRequestLoading, sendFriendRequest]);

  // Listen for block/unblock actions completion and refetch data
  useEffect(() => {
    if (!toggleLoading && initialLoadDone.current) {
      // Refetch main data to update counts after block/unblock action
      refetchMainData();
      // Also refetch My Connections data as blocking might affect connections
      refetchMyConnectionsData();
    }
  }, [toggleLoading]);

  // Listen for like toggle actions completion and refetch My Connections data
  useEffect(() => {
    if (!toggleLikeLoading && initialLoadDone.current) {
      // Refetch My Connections data to update like count
      refetchMyConnectionsData();
    }
  }, [toggleLikeLoading]);

  // Custom event listener for pending request actions
  useEffect(() => {
    const handlePendingRequestAction = () => {
      // Refetch both datasets when pending requests are accepted/declined
      refetchMainData();
      refetchMyConnectionsData();
    };

    // Listen for custom events from PendingRequest component
    window.addEventListener(
      "pendingRequestActionCompleted",
      handlePendingRequestAction
    );

    return () => {
      window.removeEventListener(
        "pendingRequestActionCompleted",
        handlePendingRequestAction
      );
    };
  }, []);

  // Set container height based on screen size
  useEffect(() => {
    const handleResize = () => {
      setContainerHeight(
        window.innerWidth < 768 ? "calc(100vh - 212px)" : "calc(100vh - 210px)"
      );
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleTabChange = (key) => {
    setActiveKey(key);
  };

  const userLoginRole = getStorage("userLoginRole", true);


  const allItems = [
    {
      key: "1",
      label: (
        <div className="flex items-center px-4">
          <span className="">{pageTitle}</span>
          <span
            className={`ml-2 ${
              activeKey == "1"
                ? "text-primary bg-primaryOpacity"
                : "bg-liteGray text-grayText"
            } px-2 font-bold rounded-lg text-sm `}
          >
            {contractProcessorRequests?.data?.pagination?.totalRecords || 0}
          </span>
        </div>
      ),
      children: (
        <ContractProcessorsTab
          containerHeight={containerHeight}
          loading={contractProcessorRequestsLoading}
          isActive={activeKey === "1"}
        />
      ),
    },
    {
      key: "2",
      label: (
        <div className="flex items-center px-4">
          <span className="font-medium">My Connections</span>
          <span
            className={`ml-2 ${
              activeKey == "2"
                ? "text-primary bg-primaryOpacity"
                : "bg-liteGray text-grayText"
            } px-2 font-bold rounded-lg text-sm`}
          >
            {contractProcessorRequestsForMyConnection?.data?.pagination
              ?.totalRecords || 0}
          </span>
        </div>
      ),
      children: (
        <MyConnectionTab
          containerHeight={containerHeight}
          isActive={activeKey === "2"}
        />
      ),
    },
    {
      key: "3",
      label: (
        <div className="flex items-center px-4">
          <span className="font-medium">Pending Request</span>
          <span
            className={`ml-2 ${
              activeKey == "3"
                ? "text-primary bg-primaryOpacity"
                : "bg-liteGray text-grayText"
            } px-2 font-bold rounded-lg text-sm`}
          >
            {contractProcessorRequests?.data?.pendingCount || 0}
          </span>
        </div>
      ),
      children: (
        <div>
          <PendingRequest isActive={activeKey === "3"} />
        </div>
      ),
    },
  ];

  // Filter items based on user role
const items = userLoginRole?.name === "SA" 
  ? allItems.filter(item => item.key === "1")
  : allItems;

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
            <Text className="text-white text-lg sm:text-2xl">{pageTitle}</Text>
          </Title>
        </div>
      </Col>

      {initialLoading ? (
        <div className="flex justify-center items-center h-[50vh]">
          <Spin size="large" />
        </div>
      ) : (
        <Col span={24} className="h-full mb-4">
          <ShadowBoxContainer
            height={containerHeight}
            className={"!p-0"}
            // overflow="hidden"
          >
            <div
              className="absolute bottom-0 left-0 right-0 h-12
                bg-gradient-to-t from-black/50 to-transparent 
                pointer-events-none z-10"
            ></div>

            <div className="pt-2 h-full">
              <Tabs
                defaultActiveKey="1"
                items={items}
                onChange={handleTabChange}
              />
            </div>
          </ShadowBoxContainer>
        </Col>
      )}
    </Row>
  );
};

export default ContractProcessor;
