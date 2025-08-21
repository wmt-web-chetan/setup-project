// Fixed version of the component with scrolling issues addressed
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Row, Col, Typography, Button, Image, Spin, Modal } from "antd";
import {
  ArrowLeftOutlined,
  EyeOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import "./MediaDocsLinks.scss";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserMediaDetails } from "../../../../../services/Store/Chat/action";
// import { fetchDownloadFile } from "../../../../../services/Store/DownloadFile/action";

const { Text } = Typography;

const MediaDocsLinks = ({ onClose, windowWidth, activeTab, activeItem }) => {
  // Using consistent tab keys to avoid confusion
  const [activeMediaTab, setActiveMediaTab] = useState("media");

  // Separate state for each content type
  const [mediaItems, setMediaItems] = useState([]);
  const [documentItems, setDocumentItems] = useState([]);
  const [linkItems, setLinkItems] = useState([]);

  // Add state for media preview modal
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPage: 1,
    totalRecords: 0,
    perPage: 18,
  });

  // Add state for infinite scrolling
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreContent, setHasMoreContent] = useState(true);

  const contentRef = useRef(null);
  const dispatch = useDispatch();

  const { userForEdit } = useSelector((state) => state?.usersmanagement);

  // Open media preview modal
  const openMediaPreview = (media) => {
    setSelectedMedia(media);
    setPreviewVisible(true);
  };

  // Close media preview modal
  const closeMediaPreview = () => {
    setPreviewVisible(false);
    setSelectedMedia(null);
  };

  // Map content type to state setter function - Fixed to match tab keys
  const getContentSetter = (contentType) => {
    switch (contentType) {
      case "media":
        return setMediaItems;
      case "document":
        return setDocumentItems;
      case "link":
        return setLinkItems;
      default:
        return setMediaItems;
    }
  };

  // Get current items based on active tab - Fixed to align with tab keys
  const getCurrentItems = () => {
    switch (activeMediaTab) {
      case "media":
        return mediaItems;
      case "docs":
        return documentItems; // 'docs' tab displays documentItems
      case "links":
        return linkItems;
      default:
        return [];
    }
  };

  // Map activeMediaTab to API content_type parameter
  const getContentType = () => {
    switch (activeMediaTab) {
      case "media":
        return "media";
      case "docs":
        return "document"; // 'docs' tab uses 'document' content type
      case "links":
        return "link";
      default:
        return "media";
    }
  };

  // Map API content_type to response key
  const getResponseKey = (contentType) => {
    switch (contentType) {
      case "media":
        return "media";
      case "document":
        return "documents"; // API returns 'documents' for 'document' content type
      case "link":
        return "links";
      default:
        return "media";
    }
  };

  // Create a fetchMedia function that can be reused for initial and additional loads
  const fetchMedia = useCallback(
    (page = 1, shouldAppend = false) => {
      // Replace the existing source determination logic with this:
      const source = activeItem?.id
        ? activeTab === "chatRoom"
          ? { chat_room_id: activeItem.id }
          : activeTab === "chat"
          ? { user_id: activeItem.id }
          : null
        : null;

      if (!source) {
        setLoading(false);
        setIsLoadingMore(false);
        return;
      }

      const contentType = getContentType();
      const setItems = getContentSetter(contentType);

      const params = {
        ...source,
        page: page,
        per_page: pagination.perPage,
        content_type: contentType,
      };


      if (page === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      dispatch(fetchUserMediaDetails(params))
        .then((response) => {
          // Check if we have a successful response with the expected structure
          if (response?.payload?.meta?.success === true) {
            // Get only the content for the current tab
            const responseKey = getResponseKey(contentType);

            const newItems = response.payload.data.content[responseKey] || [];

            // Update pagination info if available
            if (response.payload.data.pagination) {
              const paginationData = response.payload.data.pagination;
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
            if (shouldAppend) {
              setItems((prevItems) => [...prevItems, ...newItems]);
            } else {
              // Otherwise, replace the existing data
              setItems(newItems);
            }
          } else {
            console.error(
              "Error fetching media details:",
              response?.payload?.meta?.message
            );
          }

          setLoading(false);
          setIsLoadingMore(false);
        })
        .catch((error) => {
          console.error("Error fetching media details:", error);
          setLoading(false);
          setIsLoadingMore(false);
        });
    },
    [
      activeTab,
      activeItem?.id,
      userForEdit?.user?.id,
      dispatch,
      pagination.perPage,
      activeMediaTab,
    ]
  );

  // Handle scroll event for infinite scrolling - IMPROVED to fix scrolling issue
  const handleScroll = useCallback(() => {
    if (!contentRef.current || isLoadingMore || !hasMoreContent) return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;

    // FIXED: Increased scroll detection threshold to fetch content earlier
    // Now loads more content when 500px from the bottom (was 300px)
    // This ensures content loads much earlier before reaching the bottom
    if (scrollHeight - scrollTop - clientHeight < 500) {
      const nextPage = pagination.currentPage + 1;
      fetchMedia(nextPage, true);
    }
  }, [isLoadingMore, hasMoreContent, pagination.currentPage, fetchMedia]);

  useEffect(() => {
    // Initial load of data
    setPagination((prev) => ({
      ...prev,
      currentPage: 1,
    }));
    setHasMoreContent(true);
    fetchMedia(1, false);

    // Reset scroll position when activeMediaTab changes
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [
    activeMediaTab,
    activeTab,
    activeItem?.id,
    userForEdit?.user?.id,
    fetchMedia,
  ]);

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

  // Group items by date (using the created_at field)
  const groupByDate = (items) => {
    const grouped = {};

    items.forEach((item) => {
      // Convert the ISO date to a readable format (Today, Yesterday, or actual date)
      const itemDate = new Date(item.created_at);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      let dateLabel;
      if (itemDate.toDateString() === today.toDateString()) {
        dateLabel = "Today";
      } else if (itemDate.toDateString() === yesterday.toDateString()) {
        dateLabel = "Yesterday";
      } else {
        dateLabel = itemDate.toLocaleDateString();
      }

      if (!grouped[dateLabel]) {
        grouped[dateLabel] = [];
      }
      grouped[dateLabel].push(item);
    });

    return grouped;
  };

  // Get grouped data for the current tab
  const getGroupedDataForCurrentTab = () => {
    return groupByDate(getCurrentItems());
  };

  // Function to download a file using direct API call
  const downloadFile = async (url, fileName, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!url) {
      console.error("No file URL provided for download");
      return;
    }

    // Construct full URL if needed
    const isInternalUrl =
      url.startsWith(import.meta.env.VITE_IMAGE_BASE_URL) ||
      !url.startsWith("http");

    const fullUrl =
      isInternalUrl && !url.startsWith("http")
        ? `${import.meta.env.VITE_IMAGE_BASE_URL}/${url}`
        : url;

    try {
      // Create download link directly to the API endpoint
      const downloadApiUrl = `${import.meta.env.VITE_API_URL}/download-file?url=${encodeURIComponent(fullUrl)}`;
      
      // Get user token for authorization
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = user?.token;

      // Create a temporary link element and trigger download
      const link = document.createElement("a");
      link.href = downloadApiUrl;
      link.download = fileName || "download";
      
      // Add authorization header if token exists
      if (token) {
        // For direct download, we can't set headers, so we'll use fetch instead
        const response = await fetch(downloadApiUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          
          link.href = blobUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up blob URL
          window.URL.revokeObjectURL(blobUrl);
        } else {
          console.error("Download failed:", response.statusText);
        }
      } else {
        // If no token, try direct link
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  // Updated renderMediaGrid function with video tags and in-screen preview
  const renderMediaGrid = (items) => {
    return (
      <Row gutter={[10, 10]} className="media-grid">
        {items?.map((item) => (
          <Col key={item.id} xs={8} sm={8} className="media-item-col">
            <div className="media-item relative group">
              {item.content_type === "video" ? (
                // Video content with video tag
                <div className="video-container h-full relative rounded-lg overflow-hidden">
                  <video
                    src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                      item.file_path
                    }`}
                    className="w-full h-full object-cover rounded-lg"
                    // poster={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                    //   item.thumbnail_url
                    // }`}
                    preload="metadata"
                  />

                  {/* Play overlay (always visible) */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      type="primary"
                      shape="circle"
                      size="small"
                      icon={
                        <i
                          className="icon-play text-white pl-1"
                          style={{ fontSize: "16px" }}
                        />
                      }
                      className="flex justify-center items-center p-3 !px-3 borderbtn"
                    />
                  </div>

                  {/* Action overlay (visible on hover) */}
                  <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="small"
                      type="primary"
                      shape="circle"
                      className="mr-2"
                      icon={<i className="icon-download" />}
                      onClick={(e) =>
                        downloadFile(
                          `${import.meta.env.VITE_IMAGE_BASE_URL}/${
                            item.file_path
                          }`,
                          item.file_name,
                          e
                        )
                      }
                    />

                    <Button
                      size="small"
                      type="primary"
                      shape="circle"
                      icon={<EyeOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        openMediaPreview(item);
                      }}
                    />
                  </div>
                </div>
              ) : (
                // Image content
                <div className="image-container h-full relative">
                  <Image
                    src={
                      item.thumbnail_url
                        ? `${import.meta.env.VITE_IMAGE_BASE_URL}/${
                            item.thumbnail_url
                          }`
                        : `${import.meta.env.VITE_IMAGE_BASE_URL}/${
                            item.file_path
                          }`
                    }
                    alt={item.file_name}
                    className="rounded-lg"
                    preview={false} // Disable default preview
                  />
                  {/* Action overlay (visible on hover) */}
                  <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="small"
                      type="primary"
                      shape="circle"
                      className="mr-2"
                      icon={<i className="icon-download" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFile(
                          `${import.meta.env.VITE_IMAGE_BASE_URL}/${
                            item.file_path
                          }`,
                          item.file_name
                        );
                      }}
                    />
                    <Button
                      size="small"
                      type="primary"
                      shape="circle"
                      icon={<EyeOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        openMediaPreview(item);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </Col>
        ))}
      </Row>
    );
  };

  const renderDocsList = (items) => {
    return (
      <div className="docs-list docs-container">
        {items.map((item) => {
          const fileExtension =
            item.file_name?.split(".")?.pop()?.toLowerCase() || "doc";
          let iconClass = "icon-pdf"; // Default icon

          // Determine the icon based on file extension or mime type
          if (fileExtension === "pdf" || item.mime_type?.includes("pdf")) {
            iconClass = "icon-pdf";
          } else if (
            fileExtension === "csv" ||
            item.mime_type?.includes("csv")
          ) {
            iconClass = "icon-csv";
          } else if (
            ["doc", "docx"].includes(fileExtension) ||
            item.mime_type?.includes("word")
          ) {
            iconClass = "icon-documents";
          } else if (
            ["jpg", "jpeg", "png"].includes(fileExtension) ||
            item.mime_type?.includes("image")
          ) {
            iconClass = "icon-jpg";
          }

          // Calculate file size display
          const fileSize = item.file_size
            ? `${(item.file_size / 1024).toFixed(2)} KB`
            : "N/A";

          // Get the download URL
          const downloadUrl = `${import.meta.env.VITE_IMAGE_BASE_URL}/${
            item.file_path
          }`;

          return (
            <div
              key={item.id}
              className="doc-item bg-liteGray p-3 rounded-2xl mb-2 flex items-center"
            >
              <div className="doc-icon bg-[#2c2c2c] sm:py-1 rounded-lg mr-2 flex-shrink-0">
                <i className={`${iconClass} text-3xl sm:text-3xl`}></i>
              </div>

              <div className="flex justify-between w-full items-center overflow-hidden">
                <div className="doc-info mr-2 overflow-hidden flex-1">
                  <Text
                    className="text-white block truncate"
                    title={item.file_name}
                  >
                    {item.file_name}
                  </Text>
                  <div className="flex gap-1 items-center">
                    <Text className="text-grayText text-xs whitespace-nowrap">
                      {fileSize}
                    </Text>
                    {/* <div className="w-1 h-1 rounded-full bg-[#989898] flex-shrink-0"></div>
                    <Text className="text-grayText text-xs whitespace-nowrap">
                      {new Date(item.created_at).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </Text> */}
                  </div>
                </div>

                <Button
                  size="middle"
                  className="bg-darkGray flex-shrink-0"
                  type="text"
                  shape="circle"
                  icon={<i className="icon-download" />}
                  onClick={(e) => downloadFile(downloadUrl, item.file_name, e)}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  const renderLinksList = (items) => {
    return (
      <div className="links-list links-container">
        {items.map((item, index) => {
          // For link items, some fields might be null
          const linkId = item.id || `link-${index}`;
          const linkUrl = item?.file_path
          const linkTitle =
            item?.title ||
            (item?.file_name && item?.file_name?.length > 30
              ? item.file_name.substring(0, 30) + "..."
              : item.file_name) ||
            "Link";

          // Function to open link in new tab
          const openLink = (e) => {
            e.stopPropagation(); // Prevent duplicate opens
            window.open(linkUrl, "_blank");
          };

          const isLastItem = index === items.length - 1;

          return (
            <div
              key={linkId}
              className={`link-item bg-liteGray p-3 rounded-lg mb-2 flex cursor-pointer hover:bg-[#303030] transition-colors ${
                isLastItem ? "last-link-item" : ""
              }`}
              onClick={openLink}
            >
              <div className="link-icon bg-[#2c2c2c] rounded-lg mr-2 flex-shrink-0">
                <i className="icon-link text-white text-3xl sm:text-3xl"></i>
              </div>
              <div className="flex-1 min-w-0 overflow-hidden flex justify-between items-start">
                <div className="mr-2 overflow-hidden flex-1">
                  <Text className="text-white block truncate" title={linkTitle}>
                    {linkTitle}
                  </Text>
                  <Text
                    className="text-[#5A76FF] text-sm block truncate"
                    title={linkUrl}
                  >
                    {linkUrl}
                  </Text>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  // Handle tab change
  const handleTabChange = (key) => {
    setActiveMediaTab(key);
    // Reset pagination when switching tabs
    setPagination((prev) => ({
      ...prev,
      currentPage: 1,
    }));
    setHasMoreContent(true);

    // Reset scroll position
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  };

  // Helper to render content based on active tab
  const renderContent = () => {
    if (loading && !isLoadingMore) {
      return (
        <div className="loading-container flex justify-center items-center h-full">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        </div>
      );
    }

    const items = getCurrentItems();

    const groupedData = getGroupedDataForCurrentTab();
    const isEmpty = items.length === 0;

    if (isEmpty) {
      return (
        <div className="empty-state text-center py-8">
          <Text className="text-grayText">
            No{" "}
            {activeMediaTab === "media"
              ? "media"
              : activeMediaTab === "docs"
              ? "documents"
              : "links"}{" "}
            found
          </Text>
        </div>
      );
    }

    return (
      <>
        {Object.entries(groupedData).map(([date, dateItems]) => (
          <div key={date} className="date-group mb-4">
            <Text className="text-grayText text-xs mb-2 block">{date}</Text>
            {activeMediaTab === "media" && renderMediaGrid(dateItems)}
            {activeMediaTab === "docs" && renderDocsList(dateItems)}
            {activeMediaTab === "links" && renderLinksList(dateItems)}
          </div>
        ))}

        {/* Loading indicator for additional content */}
        {isLoadingMore && (
          <div className="flex justify-center items-center py-4">
            <Spin
              indicator={<LoadingOutlined style={{ fontSize: 20 }} spin />}
            />
          </div>
        )}

        {/* ADDED: Custom bottom padding based on active tab - significantly increased for links */}
        <div
          className={`content-bottom-padding ${
            activeMediaTab === "docs"
              ? "pb-32"
              : activeMediaTab === "links"
              ? "pb-48"
              : "pb-16"
          }`}
        ></div>
      </>
    );
  };

  // Render Media Preview Modal
  const renderMediaPreviewModal = () => {
    if (!selectedMedia) return null;

    return (
      <Modal
        visible={previewVisible}
        onCancel={closeMediaPreview}
        footer={null}
        width="80%"
        centered
        className="media-preview-modal"
        closeIcon={
          <Button
            shape="circle"
            icon={<i className="icon-close before:!m-0 text-sm" />}
          />
        }
      >
        <div className="flex justify-center items-center bg-gray p-4">
          {selectedMedia.content_type === "video" ? (
            <video
              src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                selectedMedia.file_path
              }`}
              controls
              autoPlay
              className="max-h-[80vh] max-w-full"
            />
          ) : (
            <img
              src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                selectedMedia.file_path
              }`}
              alt={selectedMedia.file_name}
              className="max-h-[80vh] max-w-full object-contain"
            />
          )}
        </div>
        <div className="mt-4 flex justify-between items-center">
          <Text className="text-white">{selectedMedia.file_name}</Text>
          <Button
            type="primary"
            icon={<i className="icon-download" />}
            onClick={(e) =>
              downloadFile(
                `${import.meta.env.VITE_IMAGE_BASE_URL}/${
                  selectedMedia.file_path
                }`,
                selectedMedia.file_name,
                e
              )
            }
          >
            Download
          </Button>
        </div>
      </Modal>
    );
  };

  return (
    <div className="media-docs-links-container bg-gray h-full flex flex-col">
      {/* Header */}
      <Row className="py-2 border-b-[1px] border-solid border-[#373737] items-center">
        <div className="flex items-center h-[71px] px-5">
          <Button
            type="default"
            shape="circle"
            icon={<ArrowLeftOutlined />}
            onClick={onClose}
            className="text-white mr-2 bg-liteGrayV1"
          />
        </div>
      </Row>

      {/* Custom Tabs */}
      <div className="custom-tabs border-b-[1px] border-solid border-[#373737]">
        <div className="flex">
          <div
            className={`tab-item flex-1 text-center py-3 cursor-pointer relative ${
              activeMediaTab === "media" ? "active" : ""
            }`}
            onClick={() => handleTabChange("media")}
          >
            <Text
              className={
                activeMediaTab === "media" ? "text-primary" : "text-grayText"
              }
            >
              Media
            </Text>
            {activeMediaTab === "media" && (
              <div className="tab-indicator"></div>
            )}
          </div>
          <div
            className={`tab-item flex-1 text-center py-3 cursor-pointer relative ${
              activeMediaTab === "docs" ? "active" : ""
            }`}
            onClick={() => handleTabChange("docs")}
          >
            <Text
              className={
                activeMediaTab === "docs" ? "text-primary" : "text-grayText"
              }
            >
              Docs
            </Text>
            {activeMediaTab === "docs" && <div className="tab-indicator"></div>}
          </div>
          <div
            className={`tab-item flex-1 text-center py-3 cursor-pointer relative ${
              activeMediaTab === "links" ? "active" : ""
            }`}
            onClick={() => handleTabChange("links")}
          >
            <Text
              className={
                activeMediaTab === "links" ? "text-primary" : "text-grayText"
              }
            >
              Links
            </Text>
            {activeMediaTab === "links" && (
              <div className="tab-indicator"></div>
            )}
          </div>
        </div>
      </div>

      {/* Content - FIXED: Added scrollable-content class for additional styling */}
      <div
        className={`tab-content p-4 overflow-y-auto scrollable-content ${
          activeMediaTab === "links" ? "links-tab-active" : ""
        }`}
        style={{ height: "calc(100vh - 143px)" }}
        ref={contentRef}
      >
        {renderContent()}
      </div>

      {/* Media Preview Modal */}
      {renderMediaPreviewModal()}
    </div>
  );
};

export default MediaDocsLinks;