import React, { useEffect, useState, useRef, useCallback } from "react";
import { Typography, Row, Col, Input, Select, Button, Tag, Spin } from "antd";
import {
  SearchOutlined,
  CaretRightOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchVendors,
  favoriteVendorAction,
  unfavoriteVendorAction,
} from "../../services/Store/VendorAdmin/action";

const { Text, Title } = Typography;

const VendorFavorites = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const params = useParams();

  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");

  // Search and filtering states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState(null);
  const [filteredVendors, setFilteredVendors] = useState([]);

  // Infinite scrolling states
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreContent, setHasMoreContent] = useState(true);
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
        console.log("Debounced search with filter:", filterStatus); // Debug log
        setSearchTerm(searchValue);
        // Reset pagination and fetch fresh data when searching
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
        setHasMoreContent(true);

        // Call fetchFavoriteVendors directly with the current values
        const apiParams = {
          page: 1,
          per_page: pagination.perPage,
          liked_only: true,
          ...(params?.id && { category_id: params.id }),
          ...(searchValue && { search: searchValue }),
        };

        // Only add type parameter if filter has a valid value
        if (
          filterStatus &&
          filterStatus !== null &&
          filterStatus !== undefined &&
          filterStatus !== ""
        ) {
          apiParams.type = filterStatus;
        }

        console.log("Debounced search API params:", apiParams);

        setLoading(true);
        dispatch(fetchVendors(apiParams))
          .then((response) => {
            if (response?.payload?.meta?.success === true) {
              const newVendors = response.payload.data?.vendors || [];
              const paginationData = response.payload.data?.pagination;

              if (paginationData) {
                setPagination({
                  currentPage: parseInt(paginationData.currentPage),
                  totalPage: paginationData.totalPage,
                  totalRecords: paginationData.totalRecords,
                  perPage: parseInt(paginationData.perPage),
                });

                setHasMoreContent(
                  parseInt(paginationData.currentPage) <
                    paginationData.totalPage
                );
              } else {
                setHasMoreContent(false);
              }

              setVendors(newVendors);
            }
            setLoading(false);
          })
          .catch((error) => {
            console.error("Error in debounced search:", error);
            setLoading(false);
          });
      }, 500);
    },
    [filterStatus, params?.id, pagination.perPage, dispatch]
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    debouncedSearch(value);
  };

  // Handle filter change
  const handleFilterChange = (value) => {
    console.log("Filter changed to:", value); // Debug log

    // When filter is cleared, value becomes undefined, set it to null
    const filterValue = value === undefined ? null : value;
    setFilterStatus(filterValue);

    // Reset pagination and fetch fresh data when filtering
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setHasMoreContent(true);
    fetchFavoriteVendors(1, false, searchTerm, filterValue);
  };

  // Fetch favorite vendors function
  const fetchFavoriteVendors = useCallback(
    (
      page = 1,
      shouldAppend = false,
      search = searchTerm,
      filter = filterStatus
    ) => {
      const apiParams = {
        page: page,
        per_page: pagination.perPage,
        liked_only: true,
        ...(params?.id && { category_id: params.id }),
        ...(search && { search: search }),
      };

      // Only add type parameter if filter has a valid value (not null, undefined, or empty string)
      if (filter && filter !== null && filter !== undefined && filter !== "") {
        apiParams.type = filter;
      }


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
              "Error fetching favorite vendors:",
              response?.payload?.meta?.message
            );
          }

          setLoading(false);
          setIsLoadingMore(false);
        })
        .catch((error) => {
          console.error("Error fetching favorite vendors:", error);
          setLoading(false);
          setIsLoadingMore(false);
        });
    },
    [dispatch, pagination.perPage, searchTerm, filterStatus, params?.id]
  );

  // Handle scroll event for infinite scrolling
  const handleScroll = useCallback(() => {
    if (!contentRef.current || isLoadingMore || !hasMoreContent || loading)
      return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;

    // Load more content when 500px from the bottom
    if (scrollHeight - scrollTop - clientHeight < 500) {
      const nextPage = pagination.currentPage + 1;
      fetchFavoriteVendors(nextPage, true);
    }
  }, [
    isLoadingMore,
    hasMoreContent,
    loading,
    pagination.currentPage,
    fetchFavoriteVendors,
  ]);

  // Initial fetch of favorite vendors
  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setHasMoreContent(true);

    // Initial fetch
    const apiParams = {
      page: 1,
      per_page: 16,
      liked_only: true,
      ...(params?.id && { category_id: params.id }),
    };


    setLoading(true);
    dispatch(fetchVendors(apiParams))
      .then((response) => {
        if (response?.payload?.meta?.success === true) {
          const newVendors = response.payload.data?.vendors || [];
          const paginationData = response.payload.data?.pagination;

          if (paginationData) {
            setPagination({
              currentPage: parseInt(paginationData.currentPage),
              totalPage: paginationData.totalPage,
              totalRecords: paginationData.totalRecords,
              perPage: parseInt(paginationData.perPage),
            });

            setHasMoreContent(
              parseInt(paginationData.currentPage) < paginationData.totalPage
            );
          } else {
            setHasMoreContent(false);
          }

          setVendors(newVendors);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error in initial fetch:", error);
        setLoading(false);
      });

    // Reset scroll position
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [dispatch, params?.id]); // Only depend on dispatch and params.id

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
    // Navigate to vendor details - you may need to adjust the route based on your routing structure
    navigate(`/vendor-store/${params?.id}/details/${vendorId}`);
  };

  // Handle favorite toggle (unfavorite only since this is favorites page)
  const handleFavoriteToggle = (vendorId, e) => {
    e.stopPropagation();

    const payload = { vendor_id: vendorId };


    // Optimistically remove from UI
    setVendors((prevVendors) =>
      prevVendors.filter((vendor) => vendor.id !== vendorId)
    );

    // Update pagination count
    setPagination((prev) => ({
      ...prev,
      totalRecords: Math.max(0, prev.totalRecords - 1),
    }));

    // Call unfavorite API
    dispatch(unfavoriteVendorAction(payload))
      .then((result) => {
        console.log("Unfavorite API response:", result);

        if (result?.payload?.meta?.success === true) {
          console.log("Vendor unfavorited successfully");
        } else {
          console.error(
            "Error unfavoriting vendor:",
            result?.payload?.meta?.message
          );

          // Revert optimistic update on API failure
          fetchFavoriteVendors(1, false);
        }
      })
      .catch((error) => {
        console.error("Error unfavoriting vendor:", error);

        // Revert optimistic update on error
        fetchFavoriteVendors(1, false);
      });
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
            <Text className="text-white text-lg sm:text-2xl">Favorites</Text>
          </Title>
        </div>
      </Col>

      <Col span={24} className="h-full mb-4">
        <div className="w-full">
          <div className="rounded-3xl border overflow-hidden bg-gray border-solid border-liteGray w-full relative">
            {/* Shadow effect at the bottom inside the container */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/50 to-transparent pointer-events-none z-10"></div>

            <div className="flex flex-col h-full px-4 mt-5">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-normal">Vendors</div>

                <span className="mx-2 text-grayText">&#8226;</span>

                <div className="bg-primaryOpacity rounded-lg px-3 py-1 text-primary">
                  {loading && vendors?.length === 0 ? (
                    <Spin size="small" />
                  ) : (
                    totalVendors
                  )}
                </div>
              </div>

              {/* Fixed Header Section */}
              <div className="flex-none pb-7 mt-6">
                <Row gutter={[10, 10]}>
                  <Col xs={24} md={24} lg={12} xl={12} className="flex gap-2">
                    <Input
                      prefix={<SearchOutlined className="text-grayText mr-2" />}
                      placeholder="Search favorites"
                      className="px-3 py-3 rounded-full"
                      onChange={handleSearchChange}
                      allowClear
                    />
                    <Select
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
                        { value: "new", label: "New" },
                        { value: "preferred", label: "Preferred" },
                        { value: "standard", label: "Standard" },
                      ]}
                    />
                  </Col>
                </Row>
              </div>

              {/* Scrollable Cards Section */}
              <div
                className="flex-grow overflow-x-hidden overflow-y-auto mt-2"
                ref={contentRef}
                style={{ height: containerHeight }}
              >
                {loading && vendors?.length === 0 ? (
                  <div className="flex justify-center items-center h-64">
                    <Spin size="large" />
                  </div>
                ) : vendorsListError ? (
                  <div className="flex justify-center items-center h-64">
                    <Text className="text-red-500">
                      Error loading favorite vendors. Please try again.
                    </Text>
                  </div>
                ) : displayVendors.length === 0 ? (
                  <div className="flex justify-center items-center h-64">
                    <Text className="text-grayText">
                      {searchTerm.trim()
                        ? `No favorite vendors found for "${searchTerm}"`
                        : "No favorite vendors found."}
                    </Text>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-6">
                      {displayVendors.map((vendor) => {
                        const logoUrl = vendor.logo_path
                          ? `${import.meta.env.VITE_IMAGE_BASE_URL}/${
                              vendor.logo_path
                            }`
                          : "https://images.pexels.com/photos/3979134/pexels-photo-3979134.jpeg?auto=compress&cs=tinysrgb&w=600";

                        return (
                          <div
                            key={vendor.id}
                            onClick={() => handleChange(vendor.id)}
                            className="cursor-pointer"
                          >
                            <div className="bg-liteGray px-2 py-3 xl:px-3 xl:py-3 2xl:px-2 2xl:py-2 rounded-2xl hover:bg-[#303030] transition-colors">
                              <div className="relative">
                                <img
                                  src={logoUrl}
                                  className="rounded-2xl h-44 w-full object-contain"
                                  alt={vendor.vendor_name}
                                  onError={(e) => {
                                    e.target.src =
                                      "https://images.pexels.com/photos/3979134/pexels-photo-3979134.jpeg?auto=compress&cs=tinysrgb&w=600";
                                  }}
                                />

                                {/* Favorite Button - Always filled since these are favorites */}
                                <div className="absolute top-2 right-2">
                                  <Button
                                    type="text"
                                    icon={
                                      unfavoriteVendorLoading ? (
                                        ""
                                      ) : (
                                        // <LoadingOutlined className="text-lg animate-spin" />
                                        <i className="icon-heart-filled text-red-500 text-lg" />
                                      )
                                    }
                                    className={`text-white bg-gray hover:bg-[#404040] transition-colors ${
                                      unfavoriteVendorLoading
                                        ? "cursor-not-allowed opacity-70"
                                        : "cursor-pointer"
                                    }`}
                                    shape="circle"
                                    size="small"
                                    disabled={unfavoriteVendorLoading}
                                    onClick={(e) =>
                                      handleFavoriteToggle(vendor.id, e)
                                    }
                                    title={
                                      unfavoriteVendorLoading
                                        ? "Processing..."
                                        : "Remove from favorites"
                                    }
                                  />
                                </div>

                                {/* Rating or New Badge */}
                                <div>
                                  {vendor.is_new ? (
                                    <div className="bg-liteGray pb-[4px] pt-[6px] px-[4px] rounded-full absolute top-[-12px] left-2">
                                      <div className="bg-[#FFAA16] font-bold rounded-full text-gray border-0 px-3 py-1 text-xs">
                                        New
                                      </div>
                                    </div>
                                  ) : (
                                    <Tag className="bg-black/40 backdrop-blur-sm rounded-full text-white border-0 absolute top-2 left-2">
                                      <i className="icon-star text-yellow-600 before:!m-0" />
                                      <span className="text-xs">4.8</span>
                                    </Tag>
                                  )}
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
                                  className="font-semibold text-sm"
                                  title={vendor.vendor_name}
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
          </div>
        </div>
      </Col>
    </Row>
  );
};

export default VendorFavorites;
