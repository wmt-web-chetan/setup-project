import React, { useEffect, useRef, useState, useCallback } from "react";
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
  fetchContractProcessorRequests,
  sendFriendRequestAction,
  toggleBlockUnblockContractProcessorAction
} from "../../../services/Store/ContractProcessor/actions";
import { getStorage } from "../../../utils/commonfunction";

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

const ContractProcessorsTab = ({ containerHeight, loading }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const scrollRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false); // Track if a search is in progress
  const [requestingUserId, setRequestingUserId] = useState(null);
  const [unblockingUserId, setUnblockingUserId] = useState(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  const userLoginRole = getStorage("userLoginRole", true);

  const { 
    contractProcessorRequests,
    isLoadingMore,
    contractProcessorRequestsLoading,
    sendFriendRequestLoading,
    sendFriendRequest,
    toggleLoading
  } = useSelector((state) => state.contractProcessor);
  
  const users = contractProcessorRequests?.data?.users || [];
  const pagination = contractProcessorRequests?.data?.pagination || {};
  const { currentPage, totalPage } = pagination;
  
  // Effect for search trigger
  useEffect(() => {
    if (hasSearched || debouncedSearchTerm !== "") {
      setIsSearching(true); // Set searching flag
      dispatch(fetchContractProcessorRequests({ 
        page: 1,
        search: debouncedSearchTerm || undefined,
        per_page: 20,
        roles:["AE"] 
      })).then(() => {
        setIsSearching(false); // Clear searching flag when done
      });
      
      if (!hasSearched) {
        setHasSearched(true);
      }
    }
  }, [debouncedSearchTerm, dispatch, hasSearched]);
  
  useEffect(() => {
    if (!sendFriendRequestLoading && requestingUserId) {
      setRequestingUserId(null);
    }
  }, [sendFriendRequestLoading, requestingUserId]);

  useEffect(() => {
    if (!toggleLoading && unblockingUserId) {
      // Refetch data after successful unblock
      dispatch(fetchContractProcessorRequests({ 
        page: 1,
        search: searchTerm || undefined,
        per_page: 20,
        roles:["AE"] 
      }));
      setUnblockingUserId(null);
    }
  }, [toggleLoading, unblockingUserId, dispatch, searchTerm]);
  
  const handleScroll = (e) => {
    if (!scrollRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      loadMoreData();
    }
  };
  
  const loadMoreData = () => {
    if (isLoadingMore || currentPage >= totalPage) return;
    
    dispatch(fetchContractProcessorRequests({ 
      page: currentPage + 1,
      search: searchTerm || undefined,
      per_page: 20,
      roles:["AE"] 
    }));
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleSendRequest = (userId, e) => {
    e.stopPropagation();
    setRequestingUserId(userId);
    dispatch(sendFriendRequestAction({ receiver_id: userId, role: userLoginRole?.name }));
  };

  const handleUnblock = (user, e) => {
    e.stopPropagation();
    setUnblockingUserId(user.id);
    dispatch(toggleBlockUnblockContractProcessorAction({
      id: user.friend_status.friend_request_id,
      status: "unblock"
    }));
  };

  // Handle card click with block status check
  const handleCardClick = (user) => {
    // Don't navigate if user is blocked
    if (user.friend_status?.status === "block") {
      return;
    }
    // navigate(`/contract-processor/detail/${user.id}`);
  };
  
  const getUserProfileImage = (user) => {
    if (user?.profile_photo_path) {
      return `${API_BASE_URL}/${user.profile_photo_path}`;
    }
    return null;
  };

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const renderActionButton = (user) => {
    const { friend_status } = user;
    
    // If they are already friends, don't show any button
    if (friend_status?.is_friend) {
      return null;
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
  
  // Show loading state for both initial loading and search in progress
  const showLoading = contractProcessorRequestsLoading || isSearching;
  
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
        ) : users.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-3 auto-rows-fr">
            {users.map((user, index) => (
              <div 
                key={user.id} 
                onClick={() => handleCardClick(user)}
                // className={user.friend_status?.status === "block" ? "cursor-not-allowed" : "cursor-pointer"}
              >
                <div className="bg-liteGray px-3 py-5 rounded-2xl h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center">
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

                    <div className="flex gap-3 mt-3">
                      <div className="flex items-center">
                        <i className="icon-location text-primary text-xl" />
                        <div className="text-sm">{user?.user_detail?.state || 'N/A'}</div>
                      </div>
                      <div className="flex items-center">
                        <i className="icon-calendar text-primary text-xl" />
                        <div className="text-sm">{user?.user_detail?.experience || '0'} Years</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center items-center mt-3">
                    {renderActionButton(user)}
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
                  No contract processors found
                </span>
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