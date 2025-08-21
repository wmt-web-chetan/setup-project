import React, { useEffect, useState, useRef, useCallback } from "react";
import "./Feed.scss";
import {
  Avatar,
  Col,
  Divider,
  Drawer,
  Row,
  Tabs,
  Typography,
  Empty,
  Spin,
  Input,
} from "antd";
import FeedCard from "../FeedCard";
import NewPostModal from "../NewPostModal";

import { useReverb } from "../../../../utils/useReverb";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllFeeds,
  fetchFeedById,
} from "../../../../services/Store/Feed/action";
import { useLocation } from "react-router-dom";
import {
  SearchOutlined,
} from "@ant-design/icons";

const Feed = ({ feedMobileDrawer, setFeedMobileDrawer }) => {
  const dispatch = useDispatch();
  const { Text, Title } = Typography;

  const location = useLocation();

  // State for feeds data
  const [tabType, setTabType] = useState("published");
  const [allFeeds, setAllFeeds] = useState([]);
  const [publishedFeeds, setPublishedFeeds] = useState([]);
  const [pinnedFeeds, setPinnedFeeds] = useState([]);
  const [draftFeeds, setDraftFeeds] = useState([]);
  const [isOpenNewChatModal, setIsOpenNewChatModal] = useState(false);
  const [createdPostResponse, setCreatedPostResponse] = useState(null);

  // Search related states
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchPage, setSearchPage] = useState(1);
  const [searchHasMore, setSearchHasMore] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);

  // Pagination state
  const [allFeedsPage, setAllFeedsPage] = useState(1);
  const [tabFeedsPage, setTabFeedsPage] = useState(1);
  const [allFeedsHasMore, setAllFeedsHasMore] = useState(true);
  const [tabFeedsHasMore, setTabFeedsHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [tabChangeLoading, setTabChangeLoading] = useState(false);
  const [singleFeedLoading, setSingleFeedLoading] = useState(false);
  const [singleFeedData, setSingleFeedData] = useState(null);

  // Refs for infinite scrolling
  const allFeedsObserver = useRef();
  const tabFeedsObserver = useRef();
  const searchObserver = useRef();
  const allFeedsLastElementRef = useRef();
  const tabFeedsLastElementRef = useRef();
  const searchLastElementRef = useRef();

  const { userForEdit } = useSelector((state) => state?.usersmanagement);
  const { feedData } = useSelector((state) => state?.feeds);

  console.log("feedDatafeedData", feedData);

  const {
    data: progressData,
    error: progressError,
    isConnected: progressisConnected,
  } = useReverb(
    `feedfileprogress.${userForEdit?.user?.id}`,
    ".feedfileprogress"
  );

  const {
    data: newFeedData,
    error: newFeedError,
    isConnected: newFeedisConnected,
  } = useReverb(`feeds`, ".feedEventCreated");

  useEffect(() => {
    if (allFeeds?.length > 0) {
      setAllFeeds((prev) => {
        const exists = prev?.some((item) => item?.id === newFeedData?.feed?.id);
        if (exists) {
          return prev; // Don't append if ID already exists
        }
        // return [ ...prev]; // Append new item
        return [newFeedData?.feed, ...prev]; // Append new item
      });
    }
  }, [newFeedData]);

  useEffect(() => {
    if (location?.state?.originalData?.reference?.feed_id) {
      setSingleFeedLoading(true);
      dispatch(fetchFeedById(location?.state?.originalData?.reference?.feed_id))
        .then((res) => {
          if (res?.payload?.meta?.status === 200) {
            setSingleFeedData(res?.payload?.data?.feed);
            setSingleFeedLoading(false);
          }
        })
        .catch((error) => {
          console.error("Error fetching feed data:", error);
          setSingleFeedData(null);
          setSingleFeedLoading(false);
        });
    }
  }, [location?.state?.originalData?.reference?.feed_id]);

  // fetchFeedById

  ///
  // useEffect(() => {
  //   console.log("qq publishedFeeds", publishedFeeds);

  //   if (createdPostResponse?.feed?.status === 1) {
  //     // if (publishedFeeds?.length >= 0) {
  //     setPublishedFeeds((prev) => {
  //       // console.log('qq prev', prev)
  //       const exists = prev?.some(
  //         (item) => item?.id === createdPostResponse?.feed?.id
  //       );
  //       console.log("qq publishedFeeds exists", exists);
  //       if (exists) {
  //         return prev; // Don't append if ID already exists
  //       }
  //       return [createdPostResponse?.feed, ...prev]; // Append new item
  //     });
  //     // }
  //   }

  //   if (createdPostResponse?.feed?.status === 2) {
  //     // Remove the condition that checks if draftFeeds has length > 0
  //     setDraftFeeds((prev) => {
  //       // Check if the array is empty or null/undefined and handle accordingly
  //       if (!prev || prev.length === 0) {
  //         return [createdPostResponse?.feed]; // Initialize with new item if empty
  //       }

  //       const exists = prev?.some(
  //         (item) => item?.id === createdPostResponse?.feed?.id
  //       );
  //       console.log("qq draftFeeds exists", exists);
  //       if (exists) {
  //         return prev; // Don't append if ID already exists
  //       }
  //       return [createdPostResponse?.feed, ...prev]; // Append new item
  //     });
  //   }
  // }, [createdPostResponse]);

  useEffect(() => {
    if (createdPostResponse?.feed?.status === 1) {
      // Normalize the status to string for consistency
      const normalizedFeed = normalizeFeedStatus(createdPostResponse.feed);

      setPublishedFeeds((prev) => {
        const exists = prev?.some((item) => item?.id === normalizedFeed?.id);
        if (exists) {
          return prev; // Don't append if ID already exists
        }
        return [normalizedFeed, ...prev]; // Append normalized feed
      });
    }

    if (createdPostResponse?.feed?.status === 2) {
      // Normalize the status to string for consistency
      const normalizedFeed = normalizeFeedStatus(createdPostResponse.feed);

      // Remove the condition that checks if draftFeeds has length > 0
      setDraftFeeds((prev) => {
        // Check if the array is empty or null/undefined and handle accordingly
        if (!prev || prev.length === 0) {
          return [normalizedFeed]; // Initialize with normalized feed
        }

        const exists = prev?.some((item) => item?.id === normalizedFeed?.id);
        if (exists) {
          return prev; // Don't append if ID already exists
        }
        return [normalizedFeed, ...prev]; // Append normalized feed
      });
    }
  }, [createdPostResponse]);

  // Search function with debounce
  const performSearch = useCallback((query) => {
    if (!query || query.trim() === "") {
      setIsSearching(false);
      setSearchResults([]);
      setSearchPage(1);
      setSearchHasMore(true);
      return;
    }

    setIsSearching(true);
    setSearchLoading(true);
    setSearchPage(1);
    setSearchHasMore(true);

    const params = {
      type: "all",
      page: "1",
      per_page: "10",
      search: query.trim(),
    };

    dispatch(fetchAllFeeds(params))
      .then((res) => {
        if (res?.payload?.meta?.status === 200) {
          const feeds = res?.payload?.data?.feeds || [];
          const lastPage = res?.payload?.data?.last_page || 1;

          setSearchResults(feeds);
          setSearchHasMore(lastPage > 1);
          setSearchLoading(false);
        }
      })
      .catch(() => {
        setSearchLoading(false);
      });
  }, [dispatch]);

  // Handle search input change
  const onChangeRoleSearch = (e) => {
    const value = e.target.value;
    setSearchValue(value);

    // Clear previous timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Set new timer for debounced search
    const newTimer = setTimeout(() => {
      performSearch(value);
    }, 500); // 500ms debounce

    setSearchDebounceTimer(newTimer);
  };

  // Load more search results
  const loadMoreSearchResults = () => {
    if (!searchHasMore || searchLoading || !searchValue.trim()) return;

    const nextPage = searchPage + 1;
    setSearchLoading(true);

    const params = {
      type: "all",
      page: nextPage.toString(),
      per_page: "10",
      search: searchValue.trim(),
    };

    dispatch(fetchAllFeeds(params))
      .then((res) => {
        if (res?.payload?.meta?.status === 200) {
          const newFeeds = res?.payload?.data?.feeds || [];
          if (newFeeds.length > 0) {
            setSearchResults((prev) => [...prev, ...newFeeds]);
            setSearchPage(nextPage);
          }

          // Check if we've reached the last page
          const lastPage = res?.payload?.data?.last_page || 1;
          if (nextPage >= lastPage) {
            setSearchHasMore(false);
          }

          setSearchLoading(false);
        }
      })
      .catch(() => {
        setSearchLoading(false);
      });
  };

  // Setup infinite scrolling callback for search results
  const lastSearchElementRef = useCallback(
    (node) => {
      if (searchLoading) return;
      if (searchObserver.current) searchObserver.current.disconnect();

      searchObserver.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && searchHasMore && isSearching) {
          loadMoreSearchResults();
        }
      });

      if (node) searchObserver.current.observe(node);
    },
    [searchLoading, searchHasMore, isSearching, searchValue]
  );

  // Setup infinite scrolling callback for all feeds
  const lastAllFeedElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (allFeedsObserver.current) allFeedsObserver.current.disconnect();

      allFeedsObserver.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && allFeedsHasMore && !isSearching) {
          loadMoreAllFeeds();
        }
      });

      if (node) allFeedsObserver.current.observe(node);
    },
    [loading, allFeedsHasMore, isSearching]
  );

  // Setup infinite scrolling callback for tab feeds
  const lastTabFeedElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (tabFeedsObserver.current) tabFeedsObserver.current.disconnect();

      tabFeedsObserver.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && tabFeedsHasMore) {
          loadMoreTabFeeds();
        }
      });

      if (node) tabFeedsObserver.current.observe(node);
    },
    [loading, tabFeedsHasMore, tabType]
  );

  // Load more all feeds
  const loadMoreAllFeeds = () => {
    if (!allFeedsHasMore || loading || isSearching) return;

    const nextPage = allFeedsPage + 1;
    setLoading(true);

    const params = {
      type: "all",
      page: nextPage.toString(),
      per_page: "10",
    };

    dispatch(fetchAllFeeds(params))
      .then((res) => {
        if (res?.payload?.meta?.status === 200) {
          const newFeeds = res?.payload?.data?.feeds || [];
          if (newFeeds.length > 0) {
            setAllFeeds((prev) => [...prev, ...newFeeds]);
            setAllFeedsPage(nextPage);
          }

          // Check if we've reached the last page
          const lastPage = res?.payload?.data?.last_page || 1;
          if (nextPage >= lastPage) {
            setAllFeedsHasMore(false);
          }

          setLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
      });
  };

  // Load more tab feeds
  const loadMoreTabFeeds = () => {
    if (!tabFeedsHasMore || loading) return;

    const nextPage = tabFeedsPage + 1;
    setLoading(true);

    const params = {
      type: tabType,
      page: nextPage.toString(),
      per_page: "10",
    };

    dispatch(fetchAllFeeds(params))
      .then((res) => {
        if (res?.payload?.meta?.status === 200) {
          const newFeeds = res?.payload?.data?.feeds || [];
          if (newFeeds.length > 0) {
            if (tabType === "published") {
              setPublishedFeeds((prev) => [...prev, ...newFeeds]);
            } else if (tabType === "pinned") {
              setPinnedFeeds((prev) => [...prev, ...newFeeds]);
            } else if (tabType === "draft") {
              setDraftFeeds((prev) => [...prev, ...newFeeds]);
            }
            setTabFeedsPage(nextPage);
          }

          // Check if we've reached the last page
          const lastPage = res?.payload?.data?.last_page || 1;
          if (nextPage >= lastPage) {
            setTabFeedsHasMore(false);
          }

          setLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
      });
  };

  const onChangeTabs = (key) => {
    setTabType(key);
    setTabFeedsPage(1);
    setTabFeedsHasMore(true);
    setTabChangeLoading(true); // Set tab change loading to true

    // Don't reset the data arrays immediately
    // We'll update them only after the new data arrives

    const params = {
      type: key,
      page: "1",
      per_page: "10",
    };

    dispatch(fetchAllFeeds(params)).then((res) => {
      if (res?.payload?.meta?.status === 200) {
        const feeds = res?.payload?.data?.feeds || [];
        const lastPage = res?.payload?.data?.last_page || 1;

        if (key === "published") {
          setPublishedFeeds(feeds);
        } else if (key === "pinned") {
          setPinnedFeeds(feeds);
        } else if (key === "draft") {
          setDraftFeeds(feeds);
        }

        if (lastPage <= 1) {
          setTabFeedsHasMore(false);
        }

        setTabChangeLoading(false); // Set loading to false after data is received
      }
    });
  };

  const onClickCreateNewPost = () => {
    setIsOpenNewChatModal(true);
  };

  const normalizeFeedStatus = (feed) => {
    if (!feed) return feed;

    let normalizedStatus = feed.status;

    // Convert number status to string
    if (feed.status === 1) {
      normalizedStatus = "Published";
    } else if (feed.status === 2) {
      normalizedStatus = "Draft";
    } else if (feed.status === 3) {
      normalizedStatus = "Scheduled";
    }

    return {
      ...feed,
      status: normalizedStatus,
    };
  };

  // Complete handleFeedUpdate function:
  const handleFeedUpdate = (feedId, action, updatedFeed = null) => {
    // Normalize the updated feed if it exists
    const normalizedUpdatedFeed = updatedFeed
      ? normalizeFeedStatus(updatedFeed)
      : null;

    // Handle deletion - remove from all feed lists
    if (action === "deleted") {
      setAllFeeds((prevFeeds) =>
        prevFeeds.filter((feed) => feed?.id !== feedId)
      );
      setPublishedFeeds((prevFeeds) =>
        prevFeeds.filter((feed) => feed?.id !== feedId)
      );
      setPinnedFeeds((prevFeeds) =>
        prevFeeds.filter((feed) => feed?.id !== feedId)
      );
      setDraftFeeds((prevFeeds) =>
        prevFeeds.filter((feed) => feed?.id !== feedId)
      );
      // Also remove from search results
      setSearchResults((prevFeeds) =>
        prevFeeds.filter((feed) => feed?.id !== feedId)
      );
      return;
    }

    // Handle scheduling - update feed status in draft list
    if (action === "scheduled" && normalizedUpdatedFeed) {
      // Update the feed in draft feeds list with scheduled status
      setDraftFeeds((prevFeeds) =>
        prevFeeds.map((feed) =>
          feed?.id === feedId ? { ...feed, ...normalizedUpdatedFeed } : feed
        )
      );

      // Also update in all feeds list
      setAllFeeds((prevFeeds) =>
        prevFeeds.map((feed) =>
          feed?.id === feedId ? { ...feed, ...normalizedUpdatedFeed } : feed
        )
      );

      // Update in search results if searching
      setSearchResults((prevFeeds) =>
        prevFeeds.map((feed) =>
          feed?.id === feedId ? { ...feed, ...normalizedUpdatedFeed } : feed
        )
      );

      return;
    }

    // Remove feed from draft section when published
    if (action === "published") {
      setDraftFeeds((prevFeeds) =>
        prevFeeds.filter((feed) => feed?.id !== feedId)
      );
    }

    // Handle editing - update feed in all relevant lists
    if (action === "edited" && normalizedUpdatedFeed) {
      // Update feed in all feeds list
      setAllFeeds((prevFeeds) =>
        prevFeeds.map((feed) =>
          feed?.id === feedId ? { ...feed, ...normalizedUpdatedFeed } : feed
        )
      );

      // Update feed in published feeds list if it's published
      if (
        normalizedUpdatedFeed.status === "Published" ||
        normalizedUpdatedFeed.status === 1
      ) {
        setPublishedFeeds((prevFeeds) =>
          prevFeeds.map((feed) =>
            feed?.id === feedId ? { ...feed, ...normalizedUpdatedFeed } : feed
          )
        );
      }

      // Update feed in pinned feeds list if it's pinned
      if (normalizedUpdatedFeed.is_pinned === true) {
        setPinnedFeeds((prevFeeds) => {
          const existingIndex = prevFeeds.findIndex(
            (feed) => feed?.id === feedId
          );
          if (existingIndex !== -1) {
            return prevFeeds.map((feed) =>
              feed?.id === feedId ? { ...feed, ...normalizedUpdatedFeed } : feed
            );
          } else {
            return [normalizedUpdatedFeed, ...prevFeeds];
          }
        });
      } else {
        setPinnedFeeds((prevFeeds) =>
          prevFeeds.filter((feed) => feed?.id !== feedId)
        );
      }

      // Update feed in draft feeds list if it's a draft or scheduled
      if (
        normalizedUpdatedFeed.status === "Draft" ||
        normalizedUpdatedFeed.status === 2 ||
        normalizedUpdatedFeed.status === "Scheduled" ||
        normalizedUpdatedFeed.status === 3
      ) {
        setDraftFeeds((prevFeeds) => {
          const existingIndex = prevFeeds.findIndex(
            (feed) => feed?.id === feedId
          );
          if (existingIndex !== -1) {
            return prevFeeds.map((feed) =>
              feed?.id === feedId ? { ...feed, ...normalizedUpdatedFeed } : feed
            );
          } else {
            return [normalizedUpdatedFeed, ...prevFeeds];
          }
        });
      }

      // Update in search results if searching
      setSearchResults((prevFeeds) =>
        prevFeeds.map((feed) =>
          feed?.id === feedId ? { ...feed, ...normalizedUpdatedFeed } : feed
        )
      );

      return;
    }

    // If published, add feed to published section and remove from draft
    if (action === "published") {
      if (tabType === "published") {
        const params = {
          type: "published",
          page: "1",
          per_page: "10",
        };

        dispatch(fetchAllFeeds(params)).then((res) => {
          if (res?.payload?.meta?.status === 200) {
            const feeds = res?.payload?.data?.feeds || [];
            const normalizedFeeds = feeds.map((feed) =>
              normalizeFeedStatus(feed)
            );
            setPublishedFeeds(normalizedFeeds);
          }
        });
      }

      const paramsAll = {
        type: "all",
        page: "1",
        per_page: "10",
      };

      dispatch(fetchAllFeeds(paramsAll)).then((res) => {
        if (res?.payload?.meta?.status === 200) {
          const feeds = res?.payload?.data?.feeds || [];
          const normalizedFeeds = feeds.map((feed) =>
            normalizeFeedStatus(feed)
          );
          setAllFeeds(normalizedFeeds);
          setAllFeedsPage(1);

          const lastPage = res?.payload?.data?.last_page || 1;
          setAllFeedsHasMore(lastPage > 1);
        }
      });

      // Refresh search results if searching
      if (isSearching && searchValue.trim()) {
        performSearch(searchValue);
      }
    }

    // Handle pin/unpin case
    if (action === "pinned" && normalizedUpdatedFeed) {
      setAllFeeds((prevFeeds) =>
        prevFeeds.map((feed) =>
          feed?.id === feedId ? { ...feed, ...normalizedUpdatedFeed } : feed
        )
      );

      setPublishedFeeds((prevFeeds) =>
        prevFeeds.map((feed) =>
          feed?.id === feedId ? { ...feed, ...normalizedUpdatedFeed } : feed
        )
      );

      if (normalizedUpdatedFeed.is_pinned === true) {
        const feedExists = pinnedFeeds.some((feed) => feed?.id === feedId);

        if (!feedExists) {
          const feedToAdd =
            allFeeds.find((feed) => feed?.id === feedId) ||
            publishedFeeds.find((feed) => feed?.id === feedId);

          if (feedToAdd) {
            const completeUpdatedFeed = normalizeFeedStatus({ ...feedToAdd, ...normalizedUpdatedFeed });
            setPinnedFeeds((prevFeeds) => [completeUpdatedFeed, ...prevFeeds]);
          }
        } else {
          setPinnedFeeds((prevFeeds) =>
            prevFeeds.map((feed) =>
              feed?.id === feedId ? { ...feed, ...normalizedUpdatedFeed } : feed
            )
          );
        }
      } else if (normalizedUpdatedFeed.is_pinned === false) {
        setPinnedFeeds((prevFeeds) =>
          prevFeeds.filter((feed) => feed?.id !== feedId)
        );
      }

      // Update in search results if searching
      setSearchResults((prevFeeds) =>
        prevFeeds.map((feed) =>
          feed?.id === feedId ? { ...feed, ...normalizedUpdatedFeed } : feed
        )
      );

      if (tabType === "pinned") {
        const params = {
          type: "pinned",
          page: "1",
          per_page: "10",
        };

        dispatch(fetchAllFeeds(params)).then((res) => {
          if (res?.payload?.meta?.status === 200) {
            const feeds = res?.payload?.data?.feeds || [];
            const normalizedFeeds = feeds.map(feed => normalizeFeedStatus(feed));
            setPinnedFeeds(normalizedFeeds);
          }
        });
      }
    }

    // For other updates like likes and comments
    if (action === "liked" || action === "commented") {
      if (normalizedUpdatedFeed) {
        setAllFeeds((prevFeeds) =>
          prevFeeds.map((feed) =>
            feed?.id === feedId ? { ...feed, ...normalizedUpdatedFeed } : feed
          )
        );

        setPublishedFeeds((prevFeeds) =>
          prevFeeds.map((feed) =>
            feed?.id === feedId ? { ...feed, ...normalizedUpdatedFeed } : feed
          )
        );

        setPinnedFeeds((prevFeeds) =>
          prevFeeds.map((feed) =>
            feed?.id === feedId ? { ...feed, ...normalizedUpdatedFeed } : feed
          )
        );

        setDraftFeeds((prevFeeds) =>
          prevFeeds.map((feed) =>
            feed?.id === feedId ? { ...feed, ...normalizedUpdatedFeed } : feed
          )
        );

        // Update in search results if searching
        setSearchResults((prevFeeds) =>
          prevFeeds.map((feed) =>
            feed?.id === feedId ? { ...feed, ...normalizedUpdatedFeed } : feed
          )
        );
      }
    }
  };

  const renderTabFeeds = (type) => {
    let feeds = [];
    if (type === "published") {
      feeds = publishedFeeds;
    } else if (type === "pinned") {
      feeds = pinnedFeeds;
    } else if (type === "draft") {
      feeds = draftFeeds;
    }

    // Show loading indicator during tab change
    if (tabChangeLoading) {
      return (
        <div className="text-center p-4 flex justify-center items-center h-full">
          <Spin></Spin>
        </div>
      );
    }

    // Only show Empty when we're not loading and there's no data
    if (feeds.length === 0) {
      return (
        <div className="flex justify-center items-center h-full">
          <Empty
            description={
              type === "draft"
                ? "No Draft Feed"
                : type === "pinned"
                ? "No Pinned Feed"
                : type === "published"
                ? "No My Feed"
                : "No Feeds"
            }
          />
        </div>
      );
    }

    return feeds.map((feed, index) => {
      if (feeds.length === index + 1) {
        return (
          <div ref={lastTabFeedElementRef} key={feed?.id}>
            <FeedCard
              type={type}
              feedData={feed}
              onFeedUpdate={handleFeedUpdate}
            />
          </div>
        );
      } else {
        return (
          <FeedCard
            key={feed?.id}
            type={type}
            feedData={feed}
            onFeedUpdate={handleFeedUpdate}
          />
        );
      }
    });
  };

  // Render search results
  const renderSearchResults = () => {
    if (searchLoading && searchResults.length === 0) {
      return (
        <div className="text-center p-4 h-full flex justify-center items-center">
          <Spin />
        </div>
      );
    }

    if (searchResults.length === 0 && !searchLoading) {
      return (
        <div className="h-[50vh] flex justify-center items-center">
          <Empty description="No Search Results Found" />
        </div>
      );
    }

    return (
      <>
        {searchResults.map((feed, index) => {
          if (searchResults.length === index + 1) {
            return (
              <div ref={lastSearchElementRef} key={feed.id}>
                <FeedCard
                  key={feed.id}
                  type="all"
                  feedData={feed}
                  onFeedUpdate={handleFeedUpdate}
                />
              </div>
            );
          } else {
            return (
              <FeedCard
                key={feed.id}
                type="all"
                feedData={feed}
                onFeedUpdate={handleFeedUpdate}
              />
            );
          }
        })}
        {searchLoading && searchResults.length > 0 && (
          <div className="text-center p-4">Loading more...</div>
        )}
      </>
    );
  };

  const items = [
    {
      key: "published",
      label: "My Posts",
      children: (
        <div
          className="myPostContainer px-5 overflow-x-hidden"
          style={{
            height:
              window.innerWidth < 768
                ? "calc(100vh - 412px)"
                : "calc(100vh - 460px)",
            overflowY: "auto",
            scrollbarGutter: "stable both-edges",
          }}
        >
          {renderTabFeeds("published")}
          {loading && tabType === "published" && (
            <div className="text-center p-4">{/* Loading more... */}</div>
          )}
        </div>
      ),
    },
    {
      key: "pinned",
      label: "Pinned",
      children: (
        <div
          className="pinnedContainer px-5 overflow-x-hidden"
          style={{
            height:
              window.innerWidth < 768
                ? "calc(100vh - 412px)"
                : "calc(100vh - 460px)",
            overflowY: "auto",
            scrollbarGutter: "stable both-edges",
          }}
        >
          {renderTabFeeds("pinned")}
          {loading && tabType === "pinned" && (
            <div className="text-center p-4">{/* Loading more... */}</div>
          )}
        </div>
      ),
    },
    {
      key: "draft",
      label: "Draft",
      children: (
        <div
          className="draftContainer px-5 overflow-x-hidden"
          style={{
            height:
              window.innerWidth < 768
                ? "calc(100vh - 412px)"
                : "calc(100vh - 460px)",
            overflowY: "auto",
            scrollbarGutter: "stable both-edges",
          }}
        >
          {renderTabFeeds("draft")}
          {loading && tabType === "draft" && (
            <div className="text-center p-4">{/* Loading more... */}</div>
          )}
        </div>
      ),
    },
  ];

  // Initial data fetch for all feeds
  useEffect(() => {
    const params = {
      type: "all",
      page: "1",
      per_page: "10",
    };

    dispatch(fetchAllFeeds(params)).then((res) => {
      if (res?.payload?.meta?.status === 200) {
        const feeds = res?.payload?.data?.feeds || [];
        const lastPage = res?.payload?.data?.last_page || 1;

        setAllFeeds(feeds);

        if (lastPage <= 1) {
          setAllFeedsHasMore(false);
        }
      }
    });
  }, [dispatch]);

  // Initial data fetch for tab feeds
  useEffect(() => {
    const params = {
      type: tabType,
      page: "1",
      per_page: "10",
    };

    setTabChangeLoading(true);

    dispatch(fetchAllFeeds(params)).then((res) => {
      if (res?.payload?.meta?.status === 200) {
        const feeds = res?.payload?.data?.feeds || [];
        const lastPage = res?.payload?.data?.last_page || 1;

        if (tabType === "published") {
          setPublishedFeeds(feeds);
        } else if (tabType === "pinned") {
          setPinnedFeeds(feeds);
        } else if (tabType === "draft") {
          setDraftFeeds(feeds);
        }

        if (lastPage <= 1) {
          setTabFeedsHasMore(false);
        }

        setTabChangeLoading(false);
      }
    });
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [searchDebounceTimer]);

  return (
    <Row className="">
      <NewPostModal
        isOpenNewChatModal={isOpenNewChatModal}
        setIsOpenNewChatModal={setIsOpenNewChatModal}
        setCreatedPostResponse={setCreatedPostResponse}
      />

      <Col
        xs={24}
        md={24}
        lg={8}
        className={`${
          feedMobileDrawer ? "block" : "hidden"
        } border-r-[1px] border-solid border-[#373737]`}
      >
        <div
          className=" flex-1 bg-darkGray rounded-full border border-solid border-liteGray my-1 flex md:hidden items-center justify-between px-4 py-2  md:px-4 md:py-4 text-grayText"
          onClick={onClickCreateNewPost}
        >
          <Text type="secondary">Create New Post</Text>
          <i
            className={`icon-send before:!m-0 text-2xl md:text-5xl text-primary`}
          />
        </div>
        <div
          className="p-4 m-6 hidden md:block bg-liteGrayV1 rounded-2xl border border-solid border-liteGray cursor-pointer"
          onClick={onClickCreateNewPost}
        >
          <div className="hidden md:flex gap-4">
            <div>
              {userForEdit?.user?.profile_photo_path ? (
                <Avatar
                  src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                    userForEdit?.user?.profile_photo_path
                  }`}
                  size={64}
                  className="object-cover rounded-full"
                ></Avatar>
              ) : (
                <Avatar
                  style={{ backgroundColor: "#fde3cf", color: "#f56a00" }}
                  size={64}
                  className="object-cover rounded-full !text-[32px]"
                >
                  {userForEdit?.user?.name[0]}
                </Avatar>
              )}
            </div>
            <div className="flex-1 bg-darkGray rounded-full border border-solid border-liteGray my-1 flex items-center px-4 text-grayText">
              Create New Post
            </div>
          </div>
          <div className="hidden md:flex mt-6">
            <div className="flex items-center mr-7">
              <i className={`icon-photo before:!m-0  text-grayText text-3xl`} />
              <Text className="text-sm ml-1">Photo</Text>
            </div>

            <div className="flex items-center mr-7">
              <i className={`icon-video before:!m-0  text-grayText text-3xl`} />
              <Text className="text-sm ml-1">Video</Text>
            </div>

            <div className="flex items-center mr-7">
              <i className={`icon-emoji before:!m-0  text-grayText text-3xl`} />
              <Text className="text-sm ml-1">Emoji</Text>
            </div>
          </div>
        </div>
        <Divider className="m-0" />
        <div>
          <Tabs
            defaultActiveKey="published"
            items={items}
            onChange={onChangeTabs}
            size="large"
            className="feedTab w-full"
          />
        </div>
      </Col>

      <Col
        xs={24}
        md={24}
        lg={16}
        className={`${
          feedMobileDrawer && window.innerWidth < 768 ? "hidden" : "block"
        } p-6 pb-0 `}
      >
        {/* Progress section - only show when progressing is true */}
        {progressData?.progressing && (
          <div className="w-full bg-liteGrayV1 rounded-2xl border border-solid border-liteGray p-3 mb-7">
            <div className="font-semibold">
              Feed Uploading
              {/* : {progressData?.processed_feeds || 0}/{progressData?.total_feeds || 0} */}
            </div>
            <span className="feedLoader"></span>
          </div>
        )}

        <div
          className=" overflow-x-hidden feedContainer"
          style={{
            height:
              window.innerWidth < 768
                ? "calc(100vh - 212px)"
                : "calc(100vh - 200px)",
            overflowY: "auto",
            scrollbarGutter: "stable both-edges",
          }}
        >
          <div className="sticky top-0 z-40 w-full bg-[#1e1e1e] pb-5">
            <Input
              size="large"
              prefix={
                <SearchOutlined className="absolute left-4 top-1/2 text-xl transform -translate-y-1/2 text-grayText" />
              }
              placeholder="Search Feed"
              className="bg-[#171717] border-[#373737] rounded-full pl-10"
              style={{ width: "100%" }}
              onChange={onChangeRoleSearch}
              value={searchValue}
              allowClear
            />
          </div>

          {location?.state?.originalData?.reference?.feed_id ? (
            <>
              {singleFeedLoading ? (
                <div className="text-center p-4 h-full flex justify-center items-center">
                  <Spin></Spin>
                </div>
              ) : singleFeedData ? (
                <div className="pb-28">
                  <FeedCard
                    key={singleFeedData.id}
                    type="all"
                    feedData={singleFeedData}
                    onFeedUpdate={handleFeedUpdate}
                  />
                </div>
              ) : null}
            </>
          ) : isSearching ? (
            // Show search results when searching
            <div className="pb-28">
              {renderSearchResults()}
            </div>
          ) : (
            // Show normal feeds when not searching
            <>
              {loading && allFeeds.length === 0 ? (
                <div className="text-center p-4 h-full flex justify-center items-center">
                  <Spin></Spin>
                </div>
              ) : allFeeds.length === 0 ? (
                <div className="h-full flex justify-center items-center">
                  <Empty description="No Posts to Display" />
                </div>
              ) : (
                allFeeds.map((feed, index) => {
                  if (allFeeds.length === index + 1) {
                    return (
                      <div ref={lastAllFeedElementRef} key={feed.id}>
                        <FeedCard
                          key={feed.id}
                          type="all"
                          feedData={feed}
                          onFeedUpdate={handleFeedUpdate}
                        />
                      </div>
                    );
                  } else {
                    return (
                      <FeedCard
                        key={feed.id}
                        type="all"
                        feedData={feed}
                        onFeedUpdate={handleFeedUpdate}
                      />
                    );
                  }
                })
              )}
              {loading && allFeeds.length > 0 && (
                <div className="text-center p-4">Loading more...</div>
              )}
            </>
          )}
        </div>
      </Col>
    </Row>
  );
};

export default Feed;
