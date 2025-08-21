import React, { useState, useEffect, useRef } from "react";
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
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchFavoritesList, toggleLikeStatusAction } from "../../services/Store/ContractProcessor/actions";

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

const AccountExecutiveFavouite = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  const scrollRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [toggleLikeUserId, setToggleLikeUserId] = useState(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const initialLoadDone = useRef(false);

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

  // Initial data load
  useEffect(() => {
    if (!initialLoadDone.current) {
      dispatch(fetchFavoritesList({
        page: 1,
        per_page: 20,
        friends_only: 1,
        liked_only: 1, // Parameter for favorites
        roles:["AE"] 
      }));
      initialLoadDone.current = true;
    }
  }, [dispatch]);

  // Effect for search
  useEffect(() => {
    if (hasSearched || debouncedSearchTerm !== "") {
      setIsSearching(true);
      dispatch(fetchFavoritesList({
        page: 1,
        per_page: 20,
        search: debouncedSearchTerm || undefined,
        friends_only: 1,
        liked_only: 1,
        roles:["AE"] 
      })).then(() => {
        setIsSearching(false);
      });

      if (!hasSearched) {
        setHasSearched(true);
      }
    }
  }, [debouncedSearchTerm, dispatch, hasSearched]);

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
    dispatch(fetchFavoritesList({
      page: currentPage + 1,
      search: searchTerm || undefined,
      per_page: 20,
      friends_only: 1,
      liked_only: 1,
      roles:["AE"] 
    }));
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
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Show loading state
  const showLoading = favoritesListLoading || isSearching;

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
                  Account Executives
                </Text>
                <div className="h-2 rounded-full w-2 bg-grayText"> </div>
                <div className="bg-primaryOpacity px-3 rounded-lg">{totalRecords || 0}</div>
              </div>
              {/* Fixed Header Section */}
              <div className="flex-none pb-7 mt-8">
                <Row gutter={[10, 10]}>
                  <Col xs={24} md={8} lg={10}>
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
                  {/* <Col xs={16} md={3} lg={4} className="md:pl-2">
                    <Select
                      size="large"
                      placeholder={
                        <div className="text-white ml-2 md:ml-3"> State</div>
                      }
                      className="bg-liteGrayV1 rounded-full text-white w-36 md:w-24 filterSelection"
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
                      suffixIcon={<i className="icon-down-arrow text-white " />}
                      options={[
                        { value: true, label: "Active" },
                        { value: false, label: "Inactive" },
                      ]}
                    />
                  </Col> */}
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
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-3">
                    {favorites.map((user) => (
                      <div key={user.id} onClick={() => navigate(`/account-executive/detail/${user.id}`)}>
                        <div className="bg-liteGray px-3 py-5   rounded-2xl">
                          <div className="flex justify-center  flex-col relative">
                            <div className="absolute top-0 right-0 3xl:right-6">
                              <Button
                                type="text"
                                icon={<i className="icon-heart-filled text-red-800 text-xl" />}
                                className="text-white bg-gray"
                                shape="circle"
                                onClick={(e) => handleToggleFavorite(user?.friend_status?.friend_request_id, e)}
                                loading={toggleLikeLoading && toggleLikeUserId === user.id}
                              />
                            </div>
                            <div className="flex  items-center ">
                              <Avatar
                                size={70}
                                src={getUserProfileImage(user)}
                                icon={<UserOutlined />}
                                className="bg-primary"
                              />
                              <div className="ml-3">
                                <Text strong className="text-white font-bold mt-3">
                                  {user.name}
                                </Text>
                                <div>
                                  <Text className="text-grayText text-sm mt-2 text-center">
                                    {user.email}
                                  </Text>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3 mt-3">
                            <div className="flex items-center">
                              <i className="icon-location text-primary text-xl" />
                              <div className="text-sm">{truncateText(user?.user_detail?.state, 10)}</div>
                            </div>
                            <div className="flex items-center">
                              <i className="icon-calendar text-primary text-xl" />
                              <div className="text-sm">{truncateText(user?.user_detail?.experience, 2)} Years</div>
                            </div>
                          </div>
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

export default AccountExecutiveFavouite;