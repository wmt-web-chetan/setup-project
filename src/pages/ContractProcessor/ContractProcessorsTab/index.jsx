import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
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
  Drawer,
  Tag,
  Progress,
} from "antd";
import {
  CaretRightOutlined,
  SearchOutlined,
  UserOutlined,
  BankOutlined,
} from "@ant-design/icons";
import {
  fetchContractProcessorRequests,
  sendFriendRequestAction,
  toggleBlockUnblockContractProcessorAction,
} from "../../../services/Store/ContractProcessor/actions";
import { usaStates } from "../../../helpers/constant";
import { getStorage } from "../../../utils/commonfunction";
import { IMAGE_BASE_URL } from "../../../utils/constant";

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

const ContractProcessorsTab = ({ containerHeight, isActive }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const containerRef = useRef(null);
  const initialLoadDone = useRef(false);

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [requestingUserId, setRequestingUserId] = useState(null);
  const [unblockingUserId, setUnblockingUserId] = useState(null);
  const [open, setOpen] = useState(false);
  const [drawerDetail, setDrawerDetail] = useState(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const userLoginRole = getStorage("userLoginRole", true);

  // Determine roles and entity name based on current route
  const { roles, entityName, isLoanOfficer, isRealEstateAgent } =
    useMemo(() => {
      if (location.pathname === "/loan-officer") {
        return {
          roles: ["LO"],
          entityName: "Loan Officers",
          isLoanOfficer: true,
          isRealEstateAgent: false,
        };
      }
      if (location.pathname === "/account-executive") {
        return {
          roles: ["AE"],
          entityName: "Account Executive",
          isLoanOfficer: false,
          isRealEstateAgent: false,
        };
      }
      if (location.pathname === "/real-estate-agent") {
        return {
          roles: ["REA"],
          entityName: "Real Estate Agent",
          isLoanOfficer: false,
          isRealEstateAgent: true,
        };
      }
      // Default to Contract Processors
      return {
        roles: ["CP"],
        entityName: "Contract Processors",
        isLoanOfficer: false,
        isRealEstateAgent: false,
      };
    }, [location.pathname]);


  console.log('roles', roles)

  const {
    contractProcessorRequests,
    isLoadingMore,
    contractProcessorRequestsLoading,
    sendFriendRequestLoading,
    toggleLoading,
  } = useSelector((state) => state.contractProcessor);

  const users = contractProcessorRequests?.data?.users || [];
  const pagination = contractProcessorRequests?.data?.pagination || {
    currentPage: 1,
    totalPage: 1,
    totalRecords: 0,
  };
  const { currentPage, totalPage } = pagination;

  // Helper function to build API parameters
  const buildApiParams = (
    page = 1,
    search = searchTerm,
    state = selectedState
  ) => ({
    page,
    search: search || undefined,
    per_page: 20,
    roles: roles,
    state: state || undefined,
  });

  // Initial fetch when component becomes active
  useEffect(() => {
    if (isActive && !initialLoadDone.current) {
      setInitialLoading(true);
      dispatch(fetchContractProcessorRequests(buildApiParams())).finally(() => {
        setInitialLoading(false);
        initialLoadDone.current = true;
      });
    }
  }, [isActive, dispatch, roles]);

  // Reset states when tab becomes active
  useEffect(() => {
    if (isActive) {
      setSearchTerm("");
      setSelectedState("");
      setHasSearched(false);
    }
  }, [isActive]);

  // Effect for search trigger and state filter
  useEffect(() => {
    if (
      isActive &&
      initialLoadDone.current &&
      (hasSearched || debouncedSearchTerm !== "" || selectedState)
    ) {
      setIsSearching(true);

      const params = buildApiParams(1, debouncedSearchTerm, selectedState);

      dispatch(fetchContractProcessorRequests(params)).finally(() => {
        setIsSearching(false);
      });

      if (!hasSearched) {
        setHasSearched(true);
      }
    }
  }, [
    debouncedSearchTerm,
    selectedState,
    dispatch,
    hasSearched,
    isActive,
    roles,
  ]);

  // Clear requesting user ID when request is completed
  useEffect(() => {
    if (!sendFriendRequestLoading && requestingUserId) {
      setRequestingUserId(null);
    }
  }, [sendFriendRequestLoading, requestingUserId]);

  // Handle unblock completion and refetch data
  useEffect(() => {
    if (!toggleLoading && unblockingUserId) {
      // Refetch data after successful unblock
      dispatch(fetchContractProcessorRequests(buildApiParams()));
      setUnblockingUserId(null);
    }
  }, [
    toggleLoading,
    unblockingUserId,
    dispatch,
    searchTerm,
    selectedState,
    roles,
  ]);

  // Load more data function
  const loadMoreData = useCallback(() => {
    // Don't load more if already loading or no more pages
    if (
      isLoadingMore ||
      currentPage >= totalPage ||
      contractProcessorRequestsLoading
    ) {
      return;
    }

    const params = buildApiParams(currentPage + 1, searchTerm, selectedState);
    dispatch(fetchContractProcessorRequests(params));
  }, [
    isLoadingMore,
    currentPage,
    totalPage,
    contractProcessorRequestsLoading,
    dispatch,
    searchTerm,
    selectedState,
    roles,
  ]);

  // Handle infinite scroll
  const handleScroll = useCallback(
    (e) => {
      if (!containerRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = e.target;
      // Load more when scrolled within 50px of the bottom
      if (scrollHeight - scrollTop - clientHeight < 50) {
        loadMoreData();
      }
    },
    [loadMoreData]
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (!hasSearched) {
      setHasSearched(true);
    }
  };

  const handleStateChange = (value) => {
    setSelectedState(value || "");
    if (!hasSearched) {
      setHasSearched(true);
    }
  };

  const handleSendRequest = (userId, e) => {
    e.stopPropagation();
    setRequestingUserId(userId);
    dispatch(
      sendFriendRequestAction({
        receiver_id: userId,
        sender_page: roles[0],
        role: userLoginRole?.name,
      })
    );
  };

  const onClickSendMessage = () => {
    navigate("/community/chat");
  };

  const handleUnblock = (user, e) => {
    e.stopPropagation();
    setUnblockingUserId(user.id);
    dispatch(
      toggleBlockUnblockContractProcessorAction({
        id: user.friend_status.friend_request_id,
        status: "unblock",
      })
    );
  };


  // Calculate rating counts for progress bars
  const getRatingCounts = () => {
    const total = drawerDetail?.rating_summary?.total_ratings || 0;
    if (total === 0) return [0, 0, 0, 0, 0];

    return [
      ((drawerDetail?.rating_summary?.five_star_count || 0) / total) * 100,
      ((drawerDetail?.rating_summary?.four_star_count || 0) / total) * 100,
      ((drawerDetail?.rating_summary?.three_star_count || 0) / total) * 100,
      ((drawerDetail?.rating_summary?.two_star_count || 0) / total) * 100,
      ((drawerDetail?.rating_summary?.one_star_count || 0) / total) * 100,
    ];
  };

  const ratingCounts = getRatingCounts();
  const actualCounts = [
    drawerDetail?.rating_summary?.five_star_count || 0,
    drawerDetail?.rating_summary?.four_star_count || 0,
    drawerDetail?.rating_summary?.three_star_count || 0,
    drawerDetail?.rating_summary?.two_star_count || 0,
    drawerDetail?.rating_summary?.one_star_count || 0,
  ];


  const onClose = () => {
    setOpen(false);
    setDrawerDetail(null);
  };

  // Handle card click with block status check
  const handleCardClick = (user) => {
    // Don't navigate if user is blocked

    console.log('On Click User', user)
    setDrawerDetail(user);
    setOpen(true);

    if (user.friend_status?.status === "block") {
      return;
    }
    // Add navigation logic here if needed
  };

  const getUserProfileImage = (user) => {
    if (user?.profile_photo_path) {
      return `${API_BASE_URL}/${user.profile_photo_path}`;
    }
    return null;
  };

  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  const renderActionButton = (user) => {
    const { friend_status } = user;

    // If request is already sent, show status
    if (friend_status?.is_friend) {
      return (
        <div className="flex gap-1 items-center font-semibold text-sm">
          Connected! <i className="icon-verification text-green-500 text-xl" />
        </div>
      );
    }

    // If user is blocked, show unblock button
    if (friend_status?.status === "block") {
      return (
        <Button
          className="bg-green-500 shadow-none text-white"
          block
          variant="filled"
          onClick={(e) => handleUnblock(user, e)}
          loading={toggleLoading && unblockingUserId === user.id}
        >
          Unblock
        </Button>
      );
    }

    // If request is already sent, show status
    if (friend_status?.is_sent_by_me) {
      return (
        <div className="flex gap-1 items-center font-semibold text-sm">
          Request Sent!{" "}
          <i className="icon-verification text-green-500 text-xl" />
        </div>
      );
    }

    // Default send request button
    return (
      <Button
        className="bg-primaryOpacity text-primary border-primary font-semibold text-sm"
        block
        variant="filled"
        onClick={(e) => handleSendRequest(user.id, e)}
        loading={sendFriendRequestLoading && requestingUserId === user.id}
      >
        Send Request
      </Button>
    );
  };

  // Show loading state - following GuidelinesMatrices pattern
  const showLoading =
    (contractProcessorRequestsLoading && !isLoadingMore) || isSearching;



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


      <Drawer
        title={roles[0] === "CP" ? "Contract Processor" : roles[0] === "AE" ? "Account Executive" : roles[0] === "REA" ? "Real Estate Agent" : roles[0] === "LO" ? "Loan Officer" : ""}
        closable={{ 'aria-label': 'Close Button' }}
        onClose={onClose}
        open={open}
      >

        <div className="flex justify-center">
          {drawerDetail?.profile_photo_path ? (
            <img
              src={`${IMAGE_BASE_URL}/${drawerDetail.profile_photo_path}`}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <Avatar
              style={{
                backgroundColor: "#fde3cf",
                color: "#f56a00",
              }}
              className="w-24 h-24 object-cover rounded-full !text-5xl"
            >
              {drawerDetail?.name?.[0]}
            </Avatar>
          )}
        </div>

        <div className="mt-4 flex flex-col">
          {
            drawerDetail?.name?.length > 0 &&
            <Text className="text-white text-2xl font-semibold text-center">
              {drawerDetail?.name || ""}
            </Text>
          }
          {
            drawerDetail?.email?.length > 0 &&
            <Text className="text-lg mt-3" >
              {/* Use company name if available or fallback to NMLS number */}
              <div className="flex items-center">
                <i className="icon-mail text-primary text-xl" />
                <div className="text-base ml-2">{drawerDetail?.email || ""}</div>
              </div>
            </Text>
          }
          {
            drawerDetail?.phone_number?.length > 0 &&
            <Text className="text-md mt-2">
              <div className="flex items-center">
                <i className="icon-phone text-primary text-xl" />
                <div className="text-base ml-2">{drawerDetail?.phone_number || ""}</div>
              </div>
            </Text>
          }
          {/* Hide location and experience for Loan Officer role */}
          {roles[0] === "CP" && drawerDetail?.user_detail?.state?.length > 0 && (
            <div className="flex gap-3 mt-1">
              <div className="flex items-center">
                <i className="icon-location text-primary text-xl" />
                <div className="text-base ml-2">
                  {truncateText(
                    drawerDetail?.user_detail?.state,
                    150
                  )}
                </div>
              </div>
            </div>
          )}

          {!isLoanOfficer &&
            drawerDetail?.user_detail?.experience?.length > 0 &&
            <div className="flex items-center mt-1">
              <i className="icon-experience text-primary text-xl" />
              <div className="text-base ml-2">
                {drawerDetail?.user_detail?.experience} Years
              </div>
            </div>
          }

          {!isLoanOfficer && drawerDetail?.user_detail?.service_name?.length > 0 && (
            <div className="flex gap-3 mt-1 pl-2">
              <div className="flex items-center max-w-full">
                <div className="text-base break-all max-w-full flex items-center">
                  <BankOutlined className="text-primary text-xl" />
                  <span className="break-all ml-2">
                    {drawerDetail?.user_detail?.service_name}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Hide description for Loan Officer role */}
          {!isLoanOfficer && drawerDetail?.user_detail?.description?.length > 0 && (
            <Text
              type="secondary"
              className="text-sm flex text-left mt-4 text-justify leading-relaxed px-3"
              style={{
                lineHeight: '1.6',
                textAlign: 'justify',
                textJustify: 'inter-word'
              }}
            >
              {truncateText(drawerDetail?.user_detail?.description, 1100)}
            </Text>
          )}
        </div>

        {
          drawerDetail?.rating_summary &&
          <>
            <div className="">
              <hr className="border-darkGray my-6" />
            </div>

            <div className="mt-4 mb-3">
              <Text className="text-white font-bold">Ratings </Text>
              <Tag className="bg-liteGray rounded-full text-gray-700 border-0 ml-1">
                <i className="icon-star text-yellow-600 before:!m-0" />{" "}
                {drawerDetail?.rating_summary?.average_rating
                  ? (Math.floor(drawerDetail?.rating_summary.average_rating * 10) / 10).toFixed(1)
                  : "0.0"}{" "}
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
          </>
        }

      </Drawer>
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
          {roles[0] === "CP" && (

            <Col xs={24} md={12} lg={6}>
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
            </Col>
          )}
        </Row>
      </div>

      {/* Scrollable Cards Section */}
      <div
        ref={containerRef}
        className="flex-grow overflow-y-auto overflow-x-hidden"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        {showLoading ? (
          <div className="flex justify-center items-center h-full">
            <Spin size="large" />
          </div>
        ) : users.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-6 gap-4 pb-3 auto-rows-fr">
            {users.map((user, index) => (
              <div
                key={user.id}
                onClick={() => handleCardClick(user)}
                className="cursor-pointer"
              >
                <div className="bg-liteGray px-2 py-3 xl:px-3 xl:py-4 2xl:px-4 2xl:py-6 rounded-2xl h-full flex flex-col justify-between">
                  <div>
                    <div className="flex justify-center items-center flex-col">
                      {user?.profile_photo_path ? (
                        <Avatar
                          size={100}
                          src={getUserProfileImage(user)}
                          className="bg-gray"
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
                      <SmartEllipsisText className="text-white font-bold mt-3">
                        {user.name}
                      </SmartEllipsisText>
                      <SmartEllipsisText className="text-sm text-center block text-grayText mt-2">
                        {user.email}
                      </SmartEllipsisText>
                    </div>

                    {!isLoanOfficer && (
                      user?.user_detail?.service_name?.length > 0 ?
                        <div className="flex justify-start gap-3 mt-2">
                          <div className="flex items-center min-w-0">
                            <div className="flex items-center text-base min-w-0 pl-1">
                              <BankOutlined className="text-primary text-xl mr-2" />
                              <SmartEllipsisText className=" text-sm mt-1 text-center block pb-[2px]">
                                {user?.user_detail?.service_name}
                              </SmartEllipsisText>
                            </div>
                          </div>
                        </div>
                        : null
                    )}

                    {roles[0] === "CP" && (
                      user?.user_detail?.state ?
                        <div className="flex justify-start">
                          <div className="flex items-center">
                            <i className="icon-location text-primary text-xl" />
                            <div className="text-sm">
                              {truncateText(user?.user_detail?.state, 20)}{" "}
                            </div>
                          </div>
                        </div>
                        : null
                    )}

                    {
                      console.log('user?.user_detail', user?.user_detail)
                    }
                    {/* Conditionally render location and experience only if NOT loan officer */}

                    {!isLoanOfficer && user?.user_detail?.experience !== null && (
                      <div className="flex justify-start gap-3">
                        <div className="flex items-center">
                          <i className="icon-experience text-primary text-xl" />
                          <div className="text-sm">
                            {truncateText(user?.user_detail?.experience, 3)}{" "}
                            Years
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-center items-center mt-3">
                    {userLoginRole?.name === "SA" ? (
                      <Button
                        className="bg-primaryOpacity text-primary border-primary font-semibold text-sm"
                        block
                        variant="filled"
                        onClick={onClickSendMessage}
                      >
                        Send Message
                      </Button>
                    ) : (
                      renderActionButton(user)
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center h-[36vh]">
            <Empty
              description={
                <span className="text-grayText">No {entityName} Found</span>
              }
            />
          </div>
        )}

        {/* Loading indicator for infinite scroll */}
        {isLoadingMore && (
          <div className="flex justify-center my-4">
            <Spin />
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractProcessorsTab;
