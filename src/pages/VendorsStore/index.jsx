import React, { useEffect, useState, useRef, useCallback } from "react";
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
  Tag,
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
  LoadingOutlined,
} from "@ant-design/icons";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ShadowBoxContainer from "../../components/AuthLayout/ShadowBoxContainer";
import {
  favoriteVendorAction,
  fetchVendors,
  fetchVendorsList,
  unfavoriteVendorAction,
} from "../../services/Store/VendorAdmin/action";

const { Text, Title } = Typography;

const VendorsStore = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const params = useParams();

  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");

  // Search and filtering states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState(null);
  const [filteredVendors, setFilteredVendors] = useState([]);

  // Category state - ADD THIS
  const [categoryInfo, setCategoryInfo] = useState(null);

  // Infinite scrolling states
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreContent, setHasMoreContent] = useState(true);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPage: 1,
    totalRecords: 0,
    perPage: 16,
  });

  // Refs
  const contentRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Get vendors data from Redux store
  const {
    vendorsList,
    vendorsListLoading,
    vendorsListError,
    favoriteVendorLoading,
    unfavoriteVendorLoading,
  } = useSelector((state) => state.vendorStoreCategories);

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

  // Debounced search function
  const debouncedSearch = useCallback(
    (searchValue) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        setSearchTerm(searchValue);
        // Reset pagination and fetch fresh data when searching
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
        setHasMoreContent(true);
        fetchVendorsList(1, false, searchValue, filterStatus);
      }, 500);
    },
    [filterStatus]
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    debouncedSearch(value);
  };

  // Handle filter change
  const handleFilterChange = (value) => {
    setFilterStatus(value);
    // Reset pagination and fetch fresh data when filtering
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setHasMoreContent(true);
    fetchVendorsList(1, false, searchTerm, value);
  };

  // Create a fetchVendorsList function that can be reused for initial and additional loads
  const fetchVendorsList = useCallback(
    (
      page = 1,
      shouldAppend = false,
      search = searchTerm,
      filter = filterStatus
    ) => {
      if (!params?.id) {
        console.error("Category ID is required");
        return;
      }

      const apiParams = {
        page: page,
        per_page: pagination.perPage,
        category_id: params.id,
        ...(search && { search: search }),
        ...(filter !== null && { status: filter }),
      };

    

      if (page === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      dispatch(fetchVendors(apiParams))
        .then((response) => {

          if (response?.payload?.meta?.success === true) {
            const newVendors = response.payload.data?.vendors || [];
            const paginationData = response.payload.data?.pagination;
            const favoriteCountData =
              response.payload.data?.favorites_count || 0;
            // ADD THIS - Extract category information
            const categoryData = response.payload.data?.category;


            // Update favorite count
            setFavoriteCount(favoriteCountData);

            // ADD THIS - Update category information
            if (categoryData) {
              setCategoryInfo(categoryData);
            }

            // Update pagination info if available
            if (paginationData) {
              setPagination({
                currentPage: parseInt(paginationData.currentPage),
                totalPage: paginationData.totalPage,
                totalRecords: paginationData.totalRecords,
                perPage: parseInt(paginationData.perPage),
              });

              // Check if we have more content to load
              setHasMoreContent(
                parseInt(paginationData.currentPage) < paginationData.totalPage
              );
            } else {
              setHasMoreContent(false);
            }

            // If appending, combine the new data with the existing data
            if (shouldAppend && page > 1) {
              setVendors((prevVendors) => {
                // Filter out duplicates based on id
                const existingIds = new Set(
                  prevVendors.map((vendor) => vendor.id)
                );
                const uniqueNewVendors = newVendors.filter(
                  (vendor) => !existingIds.has(vendor.id)
                );
                return [...prevVendors, ...uniqueNewVendors];
              });
            } else {
              // Otherwise, replace the existing data
              setVendors(newVendors);
            }
          } else {
            console.error(
              "Error fetching vendors:",
              response?.payload?.meta?.message
            );
          }

          setLoading(false);
          setIsLoadingMore(false);
        })
        .catch((error) => {
          console.error("Error fetching vendors:", error);
          setLoading(false);
          setIsLoadingMore(false);
        });
    },
    [dispatch, params.id, pagination.perPage, searchTerm, filterStatus]
  );

  // Handle scroll event for infinite scrolling
  const handleScroll = useCallback(() => {
    if (!contentRef.current || isLoadingMore || !hasMoreContent || loading)
      return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;

    // Load more content when 500px from the bottom
    if (scrollHeight - scrollTop - clientHeight < 500) {
      const nextPage = pagination.currentPage + 1;
      fetchVendorsList(nextPage, true);
    }
  }, [
    isLoadingMore,
    hasMoreContent,
    loading,
    pagination.currentPage,
    fetchVendorsList,
  ]);

  // Initial fetch of vendors
  useEffect(() => {
    if (params?.id) {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      setHasMoreContent(true);
      fetchVendorsList(1, false);

      // Reset scroll position
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  }, [params.id]);

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

  // Filter vendors based on search term (client-side filtering for immediate feedback)
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVendors(vendors);
    } else {
      const filtered = vendors.filter((vendor) =>
        vendor.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVendors(filtered);
    }
  }, [vendors, searchTerm]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = (vendorId) => {
    navigate(`/vendor-store/${params?.id}/details/${vendorId}`);
  };

  const handleNavigateToFavourite = () => {
    navigate(`/vendor-store/${params?.id}/favorites`);
  };

  // Handle favorite toggle with proper API integration
  const handleFavoriteToggle = (vendorId, e) => {
    e.stopPropagation();

    // Find the current vendor to check favorite status
    const currentVendor = vendors.find((vendor) => vendor.id === vendorId);
    const isFavorited = currentVendor?.favorite_by_users?.length > 0;

    const payload = { vendor_id: vendorId };

   

    // Optimistically update the UI first for better UX
    setVendors((prevVendors) =>
      prevVendors.map((vendor) => {
        if (vendor.id === vendorId) {
          return {
            ...vendor,
            favorite_by_users: isFavorited ? [] : [{ user_id: "current_user" }],
          };
        }
        return vendor;
      })
    );

    // Update favorite count optimistically
    setFavoriteCount((prev) =>
      isFavorited ? Math.max(0, prev - 1) : prev + 1
    );

    // Call the appropriate API based on current favorite status
    if (isFavorited) {
      // Call unfavorite API
      dispatch(unfavoriteVendorAction(payload))
        .then((result) => {

          if (result?.payload?.meta?.success === true) {

            // Update favorite count from API response if available
            if (result.payload.data?.favorite_count !== undefined) {
              setFavoriteCount(result.payload.data.favorite_count);
            }
          } else {
            console.error(
              "Error unfavoriting vendor:",
              result?.payload?.meta?.message
            );

            // Revert optimistic updates on API failure
            setVendors((prevVendors) =>
              prevVendors.map((vendor) => {
                if (vendor.id === vendorId) {
                  return {
                    ...vendor,
                    favorite_by_users: [{ user_id: "current_user" }], // Revert to favorited
                  };
                }
                return vendor;
              })
            );

            // Revert favorite count
            setFavoriteCount((prev) => prev + 1);
          }
        })
        .catch((error) => {
          console.error("Error unfavoriting vendor:", error);

          // Revert optimistic updates on error
          setVendors((prevVendors) =>
            prevVendors.map((vendor) => {
              if (vendor.id === vendorId) {
                return {
                  ...vendor,
                  favorite_by_users: [{ user_id: "current_user" }], // Revert to favorited
                };
              }
              return vendor;
            })
          );

          // Revert favorite count
          setFavoriteCount((prev) => prev + 1);
        });
    } else {
      // Call favorite API
      dispatch(favoriteVendorAction(payload))
        .then((result) => {

          if (result?.payload?.meta?.success === true) {

            // Update favorite count from API response if available
            if (result.payload.data?.favorite_count !== undefined) {
              setFavoriteCount(result.payload.data.favorite_count);
            }
          } else {
            console.error(
              "Error favoriting vendor:",
              result?.payload?.meta?.message
            );

            // Revert optimistic updates on API failure
            setVendors((prevVendors) =>
              prevVendors.map((vendor) => {
                if (vendor.id === vendorId) {
                  return {
                    ...vendor,
                    favorite_by_users: [], // Revert to unfavorited
                  };
                }
                return vendor;
              })
            );

            // Revert favorite count
            setFavoriteCount((prev) => Math.max(0, prev - 1));
          }
        })
        .catch((error) => {
          console.error("Error favoriting vendor:", error);

          // Revert optimistic updates on error
          setVendors((prevVendors) =>
            prevVendors.map((vendor) => {
              if (vendor.id === vendorId) {
                return {
                  ...vendor,
                  favorite_by_users: [], // Revert to unfavorited
                };
              }
              return vendor;
            })
          );

          // Revert favorite count
          setFavoriteCount((prev) => Math.max(0, prev - 1));
        });
    }
  };

  // Get display vendors (either filtered or all)
  const displayVendors = searchTerm.trim() ? filteredVendors : vendors;
  const totalVendors = pagination.totalRecords;

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
              to="/vendor-store"
              className="text-primary hover:text-primary flex justify-center"
            >
              <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
                Vendor Store
              </Text>
            </Link>
            <Text className="text-grayText mx-2">
              {" "}
              <i className="icon-right-arrow" />{" "}
            </Text>
            <Text className="text-white text-lg sm:text-2xl">
              {/* UPDATED THIS PART - Show category name or fallback */}
              {categoryInfo ? categoryInfo.name : "Category"}
            </Text>
          </Title>
        </div>
      </Col>

      <Col span={24} className="h-full mb-4">
        <ShadowBoxContainer height={containerHeight} shadowVisible={false}>
          <div className="flex flex-col h-full">
            <div className="flex-none">
              <div className="flex mt-0 items-center">
                <div className="text-2xl font-normal">Vendors</div>

                {vendors?.length !== 0 && (
                  <>
                    <span className="mx-3 text-grayText">&#8226;</span>
                    <div className="bg-primaryOpacity rounded-lg px-3 py-1 text-primary">
                      {totalVendors}
                    </div>
                  </>
                )}
                {/* OPTIONAL: Add category name here too */}
                {/* {categoryInfo && (
                  <>
                    <span className="mx-3 text-grayText">&#8226;</span>
                    <div className="text-grayText text-sm">
                      {categoryInfo.name}
                    </div>
                  </>
                )} */}
              </div>

              {/* Fixed Header Section */}
              <div className="flex-none pb-7 mt-6">
                <Row gutter={[10, 10]}>
                  <Col xs={24} md={24} lg={12} xl={12} className="flex gap-2">
                    <Input
                      prefix={<SearchOutlined className="text-grayText mr-2" />}
                      placeholder="Search vendors"
                      className="px-3 py-3 rounded-full"
                      onChange={handleSearchChange}
                      allowClear
                    />
                    {/* <Select
                      size="large"
                      placeholder="Filter"
                      style={{ width: "160px" }}
                      className="bg-[#373737] rounded-full text-white filterSelection"
                      dropdownStyle={{
                        backgroundColor: "#212121",
                        borderRadius: "8px",
                        color: "white",
                      }}
                      value={filterStatus}
                      onChange={handleFilterChange}
                      allowClear
                      filterOption={(input, option) =>
                        (option?.label || "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      suffixIcon={
                        <CaretRightOutlined className="rotate-90 text-white" />
                      }
                      options={[
                        { value: true, label: "Active" },
                        { value: false, label: "Inactive" },
                        { value: "new", label: "New" },
                        { value: "preferred", label: "Preferred" },
                      ]}
                    /> */}
                  </Col>
                  <Col
                    xs={24}
                    md={24}
                    lg={12}
                    xl={12}
                    className="flex items-center justify-end"
                  >
                    <Button
                      className="bg-gray shadow-none rounded-full border border-liteGray font-medium"
                      onClick={handleNavigateToFavourite}
                      size="large"
                    >
                      Favorites{" "}
                      <span className="bg-primaryOpacity text-primary p-3 w-5 h-5 flex justify-center items-center rounded-full">
                        {favoriteCount}
                      </span>
                    </Button>
                  </Col>
                </Row>
              </div>
            </div>

            {/* Scrollable Cards Section */}
            <div className="flex-grow">
              {loading && vendors.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <Spin size="large" />
                </div>
              ) : vendorsListError ? (
                <div className="flex justify-center items-center h-64">
                  <Text className="text-red-500">
                    Error loading vendors. Please try again.
                  </Text>
                </div>
              ) : displayVendors.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <Text className="text-grayText">
                    {searchTerm.trim() ? (
                      `No vendors found for "${searchTerm}"`
                    ) : (
                      <Empty description="No vendors found."></Empty>
                    )}
                  </Text>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-6 mb-6">
                    {displayVendors.map((vendor) => {
                      const isFavorited = vendor.favorite_by_users?.length > 0;
                      const logoUrl = `${import.meta.env.VITE_IMAGE_BASE_URL}/${
                        vendor.logo_path
                      }`;

                      return (
                        <div
                          key={vendor.id}
                          onClick={() => handleChange(vendor.id)}
                          className="cursor-pointer"
                        >
                          <div className="bg-liteGray px-3 py-3 rounded-2xl hover:bg-[#303030] transition-colors">
                            <div className="relative">
                              {logoUrl ? (
                                <img
                                  src={logoUrl}
                                  className="rounded-2xl h-44 w-full object-contain"
                                  alt={vendor.vendor_name}
                                />
                              ) : (
                                ""
                              )}

                              {/* Favorite Button */}
                              <div className="absolute top-2 right-2">
                                <Button
                                  type="text"
                                  icon={
                                    isFavorited ? (
                                      <i className="icon-heart-filled text-red-500 text-lg" />
                                    ) : (
                                      <i className="icon-heart-lineal text-white text-lg" />
                                    )
                                  }
                                  className={`text-white bg-gray hover:bg-[#404040] transition-colors ${
                                    favoriteVendorLoading ||
                                    unfavoriteVendorLoading
                                      ? "cursor-not-allowed "
                                      : "cursor-pointer"
                                  }`}
                                  shape="circle"
                                  size="small"
                                  disabled={
                                    favoriteVendorLoading ||
                                    unfavoriteVendorLoading
                                  }
                                  onClick={(e) =>
                                    handleFavoriteToggle(vendor.id, e)
                                  }
                                  title={
                                    favoriteVendorLoading ||
                                    unfavoriteVendorLoading
                                      ? "Processing..."
                                      : isFavorited
                                      ? "Remove from favorites"
                                      : "Add to favorites"
                                  }
                                />
                              </div>

                              {/* Rating or New Badge */}
                              <div>
                                {vendor?.rating_summery?.[0]?.average_rating ? (
                                  <Tag className="bg-black/40 backdrop-blur-sm rounded-full text-white border-0 absolute top-2 left-2">
                                    <i className="icon-star text-yellow-600 before:!m-0" />
                                    <span className="text-xs">
                                    {Number(vendor?.rating_summery?.[0]?.average_rating).toFixed(1)}

                                    </span>
                                  </Tag>
                                ) : vendor?.is_new ? (
                                  <div className="bg-liteGray pb-[4px] pt-[6px] px-[4px] rounded-full absolute top-[-12px] left-2">
                                    <div className="bg-[#FFAA16] font-bold rounded-full text-gray border-0 px-3 py-1 text-xs">
                                      New
                                    </div>
                                  </div>
                                ) : null}
                              </div>

                              {/* Preferred Partner Badge */}
                              {vendor.is_preferred === 1 && (
                                <div className="bg-liteGray p-[3px] rounded-full absolute bottom-[-15px] right-2">
                                  <div className="bg-[#5A76FF] font-bold rounded-full text-white border-0 px-3 text-xs">
                                    Preferred Partner
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="mt-4">
                              <Text
                                className="font-semibold text-sm line-clamp-1 leading-5  overflow-hidden"
                                title={vendor.vendor_name}
                                style={{
                                  display: "-webkit-box",
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  lineHeight: "1.25rem",
                                  // height: "2.5rem",
                                }}
                              >
                                {vendor.vendor_name}
                              </Text>
                              {/* {vendor.description && (
                                <Text
                                  className="text-xs text-grayText block mt-1 truncate"
                                  title={vendor.description}
                                >
                                  {vendor.description}
                                </Text>
                              )} */}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Loading indicator for additional content */}
                  {isLoadingMore && (
                    <div className="flex justify-center items-center py-4">
                      <Spin />
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

export default VendorsStore;
