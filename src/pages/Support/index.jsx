import { Button, Col, Input, Row, Typography, Spin } from "antd";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ShadowBoxContainer from "../../components/AuthLayout/ShadowBoxContainer";
import { SearchOutlined } from "@ant-design/icons";
import { hasBgRendering } from "@fullcalendar/core/internal";
import { useDispatch } from "react-redux";
import {
  fetchCategories,
  fetchCategorySearch,
  fetchCategorySearchSuggestions,
} from "../../services/Store/Support/action";

const Support = () => {
  const { Text, Title } = Typography;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");

  // State for categories and pagination
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // State for search results
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // State for autosuggestion
  const [suggestions, setSuggestions] = useState([]);
  const [currentSuggestion, setCurrentSuggestion] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestionDebounceTimer, setSuggestionDebounceTimer] = useState(null);

  // Ref for infinite scroll and input
  const observerRef = useRef();
  const inputRef = useRef();
  const lastCategoryElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreCategories();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore]
  );

  const handleClickLogin = (category) => {
    if (category.login_url) {
      window.open(category.login_url, "_blank");
    }
  };

  const handleClickLearnMore = (category) => {
    if (category.id) {
      navigate(`/support/${category.id}`);
    }
  };

  // Load categories function
  const loadCategories = useCallback(
    async (page = 1, reset = false) => {
      if (loading) return;

      setLoading(true);
      try {
        const params = {
          page: page,
          per_page: 9,
          ...(searchTerm && { search: searchTerm }),
        };

        const res = await dispatch(fetchCategories(params));
        console.log("fetchCategories res", res);

        if (res.payload && res.payload.data) {
          const { categories: newCategories, pagination } = res.payload.data;

          // Filter out inactive categories
          const activeCategories = newCategories.filter(
            (category) => category.is_active === true
          );

          if (reset) {
            setCategories(activeCategories);
          } else {
            setCategories((prev) => [...prev, ...activeCategories]);
          }

          setCurrentPage(pagination.currentPage);
          setTotalPages(pagination.totalPage);
          setHasMore(pagination.currentPage < pagination.totalPage);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    },
    [dispatch, searchTerm]
  );

  // Load more categories for infinite scroll
  const loadMoreCategories = useCallback(() => {
    if (hasMore && !loading) {
      loadCategories(currentPage + 1, false);
    }
  }, [hasMore, loading, currentPage, loadCategories]);

  // Fetch search results
  const fetchSearchResults = useCallback(
    async (query) => {
      if (!query.trim()) {
        setSearchResults(null);
        setIsSearching(false);
        return;
      }

      setSearchLoading(true);
      setIsSearching(true);

      try {
        const params = { search: query };
        const res = await dispatch(fetchCategorySearch(params));
        console.log("Search results response", res?.payload);

        if (res?.payload?.data) {
          setSearchResults(res.payload.data);
        }
      } catch (error) {
        console.log("Error fetching search results:", error);
        setSearchResults(null);
      } finally {
        setSearchLoading(false);
      }
    },
    [dispatch]
  );

  // Fetch suggestions with debouncing
  const fetchSuggestions = useCallback(
    async (query) => {
      if (!query.trim()) {
        setSuggestions([]);
        setCurrentSuggestion("");
        setShowSuggestion(false);
        return;
      }

      try {
        const params = { query };
        const res = await dispatch(fetchCategorySearchSuggestions(params));
        console.log("Search response", res?.payload);

        if (res?.payload?.data?.suggestions) {
          const suggestionList = res.payload.data.suggestions;
          setSuggestions(suggestionList);

          // Find the best matching suggestion
          const bestMatch = suggestionList.find((suggestion) =>
            suggestion.title.toLowerCase().startsWith(query.toLowerCase())
          );

          if (bestMatch) {
            setCurrentSuggestion(bestMatch.title);
            setShowSuggestion(true);
          } else {
            setCurrentSuggestion("");
            setShowSuggestion(false);
          }
        }
      } catch (error) {
        console.log("Error fetching suggestions:", error);
        setSuggestions([]);
        setCurrentSuggestion("");
        setShowSuggestion(false);
      }
    },
    [dispatch]
  );

  // Handle search input change
  const handleSearchInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      console.log("value1", value);
      setSearchTerm(value);

      // Clear existing suggestion debounce timer
      if (suggestionDebounceTimer) {
        clearTimeout(suggestionDebounceTimer);
      }

      // Set new debounce timer for suggestions
      const newTimer = setTimeout(() => {
        fetchSuggestions(value);
      }, 300);

      setSuggestionDebounceTimer(newTimer);

      // If input is cleared, hide suggestions and search results
      if (!value.trim()) {
        setCurrentSuggestion("");
        setShowSuggestion(false);
        setCurrentPage(1);
        setHasMore(true);
        setSearchResults(null);
        setIsSearching(false);
      }
    },
    [suggestionDebounceTimer, fetchSuggestions]
  );

  // Handle search execution (for categories)
  const executeSearch = useCallback(
    (value) => {
      setCurrentPage(1);
      setCategories([]);
      setHasMore(true);
      // Fetch search results when executing search
      fetchSearchResults(value);
    },
    [fetchSearchResults]
  );

  // Handle key events
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Tab" && showSuggestion && currentSuggestion) {
        e.preventDefault();
        console.log("currentSuggestion", currentSuggestion);
        setSearchTerm(currentSuggestion);
        setShowSuggestion(false);
        setCurrentSuggestion("");
        executeSearch(currentSuggestion);
      } else if (e.key === "Escape") {
        setShowSuggestion(false);
        setCurrentSuggestion("");
      }
    },
    [showSuggestion, currentSuggestion, executeSearch]
  );

  // Handle input focus/blur
  const handleInputFocus = useCallback(() => {
    if (currentSuggestion && searchTerm) {
      setShowSuggestion(true);
    }
  }, [currentSuggestion, searchTerm]);

  const handleInputBlur = useCallback(() => {
    // Delay hiding suggestion to allow for tab key processing
    setTimeout(() => {
      setShowSuggestion(false);
    }, 150);
  }, []);

  // Initial load
  useEffect(() => {
    loadCategories(1, true);
  }, []);

  // Debounced search effect for categories and search results
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadCategories(1, true);
      // Fetch search results if there's a search term
      if (searchTerm.trim()) {
        fetchSearchResults(searchTerm);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, loadCategories, fetchSearchResults]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (suggestionDebounceTimer) {
        clearTimeout(suggestionDebounceTimer);
      }
    };
  }, [suggestionDebounceTimer]);

  // Calculate suggestion display text
  const getSuggestionDisplay = () => {
    if (!showSuggestion || !currentSuggestion || !searchTerm) {
      return null;
    }

    const query = searchTerm.toLowerCase();
    const suggestion = currentSuggestion.toLowerCase();

    if (suggestion.startsWith(query)) {
      const typedPart = currentSuggestion.slice(0, searchTerm.length);
      const suggestionPart = currentSuggestion.slice(searchTerm.length);
      return { typedPart, suggestionPart };
    }

    return null;
  };
  const handleVideoClick = (video) => {
    navigate(`/support/video/${video.video_id}`);
  };

  const handleArticleClick = (article) => {
    navigate(`/support/article/${article.id}`);
  };

  const suggestionDisplay = getSuggestionDisplay();

  console.log("suggestionDisplay", suggestionDisplay);
  console.log("searchResults", searchResults);

  return (
    <Row
      className="bg-darkGray px-header-wrapper h-full w-full"
      gutter={[0, 24]}
    >
      <Col
        span={24}
        className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mt-6"
      >
        <div className="flex justify-center items-center">
          <Title
            level={2}
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
              to="/support"
              className="text-primary hover:text-primary flex justify-center"
            >
              <Text className="text-white text-lg sm:text-2xl">Support</Text>
            </Link>
          </Title>
        </div>
      </Col>
      <ShadowBoxContainer height={containerHeight}>
        <div className="text-center text-xl">How can we help you?</div>
        <div className="flex-none ">
          <Row
            gutter={[10, 10]}
            justify="center"
            align="middle"
            className="w-full"
          >
            <Col
              xs={24}
              sm={20}
              md={16}
              lg={13}
              className="flex flex-col sm:flex-row mt-3"
            >
              <div className="relative w-full">
                <Input
                  ref={inputRef}
                  prefix={
                    <SearchOutlined className="text-gray-500 mr-2 px-1 align-middle" />
                  }
                  placeholder="Search"
                  className="rounded-full w-full"
                  size="large"
                  allowClear
                  onChange={handleSearchInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  value={searchTerm}
                />
                {/* Suggestion overlay */}
                {suggestionDisplay && (
                  <div
                    className="absolute top-0 left-0 right-0 h-full flex items-center pointer-events-none z-10"
                    style={{
                      paddingLeft: "44px", // Adjust based on prefix width
                      paddingRight: "44px", // Adjust based on clear button width
                      fontSize: "16px", // Match input font size
                      lineHeight: "1.5",
                    }}
                  >
                    <div className="flex">
                      <span className="text-transparent select-none">
                        {suggestionDisplay.typedPart}
                      </span>
                      <span className="!text-grayText select-none ml-[10px] mt-[2px]">
                        {suggestionDisplay.suggestionPart}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Col>
          </Row>

          {/* Show search results when searching */}
          {isSearching && searchResults ? (
            <div className="flex-col pb-5">
              <div className="flex items-center gap-2 mt-5">
                <div className="text-grayText text-lg">
                  Search results for &quot;{searchTerm}&quot;
                </div>
                <div className="h-1.5 rounded-full w-1.5 bg-grayText"> </div>
                <div className="bg-primaryOpacity px-2 py-0.5 text-primary rounded-lg font-bold !text-sm">
                  {searchResults?.total_results || 0}
                </div>
              </div>

              {/* Videos Section */}
              {searchResults?.videos && searchResults.videos.count > 0 && (
                <>
                  <div className="flex items-center gap-2 mt-3 text-md">
                    <div>Videos</div>
                    <div className="h-1.5 rounded-full w-1.5 bg-grayText">
                      {" "}
                    </div>
                    <div className="bg-primaryOpacity px-2 py-0.5 text-primary rounded-lg font-bold !text-sm">
                      {searchResults.videos.count}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-3">
                    {searchResults.videos.data?.map((video, index) => (
                      <div
                        key={video.id}
                        className="bg-liteGray px-2 py-3 xl:px-3 xl:py-3 2xl:px-3 2xl:py-3 mt-5 rounded-2xl"
                        onClick={() => handleVideoClick(video)}
                      >
                        <div>
                          <img
                            src={
                              video.thumbnail ||
                              "https://media.istockphoto.com/id/1353379172/photo/cute-little-african-american-girl-looking-at-camera.jpg?s=170667a&w=is&k=20&c=JJ8IGmBvg9V_VGKdpDP6O0WR_H97epRjO-spB5-2V38="
                            }
                            alt="video_thumbnail"
                            className="w-full h-[120px] object-cover rounded-lg"
                          />
                        </div>
                        <div className="mx-2">
                          <div className="mt-2 mb-1">
                            <Text className="text-[#FFAA16] text-xs bg-[#FFAA161A] p-1 rounded-md">
                              {video.category_type || "Category"}
                            </Text>
                          </div>
                          <Text className="text-white text-md font-bold">
                            {video.title
                              ?.split(new RegExp(`(${searchTerm})`, "gi"))
                              .map((part, i) =>
                                part.toLowerCase() ===
                                searchTerm.toLowerCase() ? (
                                  <span
                                    key={i}
                                    className="text-primary bg-primaryOpacity !rounded-none py-0.5"
                                  >
                                    {part}
                                  </span>
                                ) : (
                                  part
                                )
                              )}
                          </Text>
                          <Row gutter={[6, 10]} className="mt-0 p-1">
                            <div className="text-sm text-grayText">
                              {new Date(video.created_at).toLocaleDateString()}
                            </div>
                          </Row>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Articles Section */}
              {searchResults?.articles && searchResults.articles.count > 0 && (
                <>
                  <div className="flex items-center gap-2 mt-6 text-lg">
                    <div>Articles</div>
                    <div className="h-1.5 rounded-full w-1.5 bg-grayText">
                      {" "}
                    </div>
                    <div className="bg-primaryOpacity px-2 py-0.5 text-primary rounded-lg font-bold !text-sm">
                      {searchResults.articles.count}
                    </div>
                  </div>

                  <div className="mt-5 !text-md">
                    {searchResults.articles.data?.map((article, index) => (
                      <div
                        key={article.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-1.5 mt-3"
                        onClick={() => handleArticleClick(article)}
                      >
                        <div className="flex items-start sm:items-center gap-2 sm:gap-0">
                          <i className="demo-icon icon-documents text-xl sm:text-2xl text-primary flex-shrink-0 mt-0 sm:mt-0">
                            &#xe813;
                          </i>
                          <div className="flex flex-row flex-wrap items-center gap-1 sm:gap-1 ml-[-17px]">
                            {article.title
                              ?.split(new RegExp(`(${searchTerm})`, "gi"))
                              .map((part, i) =>
                                part.toLowerCase() ===
                                searchTerm.toLowerCase() ? (
                                  <span
                                    key={i}
                                    className="text-primary bg-primaryOpacity"
                                  >
                                    {part}
                                  </span>
                                ) : (
                                  <span key={i}>{part}</span>
                                )
                              )}
                            <span className="text-[#FFAA16] text-xs mx-1 sm:text-sm bg-[#FFAA161A] px-1 py-1 rounded-md self-start sm:self-auto">
                              {article.category_type || "Category"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* No search results */}
              {searchResults?.total_results === 0 && (
                <div className="text-center py-8 text-grayText">
                  No results found for "{searchTerm}"
                </div>
              )}

              {/* Search loading */}
              {searchLoading && (
                <div className="flex justify-center py-4">
                  <Spin size="large" />
                </div>
              )}
            </div>
          ) : (
            /* Show categories when not searching */
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-9 gap-4 pb-6">
                {categories.map((category, index) => (
                  <div
                    key={category.id}
                    ref={
                      index === categories.length - 1
                        ? lastCategoryElementRef
                        : null
                    }
                    className="flex-col bg-[#373737] py-3 rounded-3xl"
                  >
                    <div className="text-xl font-bold py-3 border-b-[2px] border-[#1E1E1E]">
                      <span
                        className="ml-8 block truncate pr-4"
                        title={category.name}
                      >
                        {category.name}
                      </span>
                    </div>
                    <div className="p-3 px-7">
                      <div className="py-1 text-justify text-sm text-[#6D6D6D] break-words">
                        {category.description}
                      </div>
                      <div className="flex gap-4 py-1 mt-3">
                        <Button
                          type="primary"
                          size="large"
                          className="w-full shadow-none"
                          onClick={() => handleClickLogin(category)}
                          disabled={!category.is_active}
                        >
                          Login
                        </Button>
                        <Button
                          className="w-full bg-primaryOpacity text-primary border-primary shadow-none"
                          size="large"
                          variant="filled"
                          onClick={() => handleClickLearnMore(category)}
                        >
                          Learn More
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Loading indicator */}
              {loading && (
                <div className="flex justify-center py-4">
                  <Spin size="large" />
                </div>
              )}

              {/* No categories found */}
              {!loading && categories.length === 0 && !isSearching && (
                <div className="text-center py-4 text-grayText">
                  No categories found
                </div>
              )}
            </>
          )}
        </div>
      </ShadowBoxContainer>
    </Row>
  );
};

export default Support;
