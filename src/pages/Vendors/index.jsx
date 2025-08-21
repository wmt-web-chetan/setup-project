/* eslint-disable react/no-unknown-property */
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
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import VendorSuggestionModal from "./VendorSuggestionModal";
import ShadowBoxContainer from "../../components/AuthLayout/ShadowBoxContainer";
import { fetchVendorStoreCategories } from "../../services/Store/VendorAdmin/action";

const { Text, Title } = Typography;

const Vendors = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  const [isSuggestionModalVisible, setisSuggestionModalVisible] =
    useState(false);

  // Search and filtering states
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCategories, setFilteredCategories] = useState([]);

  // Infinite scrolling states
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreContent, setHasMoreContent] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPage: 1,
    totalRecords: 0,
    perPage: 25,
  });

  // Refs
  const contentRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Get categories data from Redux store
  const { vendorCategories, vendorCategoriesLoading, vendorCategoriesError } =
    useSelector((state) => state.vendorStoreCategories);

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
  const debouncedSearch = useCallback((searchValue) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(searchValue);
      // Reset pagination and fetch fresh data when searching
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      setHasMoreContent(true);
      fetchCategories(1, false, searchValue);
    }, 500);
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    debouncedSearch(value);
  };

  // Create a fetchCategories function that can be reused for initial and additional loads
  const fetchCategories = useCallback(
    (page = 1, shouldAppend = false, search = searchTerm) => {
      const params = {
        page: page,
        per_page: pagination.perPage,
        is_active: true,        
        ...(search && { search: search }),
        
      };


      if (page === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      dispatch(fetchVendorStoreCategories(params))
        .then((response) => {

          if (response?.payload?.meta?.success === true) {
            const newCategories = response.payload.data?.categories || [];
            const paginationData = response.payload.data?.pagination;


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
              setCategories((prevCategories) => {
                // Filter out duplicates based on id
                const existingIds = new Set(
                  prevCategories.map((cat) => cat.id)
                );
                const uniqueNewCategories = newCategories.filter(
                  (cat) => !existingIds.has(cat.id)
                );
                return [...prevCategories, ...uniqueNewCategories];
              });
            } else {
              // Otherwise, replace the existing data
              setCategories(newCategories);
            }
          } else {
            console.error(
              "Error fetching categories:",
              response?.payload?.meta?.message
            );
          }

          setLoading(false);
          setIsLoadingMore(false);
        })
        .catch((error) => {
          console.error("Error fetching categories:", error);
          setLoading(false);
          setIsLoadingMore(false);
        });
    },
    [dispatch, pagination.perPage, searchTerm]
  );

  // Handle scroll event for infinite scrolling
  const handleScroll = useCallback(() => {
    if (!contentRef.current || isLoadingMore || !hasMoreContent || loading)
      return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;

    // Load more content when 500px from the bottom
    if (scrollHeight - scrollTop - clientHeight < 500) {
      const nextPage = pagination.currentPage + 1;
      fetchCategories(nextPage, true);
    }
  }, [
    isLoadingMore,
    hasMoreContent,
    loading,
    pagination.currentPage,
    fetchCategories,
  ]);

  // Initial fetch of categories
  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setHasMoreContent(true);
    fetchCategories(1, false);

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

  // Filter categories based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter((category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [categories, searchTerm]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const hideSuggestionModal = () => {
    setisSuggestionModalVisible(!isSuggestionModalVisible);
  };

  const handleSuggestionSubmit = (data) => {
    console.log(data);
    // After successful submission, refresh the categories
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setHasMoreContent(true);
    fetchCategories(1, false);
  };

  const showSuggestionModal = () => {
    setisSuggestionModalVisible(true);
  };

  const handleClick = (categoryId, categoryName) => {
    navigate(`/vendor-store/${categoryId}`, {
      state: { categoryName },
    });
  };

  // Get display categories (either filtered or all)
  const displayCategories = searchTerm.trim() ? filteredCategories : categories;
  const totalCategories = pagination.totalRecords;

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
            <Text className="text-white text-lg sm:text-2xl">Vendor Store</Text>
          </Title>
        </div>
      </Col>

      <Col span={24} className="h-full mb-4">
        <ShadowBoxContainer
          height={containerHeight}
          shadowVisible={false}
          // overflow="hidden"
        >
          <div className="flex flex-col h-full">
            <div className="flex-none">
              <div className="flex mt-0 items-center">
                <div className="text-2xl font-normal">Categories</div>
                {categories?.length !== 0 && (
                  <>
                    <span className="mx-3 text-grayText">&#8226;</span>
                    <div className="bg-primaryOpacity rounded-lg px-3 py-1 text-primary">
                      {totalCategories}
                    </div>
                  </>
                )}
              </div>

              {/* Fixed Header Section */}
              <div className="flex-none pb-7 mt-6">
                <Row gutter={[10, 10]}>
                  <Col xs={24} md={24} lg={12} xl={9}>
                    <Input
                      prefix={<SearchOutlined className="text-grayText mr-2" />}
                      placeholder="Search for vendor name or category"
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
                      className="py-5 bg-gray shadow-none rounded-full border border-liteGray"
                      onClick={showSuggestionModal}
                    >
                      Submit a Vendor Suggestion
                    </Button>
                  </Col>
                </Row>
              </div>
            </div>

            {/* Scrollable Cards Section */}
            <div
              // className="flex-grow overflow-y-auto"
              ref={contentRef}
              // style={{ height: "calc(100% - 120px)" }}
            >
              {loading && categories.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <Spin size="large" />
                </div>
              ) : vendorCategoriesError ? (
                <div className="flex justify-center items-center h-64">
                  <Text className="text-red-500">
                    Error loading categories. Please try again.
                  </Text>
                </div>
              ) : displayCategories.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <Text className="text-grayText">
                    {searchTerm.trim() ? (
                      <Empty
                        description={
                          <span className="text-grayText">
                            No categories found for "{searchTerm}"
                          </span> 
                        }
                      />
                    ) : (
                      <Empty
                        description={
                          <span className="text-grayText">
                            No categories found
                          </span>
                        }
                      />
                    )}
                  </Text>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mb-6">
                    {displayCategories.map((category) => (
                      <div
                        key={category.id}
                        onClick={() => handleClick(category.id)}
                        className="cursor-pointer"
                      >
                        <div className="bg-liteGray px-4 py-4 rounded-[32px] hover:bg-[#303030] transition-colors h-[140px]">
                          <div className="flex flex-col h-full">
                            {/* Icon section - takes up fixed space */}
                            <div className="flex justify-center items-center h-16 pb-3">
                              <div className="inline-block bg-gray rounded-full p-2 px-3 text-grayText">
                                {category.icon ? (
                                  <img
                                    src={category.icon}
                                    alt={category.name}
                                    className="w-8 h-8"
                                  />
                                ) : (
                                  <i className="icon-comment before:!m-0 text-gray-300 text-3xl" />
                                )}
                              </div>
                            </div>

                            {/* Text section - takes remaining space and centers vertically */}
                            <div className="flex-1 flex px-2">
                              <div 
                                className="w-full text-center category-name-container"
                                title={category.name}
                              >
                                <Text className="font-semibold text-md text-white leading-tight">
                                  {category.name}
                                </Text>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
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

      <VendorSuggestionModal
        isVisible={isSuggestionModalVisible}
        onCancel={hideSuggestionModal}
        onSubmit={handleSuggestionSubmit}
      />

      {/* Custom CSS for text clamping */}
      <style jsx>{`
        .category-name-container {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
          max-height: 2.4em; /* 2 lines * 1.2 line-height */
          word-wrap: break-word;
        }
      `}</style>
    </Row>
  );
};

export default Vendors;