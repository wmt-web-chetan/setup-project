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
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  SearchOutlined,
  UserOutlined,
  CaretRightOutlined,
  BankOutlined
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import {
  fetchFriendRequests,
  respondToFriendRequestAction,
} from "../../../services/Store/ContractProcessor/actions";
import { usaStates } from "../../../helpers/constant";
import { IMAGE_BASE_URL } from "../../../utils/constant";

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

const PendingRequest = ({ isActive }) => {
  const { Text } = Typography;
  const dispatch = useDispatch();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [friendRequests, setFriendRequests] = useState();
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [open, setOpen] = useState(false);
  const [drawerDetail, setDrawerDetail] = useState(null);

  // Determine roles, entity name, and loan officer flag based on current route
  const { roles, entityName, isLoanOfficer, isRealEstateAgent } =
    useMemo(() => {
      if (location.pathname === "/loan-officer") {
        return {
          roles: ["LO"],
          entityName: "loan officer",
          isLoanOfficer: true,
          isRealEstateAgent: false,
        };
      }
      if (location.pathname === "/account-executive") {
        return {
          roles: ["AE"],
          entityName: "account executive",
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
        entityName: "contract processor",
        isLoanOfficer: false,
        isRealEstateAgent: false,
      };
    }, [location.pathname]);

  const loadFriendRequests = useCallback(
    async (page = 1, search = "", state = "", reset = false) => {
      // Prevent concurrent API calls
      if (loading) return;

      setLoading(true);

      const params = {
        page: page,
        per_page: 18,
        search: search || undefined,
        state: state || undefined,
        roles: roles,
      };

      try {
        const res = await dispatch(fetchFriendRequests(params));

        if (res.payload && res.payload.data) {
          const newRequests = res.payload.data.friend_requests || [];
          const pagination = res.payload.data.pagination || {};

          if (reset) {
            setFriendRequests(newRequests);
          } else {
            setFriendRequests((prev) => [...prev, ...newRequests]);
          }

          setCurrentPage(pagination.currentPage || 1);
          setTotalPages(pagination.totalPage || 1);
          setHasMore(
            (pagination.currentPage || 1) < (pagination.totalPage || 1)
          );
        }
      } catch (error) {
        // console.log("Error:", error);
      } finally {
        setLoading(false);
      }
    },
    [dispatch, roles]
  );

  // Call API whenever component becomes active
  useEffect(() => {
    if (isActive) {
      setSearchTerm("");
      setSelectedState("");
      setHasSearched(false);
      setIsSearching(false);
      loadFriendRequests(1, "", "", true);
    }
  }, [isActive, dispatch, roles]);

  // Handle search with debouncing
  useEffect(() => {
    if (!isActive || loading) return;

    if (hasSearched || debouncedSearchTerm !== "") {
      setIsSearching(true);
      setCurrentPage(1);

      const searchPromise = loadFriendRequests(1, debouncedSearchTerm, selectedState, true);
      searchPromise.finally(() => {
        setIsSearching(false);
      });

      // Set hasSearched to true after the first search
      if (!hasSearched) {
        setHasSearched(true);
      }
    }
  }, [debouncedSearchTerm, selectedState, hasSearched, isActive, dispatch, roles]);

  // Handle state filter changes
  useEffect(() => {
    if (!isActive || !hasSearched || loading) return;

    setIsSearching(true);
    setCurrentPage(1);

    const filterPromise = loadFriendRequests(1, searchTerm, selectedState, true);
    filterPromise.finally(() => {
      setIsSearching(false);
    });
  }, [selectedState, isActive, hasSearched, searchTerm, dispatch, roles]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (
      !isActive ||
      window.innerHeight + document.documentElement.scrollTop !==
      document.documentElement.offsetHeight ||
      loading ||
      !hasMore
    ) {
      return;
    }

    const nextPage = currentPage + 1;
    if (nextPage <= totalPages) {
      loadFriendRequests(nextPage, searchTerm, selectedState, false);
    }
  }, [
    currentPage,
    totalPages,
    searchTerm,
    selectedState,
    loading,
    hasMore,
    isActive,
    dispatch,
    roles
  ]);

  useEffect(() => {
    if (isActive) {
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll, isActive]);

  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
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


  const handleStateChange = (value) => {
    setSelectedState(value || "");
    if (!hasSearched) {
      setHasSearched(true);
    }
  };

  const handleCardClick = (user) => {
    setDrawerDetail(user);
    setOpen(true);
  };

  const onClickDecline = (user) => {

    const payload = {
      id: user?.friend_request?.id,
      status: "rejected",
    };

    dispatch(respondToFriendRequestAction(payload))
      .then((res) => {
        // Refresh the friend requests after successful action
        if (isActive) {
          loadFriendRequests(1, searchTerm, selectedState, true);
        }
        // Dispatch custom event to notify parent component
        window.dispatchEvent(new CustomEvent("pendingRequestActionCompleted"));
      })
      .catch((error) => {
        // console.log("Error: ", error);
      });
  };

  const onClickAccept = (user) => {
    const payload = {
      id: user?.friend_request?.id,
      status: "accepted",
    };

    dispatch(respondToFriendRequestAction(payload))
      .then((res) => {
        // Refresh the friend requests after successful action
        if (isActive) {
          loadFriendRequests(1, searchTerm, selectedState, true);
        }
        // Dispatch custom event to notify parent component
        window.dispatchEvent(new CustomEvent("pendingRequestActionCompleted"));
      })
      .catch((error) => {
        // console.log("Error: ", error);
      });
  };

  const getUserProfileImage = (user) => {
    return user.profile_photo_path
      ? `${import.meta.env.VITE_IMAGE_BASE_URL}/${user.profile_photo_path}`
      : null;
  };

  // Show loading state for both initial loading and search in progress
  const showLoading = loading || isSearching;


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
            // size={48}
            >
              {drawerDetail?.name?.[0]}
            </Avatar>
          )}
        </div>

        <div className="mt-4 flex flex-col items-center">
          {
            drawerDetail?.name?.length > 0 &&
            <Text className="text-white text-2xl font-semibold text-center mb-3">
              {drawerDetail?.name || ""}
            </Text>
          }
          {
            drawerDetail?.email?.length > 0 &&
            <Text className="text-lg w-full">
              {/* Use company name if available or fallback to NMLS number */}
              <div className="flex  items-center justify-start">
                <i className="icon-mail text-primary text-xl" />
                <div className="text-base">{drawerDetail?.email || ""}</div>
              </div>
            </Text>
          }
          {
            drawerDetail?.phone_number?.length > 0 &&
            <Text className="text-md  w-full">
              <div className="flex items-center">
                <i className="icon-phone text-primary text-xl" />
                <div className="text-base">{drawerDetail?.phone_number || ""}</div>
              </div>
            </Text>
          }
          {/* Hide location and experience for Loan Officer role */}
          {roles[0] === "CP" && drawerDetail?.user_detail?.state && (
            <div className="flex justify-start gap-3 mt-1 w-full">
              <div className="flex items-center w-full">
                <i className="icon-location text-primary text-xl" />
                <div className="text-base">
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
            <div className="flex items-center w-full ">
              <i className="icon-experience text-primary text-xl" />
              <div className="text-base">
                {drawerDetail?.user_detail?.experience} Years
              </div>
            </div>
          }

          {!isLoanOfficer && drawerDetail?.user_detail?.service_name?.length > 0 && (
            <div className="flex justify-start gap-3 mt-1 w-full">
              <div className="flex items-center">
                <BankOutlined className="text-primary text-xl mr-2 ml-[6px]" />
                <div className="text-base">
                  {truncateText(
                    drawerDetail?.user_detail?.service_name,
                    500
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Hide description for Loan Officer role */}
          {!isLoanOfficer && drawerDetail?.user_detail?.description?.length > 0 && (
            <Text
              type="secondary"
              className="text-sm flex text-left mt-4 text-justify leading-relaxed px-4"
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
            </Col>
          )}
        </Row>
      </div>

      {/* Scrollable Cards Section */}
      {showLoading ? (
        <div className="flex justify-center items-center h-[34vh]">
          <Spin size="large" />
        </div>
      ) : friendRequests?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-6 gap-4 pb-3 auto-rows-fr">
          {friendRequests.map((user) => (
            <div
              key={user.id}
              onClick={() => handleCardClick(user)}
              className="cursor-pointer"
            >
              <div className="bg-liteGray px-2 py-3 xl:px-3 xl:py-4 2xl:px-4 2xl:py-6 rounded-2xl h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-center items-center flex-col">
                    {user.profile_photo_path ? (
                      <Avatar
                        size={100}
                        src={getUserProfileImage(user)}
                        icon={<UserOutlined />}
                        className="bg-gray"
                      />
                    ) : (
                      <Avatar
                        size={100}
                        style={{
                          backgroundColor: "#fde3cf",
                          color: "#f56a00",
                        }}
                        className="object-cover rounded-full !text-5xl pb-1"
                      >
                        {user.name?.[0] || user.name?.[0] || "?"}
                      </Avatar>
                    )}

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
                      <div className="flex justify-start gap-3 ">
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
                      <div className="flex items-center">
                        <i className="icon-experience text-primary text-xl" />
                        <div className="text-sm">
                          {truncateText(user.user_detail?.experience || "0", 3)}{" "}
                          Years
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-center items-center mt-3 gap-3">
                  <Button
                    type="default"
                    size="middle"
                    className="w-[220px] text-white hover:bg-liteGray border-liteGray"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClickDecline(user);
                    }}
                  >
                    Decline
                  </Button>
                  {user?.friend_request?.is_send_by ? null : (
                    <Button
                      type="primary"
                      size="middle"
                      className="w-[220px] shadow-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClickAccept(user);
                      }}
                    >
                      Accept
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex justify-center items-center h-[36vh] w-full">
          <Empty
            description={
              <span className="text-grayText">
                No Pending {entityName} Requests
              </span>
            }
          />
        </div>
      )}
    </div>
  );
};

export default PendingRequest;