import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
import { SearchOutlined, UserOutlined } from "@ant-design/icons";
import { 
  fetchContractProcessorRequestsForMyConnection,
  toggleLikeStatusAction
} from "../../../services/Store/ContractProcessor/actions";

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

const MyConnectionTab = ({ containerHeight }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const scrollRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [toggleLikeUserId, setToggleLikeUserId] = useState(null); // Track which user's like is being toggled
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
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

  
  // Effect for search - only triggered when search term changes
  useEffect(() => {
    if (hasSearched || debouncedSearchTerm !== "") {
      setIsSearching(true); // Set searching flag
      dispatch(fetchContractProcessorRequestsForMyConnection({ 
        page: 1,
        search: debouncedSearchTerm || undefined,
        per_page: 20,
        roles:["AE"] ,
        friends_only: 1  // Always include this parameter
      })).then(() => {
        setIsSearching(false); // Clear searching flag when done
      });
      
      // Set hasSearched to true after the first search
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
    dispatch(fetchContractProcessorRequestsForMyConnection({ 
      page: currentPage + 1,
      search: searchTerm || undefined,
      per_page: 20,
      roles:["AE"] ,
      friends_only: 1  // Always include this parameter
    }));
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
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

  return (
    <div className="flex flex-col h-full px-4">
      {/* Fixed Header Section */}
      <div className="flex-none pb-5">
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
          <Col xs={16} md={3} lg={4} className="md:pl-2">
            {/* <Select
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
            /> */}
          </Col>
          <Col xs={8} md={13} lg={10} className="flex justify-end">
            <Button
              type="default"
              size="large"
              className="bg-gray rounded-full text-white md:px-5 py-2"
              onClick={() => navigate("/account-executive/favorites")}
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4  gap-4 pb-3">
            {connections.map((user, index) => (
              <div key={user.id} onClick={() => navigate(`/account-executive/detail/${user.id}`)}>
                <div className="bg-liteGray px-3 py-5   rounded-2xl">
                  <div className="flex justify-center  flex-col relative">
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
                  No connections found
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