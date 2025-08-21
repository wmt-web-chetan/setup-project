import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Typography,
  Row,
  Col,
  Collapse,
  Form,
  Tabs,
  Input,
  Select,
  Button,
  Avatar,
  Spin,
  Empty,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CaretRightOutlined,
  UserOutlined,
  BankOutlined
} from "@ant-design/icons";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFavoritesList,
  toggleLikeStatusAction,
} from "../../services/Store/ContractProcessor/actions";
import { usaStates } from "../../helpers/constant";
const { Text, Title } = Typography;

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

// Import or access the base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL;

const ContractProcessorFavouite = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  const scrollRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [toggleLikeUserId, setToggleLikeUserId] = useState(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const initialLoadDone = useRef(false);

  // Determine roles, routes, entity information, and loan officer flag based on current route
  const { roles, baseRoute, entityType, entityTypePlural, isLoanOfficer, isRealEstateAgent } = useMemo(() => {
    if (location.pathname === '/loan-officer/favorites') {
      return {
        roles: ["LO"],
        baseRoute: '/loan-officer',
        entityType: 'Loan Officer',
        entityTypePlural: 'Loan Officers',
        isLoanOfficer: true,
        isRealEstateAgent: false
      };
    }

    if (location.pathname.includes("/account-executive/")) {
      return {
        roles: ["AE"],
        baseRoute: "/account-executive",
        entityType: "Account Executive",
        entityTypePlural: "Account Executives",
        isLoanOfficer: false,
        isRealEstateAgent: false
      };
    }
    if (location.pathname.includes("/real-estate-agent/")) {
      return {
        roles: ["REA"],
        baseRoute: "/real-estate-agent",
        entityType: "Real Estate Agent",
        entityTypePlural: "Real Estate Agents",
        isLoanOfficer: false,
        isRealEstateAgent: true
      };
    }
    // Default to Contract Processors
    return {
      roles: ["CP"],
      baseRoute: "/contract-processor",
      entityType: "Contract Processor",
      entityTypePlural: "Contract Processors",
      isLoanOfficer: false,
      isRealEstateAgent: false
    };
  }, [location.pathname]);

  // Select data from Redux store
  const {
    favoritesList,
    favoritesListLoading,
    isLoadingMoreFavorites,
    toggleLikeLoading,
  } = useSelector((state) => state.contractProcessor);


  const favorites = favoritesList?.data?.users || [];
  const pagination = favoritesList?.data?.pagination || {};
  const { currentPage, totalPage, totalRecords } = pagination;

  // Helper function to build API parameters
  const buildApiParams = (
    page = 1,
    search = searchTerm,
    state = selectedState
  ) => ({
    page,
    search: search || undefined,
    per_page: 20,
    friends_only: 1,
    liked_only: 1, // Parameter for favorites
    roles: roles,
    state: state || undefined,
  });

  // Initial data load
  useEffect(() => {
    if (!initialLoadDone.current) {
      dispatch(fetchFavoritesList(buildApiParams()));
      initialLoadDone.current = true;
    }
  }, [dispatch, roles]);

  // Effect for search
  useEffect(() => {
    if (hasSearched || debouncedSearchTerm !== "") {
      setIsSearching(true);
      dispatch(
        fetchFavoritesList(
          buildApiParams(1, debouncedSearchTerm, selectedState)
        )
      ).then(() => {
        setIsSearching(false);
      });

      if (!hasSearched) {
        setHasSearched(true);
      }
    }
  }, [debouncedSearchTerm, dispatch, hasSearched, roles, selectedState]);

  // Effect for state filter change
  useEffect(() => {
    if (selectedState !== "") {
      setIsSearching(true);
      dispatch(
        fetchFavoritesList(buildApiParams(1, searchTerm, selectedState))
      ).then(() => {
        setIsSearching(false);
      });
    }
  }, [selectedState, dispatch, roles, searchTerm]);

  // Clear toggle like user ID when toggle is completed
  useEffect(() => {
    if (!toggleLikeLoading && toggleLikeUserId) {
      setToggleLikeUserId(null);
    }
  }, [toggleLikeLoading, toggleLikeUserId]);

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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStateChange = (value) => {
    setSelectedState(value || "");
  };

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
    if (isLoadingMoreFavorites || currentPage >= totalPage) return;

    // Load next page
    dispatch(
      fetchFavoritesList(
        buildApiParams(currentPage + 1, searchTerm, selectedState)
      )
    );
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

  // Function to truncate text
  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  // Show loading state
  const showLoading = favoritesListLoading || isSearching;

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
            <Text className="text-white text-lg sm:text-2xl">Favorites</Text>
          </Title>
        </div>
      </Col>

      <Col span={24} className="h-full mb-4">
        <div className={`w-full `}>
          <div
            className={` rounded-3xl border overflow-hidden bg-gray border-solid border-liteGray w-full relative`}
          >
            {/* Shadow effect at the bottom inside the container */}
            <div
              className={`absolute bottom-0 left-0 right-0 h-12
           bg-gradient-to-t from-black/50 to-transparent 
             
           pointer-events-none z-10`}
            ></div>

            <div className="flex flex-col h-full px-4 mt-5 ">
              <div className="flex items-center gap-2">
                <Text className="text-white text-xl sm:text-xl font-bold">
                  {entityTypePlural}
                </Text>
                <span className="mx-1 text-grayText">&#8226;</span>
                <div className="bg-primaryOpacity px-2 text-primary rounded-lg">
                  {totalRecords || 0}
                </div>
              </div>
              {/* Fixed Header Section */}
              <div className="flex-none pb-7 mt-8">
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
                  {/* {!isLoanOfficer && !isRealEstateAgent && (


                  <Col xs={24} md={12} lg={6}>
                    <div className="w-full md:w-auto">
                      <Select
                        size="large"
                        placeholder="Filter by State"
                        value={selectedState || undefined}
                        style={{ width: "200px" }}
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
                  </Col>
                  )} */}
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
                ) : favorites.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-6 gap-4 pb-3">
                    {favorites.map((user) => (
                      <div
                        key={user.id}
                        onClick={() =>
                          navigate(`${baseRoute}/detail/${user.id}`)
                        }
                        className="cursor-pointer"
                      >
                        <div className="bg-liteGray px-2 py-3 xl:px-3 xl:py-4 2xl:px-4 2xl:py-6 rounded-2xl">
                          <div className="flex justify-center items-center flex-col relative">
                            <div className="absolute top-0 right-0 3xl:right-5">
                              <Button
                                type="text"
                                icon={
                                  <i className="icon-heart-filled text-red-800 text-xl" />
                                }
                                className="text-white bg-gray"
                                shape="circle"
                                onClick={(e) =>
                                  handleToggleFavorite(
                                    user?.friend_status?.friend_request_id,
                                    e
                                  )
                                }
                                loading={
                                  toggleLikeLoading &&
                                  toggleLikeUserId === user.id
                                }
                              />
                            </div>
                            {user?.profile_photo_path ? (
                              <Avatar
                                size={100}
                                src={getUserProfileImage(user)}
                                icon={<UserOutlined />}
                                className="bg-primary"
                              />
                            ) : (
                              <Avatar
                                size={100}
                                style={{
                                  backgroundColor: "#fde3cf",
                                  color: "#f56a00",
                                }}
                                className="object-cover rounded-full !text-5xl"
                              >
                                {user.name?.[0] || user.name?.[0] || "?"}
                              </Avatar>
                            )}

                            <SmartEllipsisText strong className="text-white font-bold mt-3" >
                              {user.name}
                            </SmartEllipsisText>
                            <SmartEllipsisText className="text-grayText text-sm mt-2 text-left w-full block" >
                              {user.email}
                            </SmartEllipsisText>
                          </div>

                          {!isLoanOfficer && (
                            user?.user_detail?.service_name?.length > 0 ?
                              <div className="flex justify-start gap-3 mt-2">
                                <div className="flex items-center min-w-0">
                                  <div className="flex items-center justify-start w-full text-base min-w-0">
                                    <BankOutlined className="text-primary text-xl mr-2 ml-1" />
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
                              <div className="flex justify-center gap-3">
                                <div className="flex items-center justify-start w-full">
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
                            <div className="flex justify-center gap-3 ">
                              {/* <div className="flex items-center">
                        <i className="icon-location text-primary text-xl" />
                        <div className="text-sm">{truncateText(user?.user_detail?.state, 10)}</div>
                      </div> */}
                              <div className="flex items-center justify-start w-full">
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
                  <div className="flex justify-center items-center h-full">
                    <Empty
                      description={
                        <span className="text-grayText">
                          No favorites found
                        </span>
                      }
                    />
                  </div>
                )}

                {/* Loading indicator for infinite scroll */}
                {isLoadingMoreFavorites && (
                  <div className="flex justify-center my-4">
                    <Spin />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Col>
    </Row>
  );
};

export default ContractProcessorFavouite;