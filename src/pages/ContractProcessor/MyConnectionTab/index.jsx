import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Avatar,
  Button,
  Col,
  Input,
  Row,
  Select,
  Typography,
  Spin,
  Empty,
} from "antd";
import { SearchOutlined, UserOutlined, CaretRightOutlined, BankOutlined } from "@ant-design/icons";
import {
  fetchContractProcessorRequestsForMyConnection,
  toggleLikeStatusAction
} from "../../../services/Store/ContractProcessor/actions";
import { usaStates } from "../../../helpers/constant";
// Import or access the base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL;

const { Text } = Typography;

// Custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const MyConnectionTab = ({ containerHeight, isActive }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const scrollRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [toggleLikeUserId, setToggleLikeUserId] = useState(null); // Track which user's like is being toggled
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Determine roles, entity name, routes, and loan officer flag based on current route
  const { roles, entityName, detailRoute, favoritesRoute, isLoanOfficer, isRealEstateAgent } = useMemo(() => {
    if (location.pathname === '/loan-officer') {
      return {
        roles: ["LO"],
        entityName: "Loan Officer Connections",
        detailRoute: "/loan-officer/detail",
        favoritesRoute: "/loan-officer/favorites",
        isLoanOfficer: true,
        isRealEstateAgent: false
      };
    }
    if (location.pathname === '/account-executive') {
      return {
        roles: ["AE"],
        entityName: "Account Executive Connections",
        detailRoute: "/account-executive/detail",
        favoritesRoute: "/account-executive/favorites",
        isLoanOfficer: false,
        isRealEstateAgent: false

      };
    }
    if (location.pathname === '/real-estate-agent') {
      return {
        roles: ["REA"],
        entityName: "Real Estate Agent Connections",
        detailRoute: "/real-estate-agent/detail",
        favoritesRoute: "/real-estate-agent/favorites",
        isLoanOfficer: false,
        isRealEstateAgent: true

      };
    }
    // Default to Contract Processors
    return {
      roles: ["CP"],
      entityName: "Contract Processor Connections",
      detailRoute: "/contract-processor/detail",
      favoritesRoute: "/contract-processor/favorites",
      isLoanOfficer: false,
      isRealEstateAgent: false

    };
  }, [location.pathname]);

  // Select data from Redux store
  const {
    contractProcessorRequestsForMyConnection,
    contractProcessorRequestsLoadingForMyConnection,
    isLoadingMoreForMyConnection,
    toggleLikeLoading
  } = useSelector((state) => state.contractProcessor);

  const connections = contractProcessorRequestsForMyConnection?.data?.users || [];
  const pagination = contractProcessorRequestsForMyConnection?.data?.pagination || {};
  const likeCount = contractProcessorRequestsForMyConnection?.data?.like_count || 0;
  const { currentPage, totalPage } = pagination;


  // Helper function to build API parameters
  const buildApiParams = (page = 1, search = searchTerm, state = selectedState) => ({
    page,
    search: search || undefined,
    per_page: 20,
    friends_only: 1,
    roles: roles,
    state: state || undefined
  });

  // Fetch data every time tab becomes active
  useEffect(() => {
    if (isActive) {
      dispatch(fetchContractProcessorRequestsForMyConnection(buildApiParams()));
      // Reset search when tab becomes active
      setSearchTerm("");
      setSelectedState("");
      setHasSearched(false);
    }
  }, [dispatch, isActive, roles]);

  // Effect for search - only triggered when search term changes
  useEffect(() => {
    if (hasSearched || debouncedSearchTerm !== "") {
      setIsSearching(true); // Set searching flag
      dispatch(fetchContractProcessorRequestsForMyConnection(buildApiParams(1, debouncedSearchTerm, selectedState))).then(() => {
        setIsSearching(false); // Clear searching flag when done
      });

      // Set hasSearched to true after the first search
      if (!hasSearched) {
        setHasSearched(true);
      }
    }
  }, [debouncedSearchTerm, dispatch, hasSearched, roles, selectedState]);

  // Effect for state filter change
  useEffect(() => {
    if (isActive && hasSearched) { // Only trigger if user has interacted with filters
      setIsSearching(true);
      dispatch(fetchContractProcessorRequestsForMyConnection(buildApiParams(1, searchTerm, selectedState))).then(() => {
        setIsSearching(false);
      });
    }
  }, [selectedState, dispatch, isActive, roles, searchTerm, hasSearched]);


  // Clear toggle like user ID when toggle is completed
  useEffect(() => {
    if (!toggleLikeLoading && toggleLikeUserId) {
      setToggleLikeUserId(null);
    }
  }, [toggleLikeLoading, toggleLikeUserId]);

  const handleScroll = (e) => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Check if scrolled to bottom (with a 50px threshold)
    if (scrollHeight - scrollTop - clientHeight < 50) {
      loadMoreData();
    }
  };

  const loadMoreData = () => {
    // Don't load more if already loading or no more pages
    if (isLoadingMoreForMyConnection || currentPage >= totalPage) return;

    // Load next page
    dispatch(fetchContractProcessorRequestsForMyConnection(buildApiParams(currentPage + 1, searchTerm, selectedState)));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStateChange = (value) => {
    setSelectedState(value || "");
    if (!hasSearched) {
      setHasSearched(true);
    }
  };


  // Function to handle toggling favorite status
  const handleToggleFavorite = (userId, e) => {
    e.stopPropagation(); // Prevent card click navigation
    setToggleLikeUserId(userId); // Set the currently toggling user
    dispatch(toggleLikeStatusAction({ id: userId }));
  };

  // Function to get user profile image URL with fallback
  const getUserProfileImage = (user) => {
    if (user?.profile_photo_path) {
      return `${API_BASE_URL}/${user.profile_photo_path}`;
    }
    return null; // Return null to trigger the fallback icon
  };

  // Text truncation function (similar to ContractProcessorsTab)
  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Show loading state for both initial loading and search in progress
  const showLoading = contractProcessorRequestsLoadingForMyConnection || isSearching;

  const SmartEllipsisText = ({ children, className, ...props }) => {
    const [isOverflowing, setIsOverflowing] = useState(false);
    const textRef = useRef(null);

    useEffect(() => {
      const checkOverflow = () => {
        const element = textRef.current;
        if (element) {
          // Check if the element's scroll width is greater than its client width
          const isTextOverflowing = element.scrollWidth > element.clientWidth;
          setIsOverflowing(isTextOverflowing);
        }
      };

      checkOverflow();

      // Re-check on window resize
      window.addEventListener('resize', checkOverflow);
      return () => window.removeEventListener('resize', checkOverflow);
    }, [children]);

    return (
      <Text
        ref={textRef}
        className={className}
        ellipsis={{
          tooltip: isOverflowing ? { title: children } : false
        }}
        {...props}
      >
        {children}
      </Text>
    );
  };

  return (
    <div className="flex flex-col h-full px-4">
      {/* Fixed Header Section */}
      <div className="flex-none pb-5">
        <Row gutter={[10, 10]}>
          <Col xs={24} md={12} lg={6}>
            <Input
              prefix={<SearchOutlined className="text-grayText mr-2" />}
              placeholder="Search"
              className="px-3 rounded-full"
              size="large"
              value={searchTerm}
              onChange={handleSearchChange}
              allowClear
            />
          </Col>


          <Col xs={24} md={6} lg={6}>
            {roles[0] === "CP" && (

              <div className="w-full md:w-auto">
                <Select
                  size="large"
                  placeholder="Filter by State"
                  value={selectedState || undefined}
                  style={{ width: "160px" }}
                  className="bg-[#373737] rounded-full text-white filterSelection"
                  dropdownStyle={{
                    backgroundColor: "#212121",
                    borderRadius: "8px",
                    color: "white",
                  }}
                  filterOption={(input, option) =>
                    (option?.label || "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  suffixIcon={
                    <CaretRightOutlined className="rotate-90 text-white" />
                  }
                  options={usaStates}
                  onChange={handleStateChange}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                />
              </div>
            )}
          </Col>
          <Col xs={24} md={6} lg={12} className="flex justify-end">
            <Button
              type="default"
              size="large"
              className="bg-gray rounded-full text-white md:px-5 py-2"
              onClick={() => navigate(favoritesRoute)}
            >
              Favorites
              <div className="bg-primaryOpacity rounded-full text-primary px-2 ">
                {likeCount}
              </div>
            </Button>
          </Col>
        </Row>
      </div>

      {/* Scrollable Cards Section */}
      <div
        ref={scrollRef}
        className={`flex-grow overflow-x-hidden overflow-y-auto`}
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        {showLoading ? (
          <div className="flex justify-center items-center h-full">
            <Spin size="large" />
          </div>
        ) : connections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-6 gap-2  2xl:gap-4 3xl:gap-5 pb-3">
            {connections.map((user, index) => (
              <div key={user.id} onClick={() => navigate(`${detailRoute}/${user.id}`)} className="cursor-pointer">
                <div className="bg-liteGray px-2 py-3 xl:px-3 xl:py-4 2xl:px-4 2xl:py-6 rounded-2xl h-full">
                  <div className="flex justify-center items-center flex-col relative">
                    <div className="absolute top-0 right-0 3xl:right-6">
                      <Button
                        type="text"
                        icon={
                          user?.friend_status?.is_like ? (
                            <i className="icon-heart-filled text-red-800 text-xl" />
                          ) : (
                            <i className="icon-heart-lineal text-xl" />
                          )
                        }
                        className="text-white bg-gray"
                        shape="circle"
                        onClick={(e) => handleToggleFavorite(user?.friend_status?.friend_request_id, e)}
                        loading={toggleLikeLoading && toggleLikeUserId === user.id}
                      />
                    </div>
                    {
                      user?.profile_photo_path ?
                        <Avatar
                          size={100}
                          src={getUserProfileImage(user)}
                          icon={<UserOutlined />} // Fallback icon when no image is available
                          className="bg-gray" // Background color for the icon fallback
                        />
                        :
                        <Avatar
                          size={100}
                          style={{
                            backgroundColor: "#fde3cf",
                            color: "#f56a00",
                          }}
                          className="object-cover rounded-full !text-5xl"
                        >
                          {user.name?.[0] ||
                            user.name?.[0] ||
                            "?"}
                        </Avatar>
                    }
                    <SmartEllipsisText strong className="text-white font-bold mt-3" >
                      {user.name}
                    </SmartEllipsisText>
                    <SmartEllipsisText className="text-grayText text-sm mt-2 text-center block" >
                      {user.email}
                    </SmartEllipsisText>
                  </div>





                  {!isLoanOfficer && (
                    user?.user_detail?.service_name?.length > 0 ?
                      <div className="flex justify-start gap-3 mt-2">
                        <div className="flex items-center min-w-0">
                          <div className="flex items-center text-base min-w-0 pl-1">
                            <BankOutlined className="text-primary text-xl mr-2" />
                            <SmartEllipsisText >
                              {user?.user_detail?.service_name}
                            </SmartEllipsisText>
                          </div>
                        </div>
                      </div>
                      : null
                  )}

                  {roles[0] === "CP" && (
                    user?.user_detail?.state ?
                      <div className="flex justify-start gap-3">
                        <div className="flex items-center">
                          <i className=" icon-location text-primary text-xl" />
                          <div className="text-sm">
                            {truncateText(user?.user_detail?.state, 20)}{" "}
                          </div>
                        </div>
                      </div>
                      : null
                  )}

                  {/* Conditionally render location and experience only if NOT loan officer */}
                  {!isLoanOfficer && user?.user_detail?.experience !== null && (
                    <div className="flex justify-start gap-3 ">
                      {/* <div className="flex items-center">
                        <i className="icon-location text-primary text-xl" />
                        <div className="text-sm">{truncateText(user?.user_detail?.state, 10)}</div>
                      </div> */}
                      <div className="flex items-center">
                        <i className="icon-experience text-primary text-xl" />
                        <div className="text-sm">{truncateText(user?.user_detail?.experience, 3)} Years</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center h-[36vh]">
            <Empty
              description={
                <span className="text-grayText">
                  No {entityName} Found
                </span>
              }
            />
          </div>
        )}

        {/* Loading indicator for infinite scroll */}
        {isLoadingMoreForMyConnection && (
          <div className="flex justify-center my-4">
            <Spin />
          </div>
        )}
      </div>
    </div>
  );
};

export default MyConnectionTab;