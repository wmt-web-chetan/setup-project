import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Typography,
  Row,
  Col,
  Button,
  Avatar,
  Spin,
  Input,
  Card,
  Empty,
  Tag,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  LoadingOutlined,
  UserOutlined,
  CalendarOutlined,
  ShopOutlined,
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { fetchVendorSuggestions } from "../../../../services/Store/VendorAdmin/action";
import ShadowBoxContainer from "../../../../components/AuthLayout/ShadowBoxContainer";

const { Text, Title } = Typography;

// Enhanced Description Component
const ExpandableDescription = ({
  description,
  maxLength = 150,
  isExpanded,
  onToggle,
}) => {
  const [showToggle, setShowToggle] = useState(false);

  useEffect(() => {
    setShowToggle(description && description.length > maxLength);
  }, [description, maxLength]);

  if (!description) {
    return (
      <Text className="text-grayText italic">No description provided</Text>
    );
  }

  const truncatedDescription = description.slice(0, maxLength);
  const displayText = isExpanded ? description : truncatedDescription;

  return (
    <div className="space-y-2">
      <Text className="text-white leading-relaxed block">
        {displayText}
        {!isExpanded && showToggle && "..."}
      </Text>

      {showToggle && (
        <Button
          type="text"
          size="small"
          className="!p-0 !h-auto text-primary hover:text-primary-light text-xs"
          onClick={onToggle}
          icon={
            isExpanded ? (
              <UpOutlined className="text-xs" />
            ) : (
              <DownOutlined className="text-xs" />
            )
          }
        >
          {isExpanded ? "Show less" : "Show more"}
        </Button>
      )}
    </div>
  );
};

// Enhanced Suggestion Card Component
const SuggestionCard = ({
  suggestion,
  formatDate,
  getUserInitials,
  isExpanded,
  onToggle,
}) => {
  return (
    <Card
      className="bg-liteGray border-gray hover:bg-[#303030] transition-all duration-300 cursor-pointer h-full"
      bodyStyle={{ padding: "20px", height: "100%" }}
      hoverable
    >
      <div className="flex flex-col gap-4 h-full">
        {/* Vendor Name */}
        <div className="flex items-center gap-3">
          <div className="bg-primaryOpacity rounded-full p-2 flex-shrink-0">
            <ShopOutlined className="text-primary text-lg" />
          </div>
          <div className="flex-grow min-w-0">
            <Tooltip title={suggestion.vendor_name} placement="top">
              <Text className="text-white font-semibold text-lg block truncate">
                {suggestion.vendor_name}
              </Text>
            </Tooltip>
            <Tag className="mt-1 bg-gray text-white border-0 px-2 py-1 text-xs">
              Suggestion
            </Tag>
          </div>
        </div>

        {/* Description - Enhanced Section */}
        <div className="flex-grow">
          {/* <Text className="text-grayText text-sm mb-2 block font-medium">
            Description:
          </Text> */}
          <ExpandableDescription
            description={suggestion.description}
            maxLength={120}
            isExpanded={isExpanded}
            onToggle={onToggle}
          />
        </div>

        {/* User Info and Date */}
        <div className="flex items-center justify-between pt-3 border-t border-gray mt-auto">
          <div className="flex items-center gap-2 flex-grow min-w-0">
            {suggestion.user?.profile_photo_path ? (
              <Avatar
                size={32}
                src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                  suggestion.user.profile_photo_path
                }`}
                className="flex-shrink-0"
              />
            ) : (
              <Avatar
                size={32}
                className="bg-gray text-white flex-shrink-0"
                icon={<UserOutlined />}
              >
                {getUserInitials(suggestion.user?.name)}
              </Avatar>
            )}
            <div className="min-w-0 flex-grow">
              <Tooltip
                title={suggestion.user?.name || "Unknown User"}
                placement="top"
              >
                <Text className="text-white text-sm block truncate">
                  {suggestion.user?.name || "Unknown User"}
                </Text>
              </Tooltip>
              {suggestion.user?.email && (
                <Tooltip title={suggestion.user.email} placement="bottom">
                  <Text className="text-grayText text-xs truncate block">
                    {suggestion.user.email}
                  </Text>
                </Tooltip>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-grayText text-xs flex-shrink-0 ml-2">
            <CalendarOutlined />
            <Text className="text-grayText text-xs">
              {formatDate(suggestion.created_at)}
            </Text>
          </div>
        </div>
      </div>
    </Card>
  );
};

const ViewSuggestions = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminMode = location.pathname.includes("/admin/");

  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");

  // Search and filtering states
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  // Infinite scrolling states
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreContent, setHasMoreContent] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPage: 1,
    totalRecords: 0,
    perPage: 10,
  });

  // Expansion state for rows
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [screenSize, setScreenSize] = useState("lg"); // default to lg

  // Refs
  const contentRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Get vendor suggestions data from Redux store
  const {
    vendorSuggestions,
    vendorSuggestionsLoading,
    vendorSuggestionsError,
  } = useSelector((state) => state.vendorStoreCategories);

  // Function to determine current screen size and columns
  const updateScreenSize = useCallback(() => {
    const width = window.innerWidth;
    if (width < 768) {
      setScreenSize("xs"); // 1 column
    } else if (width < 1024) {
      setScreenSize("md"); // 2 columns
    } else {
      setScreenSize("lg"); // 3 columns
    }
  }, []);

  // Function to get number of columns based on screen size
  const getColumnsCount = () => {
    switch (screenSize) {
      case "xs":
        return 1;
      case "md":
        return 2;
      case "lg":
        return 3;
      default:
        return 3;
    }
  };

  // Function to calculate row number for a given index
  const getRowNumber = (index) => {
    const columns = getColumnsCount();
    return Math.floor(index / columns);
  };

  // Function to handle row expansion toggle
  const handleRowToggle = (index) => {
    const rowNumber = getRowNumber(index);
    const newExpandedRows = new Set(expandedRows);

    if (newExpandedRows.has(rowNumber)) {
      newExpandedRows.delete(rowNumber);
    } else {
      newExpandedRows.add(rowNumber);
    }

    setExpandedRows(newExpandedRows);
  };

  // Set container height based on screen size
  useEffect(() => {
    const handleResize = () => {
      setContainerHeight(
        window.innerWidth < 768 ? "calc(100vh - 212px)" : "calc(100vh - 241px)"
      );
      updateScreenSize();
    };

    // Set initial height and screen size
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, [updateScreenSize]);

  // Clear expanded rows when suggestions change (search, new data, etc.)
  useEffect(() => {
    setExpandedRows(new Set());
  }, [suggestions, searchTerm]);

  // Debounced search function
  const debouncedSearch = useCallback((searchValue) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(searchValue);
      // Reset pagination and fetch fresh data when searching
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      setHasMoreContent(true);
      fetchSuggestions(1, false, searchValue);
    }, 500);
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    debouncedSearch(value);
  };

  // Create a fetchSuggestions function that can be reused for initial and additional loads
  const fetchSuggestions = useCallback(
    (page = 1, shouldAppend = false, search = searchTerm) => {
      const params = {
        page: page,
        per_page: pagination.perPage,
        ...(search && { search: search }),
      };

      // console.log(`Fetching vendor suggestions, page ${page}`, params);

      if (page === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      dispatch(fetchVendorSuggestions(params))
        .then((response) => {
          // console.log("Vendor Suggestions API response:", response);

          if (response?.payload?.meta?.success === true) {
            const newSuggestions =
              response.payload.data?.vendor_suggestions || [];
            const paginationData = response.payload.data?.pagination;

            // console.log(`Received ${newSuggestions.length} suggestions`);

            // Update pagination info if available
            if (paginationData) {
              setPagination({
                currentPage: paginationData.currentPage,
                totalPage: paginationData.totalPage,
                totalRecords: paginationData.totalRecords,
                perPage: paginationData.perPage,
              });

              // Check if we have more content to load
              setHasMoreContent(
                paginationData.currentPage < paginationData.totalPage
              );
            } else {
              setHasMoreContent(false);
            }

            // If appending, combine the new data with the existing data
            if (shouldAppend && page > 1) {
              setSuggestions((prevSuggestions) => {
                // Filter out duplicates based on id
                const existingIds = new Set(
                  prevSuggestions.map((suggestion) => suggestion.id)
                );
                const uniqueNewSuggestions = newSuggestions.filter(
                  (suggestion) => !existingIds.has(suggestion.id)
                );
                return [...prevSuggestions, ...uniqueNewSuggestions];
              });
            } else {
              // Otherwise, replace the existing data
              setSuggestions(newSuggestions);
            }
          } else {
            console.error(
              "Error fetching vendor suggestions:",
              response?.payload?.meta?.message
            );
          }

          setLoading(false);
          setIsLoadingMore(false);
        })
        .catch((error) => {
          console.error("Error fetching vendor suggestions:", error);
          setLoading(false);
          setIsLoadingMore(false);
        });
    },
    [dispatch, pagination.perPage, searchTerm]
  );
  // Helper functions for dynamic navigation
  const getDashboardLink = () => {
    return isAdminMode ? "/admin" : "/dashboard";
  };

  const getVendorStoreManagementLink = () => {
    return isAdminMode
      ? "/admin/vendor-store-management"
      : "/vendor-store-management";
  };
  // Handle scroll event for infinite scrolling
  const handleScroll = useCallback(() => {
    if (!contentRef.current || isLoadingMore || !hasMoreContent || loading)
      return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;

    // Load more content when 500px from the bottom
    if (scrollHeight - scrollTop - clientHeight < 500) {
      const nextPage = pagination.currentPage + 1;
      // console.log(`Loading more suggestions, page ${nextPage}`);
      fetchSuggestions(nextPage, true);
    }
  }, [
    isLoadingMore,
    hasMoreContent,
    loading,
    pagination.currentPage,
    fetchSuggestions,
  ]);

  // Initial fetch of suggestions
  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setHasMoreContent(true);
    fetchSuggestions(1, false);

    // Reset scroll position
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, []);

  // Add scroll event listener
  useEffect(() => {
    const currentRef = contentRef.current;
    if (currentRef) {
      currentRef.addEventListener("scroll", handleScroll);
      return () => {
        currentRef.removeEventListener("scroll", handleScroll);
      };
    }
  }, [handleScroll]);

  // Filter suggestions based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSuggestions(suggestions);
    } else {
      const filtered = suggestions.filter(
        (suggestion) =>
          suggestion.vendor_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          suggestion.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          suggestion.user?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    }
  }, [suggestions, searchTerm]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Get display suggestions (either filtered or all)
  const displaySuggestions = searchTerm.trim()
    ? filteredSuggestions
    : suggestions;
  const totalSuggestions = pagination.totalRecords;

  // Format date for display
  const formatDate = (dateString) => {
    return moment(dateString).format("MM/DD/YYYY");
  };

  // Get user initials for avatar
  const getUserInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
              to={getDashboardLink()}
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
              to={getVendorStoreManagementLink()}
              className="text-primary hover:text-primary flex justify-center"
            >
              <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
                Vendor Management
              </Text>
            </Link>
            <Text className="text-grayText mx-2">
              {" "}
              <i className="icon-right-arrow" />{" "}
            </Text>
            <Text className="text-white text-lg sm:text-2xl">
              Vendor Suggestions
            </Text>
          </Title>
        </div>
      </Col>

      <Col span={24} className="h-full mb-4">
        <ShadowBoxContainer
          height={containerHeight}
          shadowVisible={false}
          overflow="hidden"
        >
          <div className="flex flex-col h-full">
            <div className="flex-none">
              <div className="flex mt-0 items-center">
                <div className="text-2xl font-normal">Vendor Suggestions</div>
                <span className="mx-3 text-grayText">&#8226;</span>
                <div className="bg-primaryOpacity rounded-lg px-3 py-1 text-primary">
                  {loading && suggestions.length === 0 ? (
                    <Spin size="small" />
                  ) : (
                    totalSuggestions
                  )}
                </div>
              </div>

              {/* Fixed Header Section */}
              <div className="flex-none pb-7 mt-6">
                <Row gutter={[10, 10]}>
                  <Col xs={24} md={24} lg={12} xl={9}>
                    <Input
                      prefix={<SearchOutlined className="text-grayText mr-2" />}
                      placeholder="Search suggestions by vendor name, description, or user"
                      className="px-3 py-3 rounded-full"
                      onChange={handleSearchChange}
                      allowClear
                    />
                  </Col>
                  <Col
                    xs={24}
                    md={24}
                    lg={12}
                    xl={15}
                    className="flex items-center justify-end"
                  >
                    <Button
                      className="py-5 bg-primary text-white shadow-none rounded-full border-0 hover:bg-primary-dark"
                      onClick={() => navigate(getVendorStoreManagementLink())}
                    >
                      Back to Vendor Management
                    </Button>
                  </Col>
                </Row>
              </div>
            </div>

            {/* Scrollable Suggestions Section */}
            <div
              className="flex-grow overflow-y-auto"
              ref={contentRef}
              style={{ height: "calc(100% - 120px)" }}
            >
              {loading && suggestions.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <Spin
                    indicator={
                      <LoadingOutlined style={{ fontSize: 24 }} spin />
                    }
                    size="large"
                  />
                </div>
              ) : vendorSuggestionsError ? (
                <div className="flex justify-center items-center h-64">
                  <Text className="text-red-500">
                    Error loading vendor suggestions. Please try again.
                  </Text>
                </div>
              ) : displaySuggestions.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <Empty
                    description={
                      <Text className="text-grayText">
                        {searchTerm.trim()
                          ? `No suggestions found for "${searchTerm}"`
                          : "No vendor suggestions found."}
                      </Text>
                    }
                  />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {displaySuggestions.map((suggestion, index) => {
                      const rowNumber = getRowNumber(index);
                      const isExpanded = expandedRows.has(rowNumber);

                      return (
                        <SuggestionCard
                          key={suggestion.id}
                          suggestion={suggestion}
                          formatDate={formatDate}
                          getUserInitials={getUserInitials}
                          isExpanded={isExpanded}
                          onToggle={() => handleRowToggle(index)}
                        />
                      );
                    })}
                  </div>

                  {/* Loading indicator for additional content */}
                  {isLoadingMore && (
                    <div className="flex justify-center items-center py-4">
                      <Spin
                        indicator={
                          <LoadingOutlined style={{ fontSize: 20 }} spin />
                        }
                      />
                    </div>
                  )}

                  {/* Bottom padding for better scrolling experience */}
                  <div className="pb-16"></div>
                </>
              )}
            </div>
          </div>
        </ShadowBoxContainer>
      </Col>
    </Row>
  );
};

export default ViewSuggestions;
