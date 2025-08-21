import React, { useState, useEffect, useRef } from "react";
import { Typography, Row, Col, Tabs, Spin } from "antd";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ShadowBoxContainer from "../../components/AuthLayout/ShadowBoxContainer";
import MyConnectionTab from "./MyConnectionTab";
import { 
  fetchContractProcessorRequests,
  fetchContractProcessorRequestsForMyConnection
} from "../../services/Store/ContractProcessor/actions";
import AccountExecutiveTab from "./AccountExecutiveTab";

const { Text, Title } = Typography;

const AccountExecutive = () => {
  const dispatch = useDispatch();
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  const [activeKey, setActiveKey] = useState("1");
  const initialLoadDone = useRef(false);
  const [initialLoading, setInitialLoading] = useState(true); // Track only the initial loading
  
  // Select data from Redux store
  const { 
    contractProcessorRequests,
    contractProcessorRequestsLoading,
    contractProcessorRequestsError,
    contractProcessorRequestsForMyConnection,
    contractProcessorRequestsLoadingForMyConnection
  } = useSelector((state) => state.contractProcessor);

  // Fetch both data sets simultaneously on component mount
  useEffect(() => {
    if (!initialLoadDone.current) {
      // Set initial loading state
      setInitialLoading(true);
      
      // Create promises for both data fetches
      const processorsPromise = dispatch(fetchContractProcessorRequests({ 
        page: 1, 
        per_page: 20 ,
        roles:["AE"] 
      }));
      
      const connectionsPromise = dispatch(fetchContractProcessorRequestsForMyConnection({ 
        page: 1, 
        per_page: 20,
        friends_only: 1,
        roles:["AE"] 
      }));
      
      // When both complete, mark initial loading as done
      Promise.all([processorsPromise, connectionsPromise])
        .finally(() => {
          setInitialLoading(false);
          initialLoadDone.current = true;
        });
    }
  }, [dispatch]);

  // Set container height based on screen size
  useEffect(() => {
    const handleResize = () => {
      setContainerHeight(
        window.innerWidth < 768 ? "calc(100vh - 212px)" : "calc(100vh - 241px)"
      );
    };

    // Set initial height
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  const handleTabChange = (key) => {
    setActiveKey(key);
  };
  
  const items = [
    {
      key: "1",
      label: (
        <div className="flex items-center px-4">
          <span className="">Account Executive</span>
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
        <AccountExecutiveTab 
          containerHeight={containerHeight} 
          loading={contractProcessorRequestsLoading}
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
            {contractProcessorRequestsForMyConnection?.data?.pagination?.totalRecords || 0}
          </span>
        </div>
      ),
      children: <MyConnectionTab containerHeight={containerHeight} />,
    },
  ];

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
            <Text className="text-white text-lg sm:text-2xl">
              Account Executive
            </Text>
          </Title>
        </div>
      </Col>

      {initialLoading ? (
        <div className="flex justify-center items-center h-[50vh]">
          <Spin size="large"/>
        </div>
      ) : (
        <Col span={24} className="h-full mb-4">
          <div className="w-full">
            <div className="rounded-3xl border overflow-hidden bg-gray border-solid border-liteGray w-full relative">
              {/* Shadow effect at the bottom inside the container */}
              <div
                className="absolute bottom-0 left-0 right-0 h-12
                bg-gradient-to-t from-black/50 to-transparent 
                pointer-events-none z-10"
              ></div>

              {/* Scrollable content area with proper padding */}
              <div className="pt-2 h-full">
                <Tabs
                  defaultActiveKey="1"
                  items={items}
                  onChange={handleTabChange}
                />
              </div>
            </div>
          </div>
        </Col>
      )}
    </Row>
  );
};

export default AccountExecutive;