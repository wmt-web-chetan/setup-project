import React, { useState, useEffect, useRef, useCallback } from "react";
import { Typography, Row, Col, Input, Button, Spin, Empty } from "antd";
import { SearchOutlined, LoadingOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ShadowBoxContainer from "../../components/AuthLayout/ShadowBoxContainer";
import { fetchCoachingPrograms } from "../../services/Store/CoachingProgram/action";

const { Text, Title } = Typography;

const CoachingPrograms = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");

  // Search and filtering states
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPrograms, setFilteredPrograms] = useState([]);

  // Infinite scrolling states
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreContent, setHasMoreContent] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPage: 1,
    totalRecords: 0,
    perPage: 10,
  });

  // Refs
  const contentRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Get coaching programs data from Redux store
  const { coachingPrograms, coachingProgramsLoading, coachingProgramsError } =
    useSelector((state) => state.coachingPrograms);

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
      fetchPrograms(1, false, searchValue);
    }, 500);
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    debouncedSearch(value);
  };

  // Create a fetchPrograms function that can be reused for initial and additional loads
  const fetchPrograms = useCallback(
    (page = 1, shouldAppend = false, search = searchTerm) => {
      const params = {
        page: page,
        per_page: pagination.perPage,
        ...(search && { search: search }),
      };

      // console.log(`Fetching coaching programs, page ${page}`, params);

      if (page === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      dispatch(fetchCoachingPrograms(params))
        .then((response) => {
          // console.log("Coaching Programs API response:", response);

          if (response?.payload?.meta?.success === true) {
            const newPrograms = response.payload.data?.coaching_programs || [];
            const paginationData = response.payload.data?.pagination;

            // console.log(`Received ${newPrograms.length} coaching programs`);

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
              setPrograms((prevPrograms) => {
                // Filter out duplicates based on id
                const existingIds = new Set(
                  prevPrograms.map((program) => program.id)
                );
                const uniqueNewPrograms = newPrograms.filter(
                  (program) => !existingIds.has(program.id)
                );
                return [...prevPrograms, ...uniqueNewPrograms];
              });
            } else {
              // Otherwise, replace the existing data
              setPrograms(newPrograms);
            }
          } else {
            console.error(
              "Error fetching coaching programs:",
              response?.payload?.meta?.message
            );
          }

          setLoading(false);
          setIsLoadingMore(false);
        })
        .catch((error) => {
          console.error("Error fetching coaching programs:", error);
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
      // console.log(`Loading more coaching programs, page ${nextPage}`);
      fetchPrograms(nextPage, true);
    }
  }, [
    isLoadingMore,
    hasMoreContent,
    loading,
    pagination.currentPage,
    fetchPrograms,
  ]);

  // Initial fetch of coaching programs
  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setHasMoreContent(true);
    fetchPrograms(1, false);

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
  // Filter programs based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPrograms(programs);
    } else {
      const filtered = programs.filter(
        (program) =>
          program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          program.academy_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPrograms(filtered);
    }
  }, [programs, searchTerm]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleLearnMore = (programId) => {
    navigate(`/coaching-programs/detail/${programId}`);
  };

  const handleVisitWebsite = (websiteUrl) => {
    if (websiteUrl) {
      window.open(websiteUrl, "_blank");
    }
  };

  // Get display programs (either filtered or all)
  const displayPrograms = searchTerm.trim() ? filteredPrograms : programs;
  const totalPrograms = pagination.totalRecords;

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
            <Text className="text-white text-lg sm:text-2xl">
              Coaching Programs
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
                <div className="text-2xl font-normal">Coaching Programs</div>
                {programs?.length !== 0 && (
                  <>
                    <span className="mx-3 text-grayText">&#8226;</span>
                    <div className="bg-primaryOpacity rounded-lg px-3 py-1 text-primary">
                      {totalPrograms}
                    </div>
                  </>
                )}
              </div>

              {/* Fixed Header Section */}
              <div className="flex-none pb-7 mt-6">
                <Row gutter={[10, 10]}>
                  <Col xs={24} md={24} lg={12} xl={8}>
                    <Input
                      prefix={<SearchOutlined className="text-grayText mr-2" />}
                      placeholder="Search for program name or academy"
                      className="px-3 py-3 rounded-full"
                      onChange={handleSearchChange}
                      allowClear
                    />
                  </Col>
                </Row>
              </div>
            </div>

            {/* Scrollable Cards Section */}
            <div
              className="flex-grow overflow-y-auto"
              ref={contentRef}
              style={{ height: "calc(100% - 120px)" }}
            >
              {loading && programs.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <Spin size="large" />
                </div>
              ) : coachingProgramsError ? (
                <div className="flex justify-center items-center h-64">
                  <Text className="text-red-500">
                    Error loading coaching programs. Please try again.
                  </Text>
                </div>
              ) : displayPrograms.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <Empty
                    description={
                      searchTerm.trim()
                        ? `No coaching programs found for "${searchTerm}"`
                        : `No coaching programs found.`
                    }
                  />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-4 mb-6">
                    {displayPrograms.map((program) => (
                      <div key={program.id}>
                        <div className="bg-liteGray px-2 py-3 xl:px-3 xl:py-3 2xl:px-3 2xl:py-3 rounded-2xl hover:bg-[#303030] transition-colors">
                          <div>
                            <img
                              src={
                                program.thumbnail_img
                                  ? `${import.meta.env.VITE_IMAGE_BASE_URL}/${
                                      program.thumbnail_img
                                    }`
                                  : "https://media.istockphoto.com/id/1353379172/photo/cute-little-african-american-girl-looking-at-camera.jpg?s=170667a&w=is&k=20&c=JJ8IGmBvg9V_VGKdpDP6O0WR_H97epRjO-spB5-2V38="
                              }
                              alt={program.name}
                              className="w-full h-72 object-cover rounded-2xl"
                              onError={(e) => {
                                e.target.src =
                                  "https://media.istockphoto.com/id/1353379172/photo/cute-little-african-american-girl-looking-at-camera.jpg?s=170667a&w=is&k=20&c=JJ8IGmBvg9V_VGKdpDP6O0WR_H97epRjO-spB5-2V38=";
                              }}
                            />
                          </div>
                          <div className="mt-2">
                            <Text className="text-white text-md font-bold truncate block">
                              {program.name}
                            </Text>
                          </div>
                          <Text className="text-grayText text-sm truncate block">
                            {program.academy_name}
                          </Text>
                          <Row gutter={[6, 10]} className="mt-2">
                            <Col span={12}>
                              <Button
                                type="primary"
                                className="px-4 py-4 shadow-none text-sm font-semibold"
                                block
                                onClick={() => handleLearnMore(program.id)}
                              >
                                Learn More
                              </Button>
                            </Col>
                            <Col span={12}>
                              <Button
                                className="bg-primaryOpacity py-4 text-primary border-primary px-5 text-sm font-semibold"
                                variant="filled"
                                block
                                onClick={() =>
                                  handleVisitWebsite(program.website_url)
                                }
                                disabled={!program.website_url}
                              >
                                Website
                              </Button>
                            </Col>
                          </Row>
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
    </Row>
  );
};

export default CoachingPrograms;
