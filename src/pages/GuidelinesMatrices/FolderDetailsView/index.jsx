import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Button,
  Col,
  Dropdown,
  Input,
  Row,
  Typography,
  Tree,
  Tooltip,
  message,
  Spin,
  Empty,
  Modal,
  Tabs,
} from "antd";
import {
  SearchOutlined,
  UploadOutlined,
  DeleteOutlined,
  StarFilled,
  EyeOutlined,
} from "@ant-design/icons";
import { Link, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import UploadFileModal from "../UploadFileModal";
import ShadowBoxContainer from "../../../components/AuthLayout/ShadowBoxContainer";
import {
  deleteLoanCategoryFileAction,
  fetchLoanCategoryFolderDetails,
} from "../../../services/Store/GuidelinesMatrices/action";
import { fetchLoanCategories } from "../../../services/Store/LoanCategory/action";
import RecentlyDeleted from "../RecentlyDeleted";
import FileViewerModal from "../FileViewerModal";
import { IMAGE_BASE_URL } from "../../../utils/constant";

const { Text, Title } = Typography;
const { DirectoryTree } = Tree;

const FolderDetailsView = () => {
  const dispatch = useDispatch();
  const params = useParams();
  const location = useLocation();
  
  // Check if we're in admin mode based on current path
  const isAdminMode = location.pathname.includes('/admin/');
  
  const folderId = params?.id || location?.state?.folderId;
  const folderName = location?.state?.folderName || "Folder Details";

  const [containerHeight, setContainerHeight] = useState("calc(100vh - 239px)");
  const [searchValue, setSearchValue] = useState("");
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [selectedTreeKey, setSelectedTreeKey] = useState("all");
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [isDeleteFileModalVisible, setIsDeleteFileModalVisible] =
    useState(false);
  const [isFileViewerModalVisible, setIsFileViewerModalVisible] =
    useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [treeData, setTreeData] = useState([]);
  const [showRecentlyDeleted, setShowRecentlyDeleted] = useState(false);

  // Infinite scroll states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreFiles, setHasMoreFiles] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allFiles, setAllFiles] = useState([]);
  const filesContainerRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // State for filtered files
  const [filteredFiles, setFilteredFiles] = useState([]);

  // Redux state
  const {
    loanCategoryFolderDetails,
    loanCategoryFolderDetailsLoading,
    deleteFileLoading,
  } = useSelector((state) => state?.guidelineMatrices || {});

  const { loanCategories, loanCategoriesLoading } = useSelector(
    (state) => state?.loanCategories || {}
  );

  const { fileUpload } = useSelector(
    (state) => state?.guidelineMatrices || {}
  );

  // Helper functions for dynamic navigation
  const getDashboardLink = () => {
    return isAdminMode ? '/admin' : '/dashboard';
  };

  const getGuidelinesMatricesLink = () => {
    return isAdminMode ? '/admin/guidelines-matrices' : '/guidelines-&-matrices';
  };

  // Modified fetchFolderDetails to work with your existing action
  const fetchFolderDetails = useCallback(
    (page = 1, shouldReplace = true) => {
      if (!folderId) return;

      // Instead of modifying the action, attach query parameters to the URL using URLSearchParams
      const searchParams = new URLSearchParams();
      searchParams.append("page", page);
      searchParams.append("per_page", 5);

      if (searchValue?.length >= 3) {
        searchParams.append("search", searchValue);
      }

      // Create a "fake" modified folderId with query parameters
      // Your backend will need to parse these from the URL
      const folderIdWithParams = `${folderId}?${searchParams.toString()}`;

      if (page > 1) {
        setIsLoadingMore(true);
      }

      // Use the original action as is
      dispatch(fetchLoanCategoryFolderDetails(folderIdWithParams)).then(
        (response) => {
          if (response?.payload?.data?.folder) {
            const newFiles =
              response?.payload?.data?.folder?.folder_items || [];

            // Process files
            const transformedFiles = newFiles.map((file) => {
              // Use file_name from API response directly or extract from file_path
              const fileName =
                file?.file_name ||
                file?.file_path?.split("/")?.pop() ||
                "Unnamed File";
              const fileExtension = fileName?.split(".")?.pop().toLowerCase();

              // Create formatted date
              const createdDate = new Date(file.created_at);
              const formattedDate = createdDate.toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              });

              // Process categories from the new API format
              const categories = [];

              // Check if colorArray exists (new format)
              if (file?.colorArray && file?.colorArray?.length > 0) {
                file?.colorArray?.forEach((cat) => {
                  // Main category
                  if (!cat.sub_name) {
                    categories.push({
                      key: cat?.parent_name,
                      name: cat?.parent_name,
                      color: cat?.main_color,
                      isMainCategory: true,
                    });
                  }
                  // Subcategory
                  else {
                    categories.push({
                      key: `${cat.parent_name}-${cat.sub_name}`,
                      name: cat.sub_name,
                      parentName: cat.parent_name,
                      color: cat.sub_color,
                      parentColor: cat.main_color,
                      isMainCategory: false,
                    });
                  }
                });
              }
              // Fallback to item_categories if available
              else if (
                file?.item_categories &&
                file?.item_categories?.length > 0
              ) {
                file?.item_categories?.forEach((itemCat) => {
                  const cat = itemCat?.loan_category;
                  if (cat) {
                    if (!cat.loan_category_id) {
                      // This is a main category
                      categories.push({
                        key: cat.id,
                        name: cat.name,
                        color: cat.color,
                        isMainCategory: true,
                      });
                    } else {
                      // This is a subcategory
                      categories.push({
                        key: cat.id,
                        name: cat.name,
                        parentId: cat.loan_category_id,
                        color: cat.color,
                        isMainCategory: false,
                      });
                    }
                  }
                });
              }

              // Get the primary category to display (first one)
              const primaryCategory =
                categories?.length > 0 ? categories[0] : null;

              return {
                ...file, // Include all original file properties
                id: file.id,
                name: fileName,
                date: formattedDate,
                type: fileExtension,
                categories: categories,
                primaryCategory: primaryCategory,
                folderId: folderId, // Add folderId to track which folder this file belongs to
              };
            });

            // Update files state
            if (shouldReplace) {
              setAllFiles(transformedFiles);
              filterFiles(transformedFiles, searchValue);
              console.log("here1")
            } else {
              console.log("here2")
              setAllFiles((prevFiles) => [...prevFiles, ...transformedFiles]);
              filterFiles([...allFiles, ...transformedFiles], searchValue);
            }

            // Check if we have more data to load based on the expected page size
            setHasMoreFiles(transformedFiles.length === 20);
            setIsLoadingMore(false);
          }
        }
      );
    },
    [dispatch, folderId, searchValue, allFiles]
  );

  // Reset files when folder ID changes
  useEffect(() => {
    // Clear files when folder changes
    setAllFiles([]);
    setFilteredFiles([]);
    setCurrentPage(1);
    setHasMoreFiles(true);

    if (folderId) {
      fetchFolderDetails(1, true);
      dispatch(fetchLoanCategories({ is_delete: false }));
    }
  }, [dispatch, folderId]);

  // Handle infinite scroll
  const handleScroll = useCallback(
    (e) => {
      if (filesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        // Load more when user scrolls to 80% of the container height
        const scrollThreshold = scrollHeight * 0.8;

        if (
          scrollTop + clientHeight >= scrollThreshold &&
          !isLoadingMore &&
          hasMoreFiles &&
          !loanCategoryFolderDetailsLoading
        ) {
          const nextPage = currentPage + 1;
          setCurrentPage(nextPage);
          fetchFolderDetails(nextPage, false);
        }
      }
    },
    [
      currentPage,
      isLoadingMore,
      hasMoreFiles,
      loanCategoryFolderDetailsLoading,
      fetchFolderDetails,
    ]
  );

  // Generate tree data from loan categories
  useEffect(() => {
    if (loanCategories?.data?.loan_categories?.length > 0) {
      const categories = loanCategories?.data?.loan_categories;
      const initialExpandedKeys = [];

      const formattedTreeData = categories?.map((category) => {
        const categoryKey = category?.id;
        initialExpandedKeys.push(categoryKey);
        const parentColor = category?.color || "#9e9e9e";

        // Add children if subcategories exist
        const children =
          category?.sub_categories?.length > 0
            ? category?.sub_categories?.map((subCategory) => ({
              key: subCategory?.id,
              parentKey: categoryKey,
              title: subCategory?.name,
              color: subCategory?.color || "#9e9e9e",
              parentColor: parentColor, // Add parent color for subcategories
              isSubcategory: true,
            }))
            : undefined;

        return {
          key: categoryKey,
          title: category.name,
          color: parentColor,
          children: children,
        };
      });

      setTreeData(formattedTreeData);
      setExpandedKeys(initialExpandedKeys);
    }
  }, [loanCategories]);

  // Filter function to apply search term
  const filterFiles = (filesToFilter, search) => {
    if (!search) {
      setFilteredFiles(filesToFilter);
      return;
    }

    const searchLower = search.toLowerCase();
    const result = filesToFilter?.filter(
      (file) =>
        file?.name.toLowerCase().includes(searchLower) ||
        file?.categories?.some(
          (cat) =>
            cat.name.toLowerCase().includes(searchLower) ||
            (cat.parentName &&
              cat.parentName.toLowerCase().includes(searchLower))
        )
    );

    setFilteredFiles(result);
  };

  // Handle search with debouncing
  const onChangeSearch = (e) => {
    const value = e.target.value;
    setSearchValue(value);

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set a new timeout for 500ms
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      if (value === "" || value?.length >= 3) {
        // Reset files and fetch first page with new search
        setAllFiles([]);
        setFilteredFiles([]);
        fetchFolderDetails(1, true);
      } else {
        // Just filter existing files for shorter searches
        filterFiles(allFiles, value);
      }
    }, 500);
  };

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
    return () => {
      window.removeEventListener("resize", handleResize);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // After file upload is complete, refresh folder details
  useEffect(() => {
    console.log("fileupload", fileUpload)
    // Check if we have a successful upload result and refresh folder details
    if (fileUpload?.meta?.success === true && folderId) {
      // Reset to first page
      setCurrentPage(1);
      setAllFiles([]);
      setFilteredFiles([]);
      fetchFolderDetails(1, true);
    }
  }, [fileUpload, folderId]);

  // Handle tree selection
  const onTreeSelect = (selectedKeys, info) => {
    if (selectedKeys.length > 0) {
      setSelectedTreeKey(selectedKeys[0]);

      // TODO: Add category filtering if needed
      // For now, we'll just use the search functionality
    }
  };

  // Handle tree expansion
  const onTreeExpand = (expandedKeys) => {
    setExpandedKeys(expandedKeys);
  };

  // Handle file click to open file viewer or document in new tab
  const handleFileClick = (file) => {
    const fileName = file?.name || "";
    const fileExtension = fileName?.split(".").pop().toLowerCase();
    const isDocFile = fileExtension === "doc" || fileExtension === "docx";

    if (isDocFile) {
      // For document files, open directly in Microsoft Office Online
      // eslint-disable-next-line no-constant-binary-expression
      const File_url = IMAGE_BASE_URL || "";
      const fileUrl = `${File_url}/${file?.file_path || ""}`;
      window.open(
        `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(
          fileUrl
        )}`,
        "_blank"
      );
    } else {
      // eslint-disable-next-line no-constant-binary-expression
      const File_url = IMAGE_BASE_URL || "";
      const fileUrl = `${File_url}/${file?.file_path || ""}`;
      window.open(`${fileUrl}`, "_blank");
      // For all other files, show the modal viewer
      // setSelectedFile(file);
      // setIsFileViewerModalVisible(true);
    }
  };

  // Handle file viewer modal close
  const handleFileViewerClose = () => {
    setIsFileViewerModalVisible(false);
    setSelectedFile(null);
  };

  // Handle Recently Deleted button click
  const handleRecentlyDeletedClick = () => {
    setShowRecentlyDeleted(true);
  };

  // Handle back from recently deleted
  const handleBackFromRecentlyDeleted = () => {
    setShowRecentlyDeleted(false);
  };

  // Handle cancel of file delete modal
  const handleCancelDeleteFile = () => {
    setIsDeleteFileModalVisible(false);
    setFileToDelete(null);
  };

  // Handle confirm deletion of file
  const handleConfirmDeleteFile = () => {
    if (fileToDelete?.id) {
      // Dispatch delete file action
      dispatch(deleteLoanCategoryFileAction(fileToDelete.id)).then((res) => {
        if (res?.payload?.meta?.success === true) {
          // Update the local files state to reflect the deletion
          setAllFiles(allFiles?.filter((file) => file?.id !== fileToDelete.id));
          setFilteredFiles(
            filteredFiles?.filter((file) => file?.id !== fileToDelete.id)
          );

          // Close the modal if successful
          setIsDeleteFileModalVisible(false);
          setFileToDelete(null);
        }
      });
    }
  };

  // Show upload modal
  const showUploadModal = () => {
    setIsUploadModalVisible(true);
  };

  // Handle upload modal cancel
  const handleUploadCancel = () => {
    setIsUploadModalVisible(false);
  };

  // Function to generate tree node structure with custom styling
  const generateNodes = (data) => {
    return data.map((item) => {
      const key = item.key;
      const isSelected = key === selectedTreeKey;
      const hasChildren = item.children && item.children.length > 0;
      const isSubcategory = item.isSubcategory;
      const categoryColor = item.color || "#9e9e9e";
      const parentColor = item.parentColor || categoryColor;

      // Create the styled node content
      const title = (
        <div className="flex items-center">
          {isSubcategory ? (
            <div
              className="flex items-center justify-center p-1 rounded-full mr-2"
              style={{ backgroundColor: parentColor }}
            >
              <StarFilled
                style={{ color: categoryColor }}
                className="text-sm"
              />
            </div>
          ) : (
            <StarFilled
              style={{ color: isSelected ? "#FF6D00" : categoryColor }}
              className="text-lg mr-2"
            />
          )}
          <Text className={isSelected ? "text-primary" : "text-white"}>
            {item.title}
          </Text>
        </div>
      );

      return {
        key,
        title,
        className: isSubcategory ? "subcategory-node" : "category-node",
        children: hasChildren ? generateNodes(item.children) : null,
      };
    });
  };

  // Custom styles for the tooltip container to add scrollbar
  const tooltipStyle = {
    maxHeight: "250px",
    width: "300px",
    overflowY: "auto",
    padding: "10px",
    borderRadius: "8px",
  };

  return (
    <>
      {showRecentlyDeleted ? (
        <RecentlyDeleted onBack={handleBackFromRecentlyDeleted} />
      ) : (
        <Row className="bg-darkGray h-full w-full flex flex-col gap-3 sm:gap-6 px-header-wrapper">
          <Col span={24} className="w-full"></Col>

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
                  to={getGuidelinesMatricesLink()}
                  className="text-primary hover:text-primary flex justify-center"
                >
                  <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
                    Guidelines & Matrices
                  </Text>
                </Link>
                <Text className="text-grayText mx-2">
                  {" "}
                  <i className="icon-right-arrow" />{" "}
                </Text>
                <Text className="text-white text-lg sm:text-2xl">
                  {folderName}
                </Text>
              </Title>
            </div>
          </Col>

          {(loanCategoryFolderDetailsLoading && currentPage === 1) ||
            loanCategoriesLoading ? (
            <Col span={24} className="h-full mb-4">
              <div className="loadingClass h-full flex items-center justify-center">
                <Spin size="large" />
              </div>
            </Col>
          ) : (
            <>
              <Col span={24} className="h-full mb-4">
                <Row className="h-full">
                  {/* Sidebar with categories */}
                  <Col xs={24} md={4} lg={4} className="mb-4 md:mb-0">
                    <div
                      className="bg-liteGrayV1 rounded-s-3xl border border-solid border-r-0 border-liteGray p-4"
                      style={{
                        height: `${containerHeight}`,
                        overflowY: "auto",
                      }}
                    >
                      <div className="text-xl text-grayText font-medium mb-4">
                        Folder Categories
                      </div>
                      {
                        treeData?.length > 0 ?
                          <DirectoryTree
                            className="custom-dark-tree"
                            treeData={generateNodes(treeData)}
                            expandedKeys={expandedKeys}
                            selectedKeys={[selectedTreeKey]}
                            onSelect={onTreeSelect}
                            onExpand={onTreeExpand}
                            showLine={{ showLeafIcon: false }}
                            showIcon={false}
                            blockNode={true}
                          />
                          :
                          <div className="flex justify-center items-center h-[60vh]">
                            <Empty description="No Category Found"/>
                          </div>
                      }

                    </div>
                  </Col>

                  {/* Files area */}
                  <Col xs={24} md={20}>
                    <ShadowBoxContainer
                      height={containerHeight}
                      shadowVisible={false}
                      radius="rounded-s-none"
                    >
                      <div
                        className="h-full"
                        ref={filesContainerRef}
                        onScroll={handleScroll}
                      >
                        <Row className="mb-6">
                          <Col span={24}>
                            <div className="flex mt-0 items-center">
                              <div className="text-2xl font-normal">Files</div>
                              <>
                                <span className="mx-3 text-grayText">
                                  &#8226;
                                </span>
                                <div className="bg-primaryOpacity rounded-lg px-3 py-1 text-primary">
                                  {filteredFiles?.length}
                                </div>
                              </>
                            </div>
                          </Col>
                          <Col span={24}>
                            <div className="flex flex-col md:flex-row justify-between gap-3 w-full pt-6">
                              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
                                <div className="relative w-full md:max-w-md">
                                  <Input
                                    size="large"
                                    placeholder="Search Files"
                                    className="bg-[#171717] border-[#373737] rounded-full pl-10"
                                    style={{ width: "100%" }}
                                    onChange={onChangeSearch}
                                    value={searchValue}
                                    allowClear
                                    suffix={null}
                                  />
                                  <SearchOutlined className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl text-grayText" />
                                </div>
                              </div>
                              <div className="w-full flex gap-3 md:w-auto mt-3 md:mt-0">
                                <Button
                                  size="large"
                                  icon={
                                    <DeleteOutlined className="text-red-600" />
                                  }
                                  className="rounded-3xl"
                                  onClick={handleRecentlyDeletedClick}
                                >
                                  Recently Deleted
                                </Button>
                                <Button
                                  type="primary"
                                  size="large"
                                  icon={<UploadOutlined />}
                                  className="rounded-3xl"
                                  onClick={showUploadModal}
                                >
                                  Upload File
                                </Button>
                              </div>
                            </div>
                          </Col>
                        </Row>

                        <Row>
                          <Col span={24}>
                            {/* Replace the current file cards grid implementation with this improved version */}
                            {/* Replace the current file cards grid implementation with this improved version */}
                            {filteredFiles?.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                                {filteredFiles?.map((file) => (
                                  <div
                                    key={file.id}
                                    className="bg-liteGray p-2 rounded-2xl flex flex-col w-full overflow-hidden"
                                    style={{ borderRadius: "12px" }}
                                  >
                                    {/* Top part with document icon */}
                                    <div
                                      className="bg-gray p-4 flex items-center justify-center relative h-32 rounded-2xl cursor-pointer"
                                      onClick={() => handleFileClick(file)}
                                    >
                                      <div className="absolute top-3 right-3 flex gap-2">
                                        <div
                                          className="w-8 h-8 hover:bg-[#444444] border-liteGray border rounded-full flex items-center justify-center cursor-pointer"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setFileToDelete(file);
                                            setIsDeleteFileModalVisible(true);
                                          }}
                                        >
                                          <DeleteOutlined
                                            style={{ color: "#EF4444" }}
                                          />
                                        </div>
                                      </div>
                                      {/* PDF/DOC Icon */}
                                      <div
                                        className="rounded-2xl flex items-center justify-center"
                                        style={{ backgroundColor: "#5F3B1C" }}
                                      >
                                        {file.name
                                          ?.toLowerCase()
                                          .endsWith(".pdf") ? (
                                          <i className="icon-pdf text-5xl text-primary py-2 " />
                                        ) : file.name
                                          ?.toLowerCase()
                                          .endsWith(".docx") ||
                                          file.name
                                            ?.toLowerCase()
                                            .endsWith(".doc") ? (
                                          <i className=" icon-documents text-5xl text-primary py-2" />
                                        ) : file.name
                                          ?.toLowerCase()
                                          .endsWith(".xlsx") ||
                                          file.name
                                            ?.toLowerCase()
                                            .endsWith(".xls") ? (
                                          <i className="icon-xls text-5xl text-primary py-2" />
                                        ) : file.name
                                          ?.toLowerCase()
                                          .endsWith(".csv") ? (
                                          <i className="icon-csv text-5xl text-primary py-2" />
                                        ) : (
                                          <i className="icon-pdf text-5xl text-primary py-2" />
                                        )}
                                      </div>
                                    </div>

                                    {/* Bottom part with file details */}
                                    <div className="rounded-b-lg pt-2 px-3">
                                      <div className="flex justify-between items-start">
                                        <div className="max-w-[75%]">
                                          <Tooltip
                                            title={file.name}
                                            placement="top"
                                          >
                                            <Text
                                              className="text-white text-base font-medium line-clamp-2 break-words cursor-pointer"
                                              onClick={() =>
                                                handleFileClick(file)
                                              }
                                            >
                                              {file.name}
                                            </Text>
                                          </Tooltip>
                                        </div>
                                        <div className="flex items-center ml-2 mt-1 flex-shrink-0">
                                          <div className="flex items-center cursor-pointer">
                                            <Tooltip
                                              title={
                                                <div
                                                  className="bg-darkGray rounded-md"
                                                  style={tooltipStyle}
                                                >
                                                  {file.categories?.map(
                                                    (category, index) => (
                                                      <div
                                                        key={index}
                                                        className="mb-2"
                                                      >
                                                        <div className="flex items-center">
                                                          {category.isMainCategory ? (
                                                            <StarFilled
                                                              style={{
                                                                color:
                                                                  category.color ||
                                                                  "#9e9e9e",
                                                                fontSize:
                                                                  "16px",
                                                                marginRight:
                                                                  "8px",
                                                              }}
                                                            />
                                                          ) : (
                                                            <div
                                                              className="p-1 rounded-full flex items-center justify-center mr-2"
                                                              style={{
                                                                backgroundColor:
                                                                  category.parentColor ||
                                                                  "#9e9e9e",
                                                              }}
                                                            >
                                                              <StarFilled
                                                                style={{
                                                                  color:
                                                                    category.color ||
                                                                    "#9e9e9e",
                                                                  fontSize:
                                                                    "14px",
                                                                }}
                                                              />
                                                            </div>
                                                          )}
                                                          <Text className="text-white">
                                                            {category.isMainCategory
                                                              ? category.name
                                                              : `${category.parentName ||
                                                              "Parent"
                                                              } / ${category.name
                                                              }`}
                                                          </Text>
                                                        </div>
                                                      </div>
                                                    )
                                                  )}
                                                </div>
                                              }
                                              placement="bottomRight"
                                              overlayClassName="category-tooltip"
                                              overlayInnerStyle={{
                                                padding: 0,
                                                borderRadius: "8px",
                                              }}
                                            >
                                              <div className="flex items-center">
                                                {file.primaryCategory && (
                                                  <>
                                                    {file.primaryCategory
                                                      .isMainCategory ? (
                                                      <StarFilled
                                                        style={{
                                                          color:
                                                            file.primaryCategory
                                                              .color ||
                                                            "#9e9e9e",
                                                          fontSize: "16px",
                                                        }}
                                                      />
                                                    ) : (
                                                      <div
                                                        className="w-5 h-5 rounded-full flex items-center justify-center"
                                                        style={{
                                                          backgroundColor:
                                                            file.primaryCategory
                                                              .parentColor ||
                                                            "#9e9e9e",
                                                        }}
                                                      >
                                                        <StarFilled
                                                          style={{
                                                            color:
                                                              file
                                                                .primaryCategory
                                                                .color ||
                                                              "#9e9e9e",
                                                            fontSize: "14px",
                                                          }}
                                                        />
                                                      </div>
                                                    )}
                                                  </>
                                                )}
                                                {file.categories?.length >
                                                  1 && (
                                                    <Text className="font-bold leading-none ml-1">
                                                      +
                                                      {file.categories.length - 1}
                                                    </Text>
                                                  )}
                                              </div>
                                            </Tooltip>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex justify-center items-center h-64">
                                <Empty description="No Files Found" />
                              </div>
                            )}

                            {/* Loading more indicator */}
                            {isLoadingMore && (
                              <div className="w-full flex justify-center items-center py-4 mb-6">
                                <Spin
                                  size="default"
                                  tip="Loading more files..."
                                />
                              </div>
                            )}
                          </Col>
                        </Row>
                      </div>
                    </ShadowBoxContainer>
                  </Col>
                </Row>
              </Col>
            </>
          )}

          {/* Delete File Modal */}
          <Modal
            title="Delete File"
            centered
            destroyOnClose
            open={isDeleteFileModalVisible}
            className="modalWrapperBox"
            onCancel={deleteFileLoading ? undefined : handleCancelDeleteFile}
            footer={false}
            maskClosable={!deleteFileLoading}
            closeIcon={
              <Button
                shape="circle"
                icon={<i className="icon-close before:!m-0 text-sm" />}
                disabled={deleteFileLoading}
              />
            }
          >
            <div className="border-t-2 border-solid border-[#373737] mt-5">
              <Row gutter={16} className="">
                <div className="w-full pt-5 flex items-center justify-center pb-5">
                  <Text className="text-base font-normal text-grayText text-center">
                    Are you sure you want to delete this file?
                  </Text>
                </div>

                <Col span={12}>
                  <Button
                    block
                    size="large"
                    onClick={handleCancelDeleteFile}
                    disabled={deleteFileLoading}
                  >
                    Cancel
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    block
                    type="primary"
                    danger
                    size="large"
                    onClick={handleConfirmDeleteFile}
                    loading={deleteFileLoading}
                  >
                    Delete
                  </Button>
                </Col>
              </Row>
            </div>
          </Modal>

          {/* File Viewer Modal */}
          <FileViewerModal
            isVisible={isFileViewerModalVisible}
            onCancel={handleFileViewerClose}
            fileData={selectedFile}
            loading={false}
          />

          {/* Upload File Modal */}
          <UploadFileModal
            isVisible={isUploadModalVisible}
            onCancel={handleUploadCancel}
            folderId={folderId}
          />
        </Row>
      )}

      {/* Add a global CSS style for the tooltip scrollbar */}
      <style>
        {`
          /* Custom scrollbar for tooltips */
          .category-tooltip .ant-tooltip-inner {
            padding: 0 !important;
          }
          
          /* Webkit scrollbar styles */
          .category-tooltip .ant-tooltip-inner div::-webkit-scrollbar {
            width: 2px;
          }
          
          .category-tooltip .ant-tooltip-inner div::-webkit-scrollbar-track {
            background: #2d2d2d;
            border-radius: 4px;
          }
          
          .category-tooltip .ant-tooltip-inner div::-webkit-scrollbar-thumb {
            background: #555;
            border-radius: 4px;
          }
          
          .category-tooltip .ant-tooltip-inner div::-webkit-scrollbar-thumb:hover {
            background: #FF6D00;
          }
        `}
      </style>
    </>
  );
};

export default FolderDetailsView;