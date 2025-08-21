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
  sendFriendRequestAction 
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

const AccountExecutiveTab = ({ containerHeight, loading }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const scrollRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false); // Track if a search is in progress
  const [requestingUserId, setRequestingUserId] = useState(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  const { 
    contractProcessorRequests,
    isLoadingMore,
    contractProcessorRequestsLoading,
    sendFriendRequestLoading,
    sendFriendRequest
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
    dispatch(sendFriendRequestAction({ receiver_id: userId }));
  };
  
  const getUserProfileImage = (user) => {
    if (user?.profile_photo_path) {
      return `${API_BASE_URL}/${user.profile_photo_path}`;
    }
    return null;
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4  gap-4 pb-3">
            {users.map((user, index) => (
              <div key={user.id} onClick={() => navigate(`/account-executive/detail/${user.id}`)}>
                <div className="bg-liteGray px-3 py-5   rounded-2xl">
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

                  <div className="flex gap-3 mt-3">
                    <div className="flex items-center">
                      <i className="icon-location text-primary text-xl" />
                      <div className="text-sm">California</div>
                    </div>
                    <div className="flex items-center">
                      <i className="icon-calendar text-primary text-xl" />
                      <div className="text-sm">3 Years</div>
                    </div>
                  </div>
                  <div className="flex justify-center items-center mt-3">
                    {user.friend_status?.is_sent_by_me ? (
                      <div className="flex gap-1 items-center font-semibold text-sm">
                        Request Sent!{" "}
                        <i className="icon-verification text-green-500 text-xl" />
                      </div>
                    ) : (
                      <Button
                        className="bg-primaryOpacity text-primary border-primary font-semibold text-sm"
                        block
                        variant="filled"
                        onClick={(e) => handleSendRequest(user.id, e)}
                        loading={sendFriendRequestLoading && requestingUserId === user.id}
                      >
                        Send Request
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center h-full">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
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

export default AccountExecutiveTab;