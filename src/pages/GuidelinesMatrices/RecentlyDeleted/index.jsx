import React, { useState, useEffect } from "react";
import {
  Button,
  Col,
  Input,
  Row,
  Typography,
  Tooltip,
  Modal,
  Spin,
  Empty,
} from "antd";
import { Link } from "react-router-dom";
import {
  UndoOutlined,
  SearchOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import FolderIcon from "../../../assets/SVGs/Folder.png";
import ShadowBoxContainer from "../../../components/AuthLayout/ShadowBoxContainer";
import {
  fetchDeleteFileList,
  fetchLoanCategoryFolders,
  restoreFolderAction,
  restoreFileAction,
} from "../../../services/Store/GuidelinesMatrices/action";

const { Text, Title } = Typography;

const RecentlyDeleted = ({ onBack }) => {
  const dispatch = useDispatch();
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  const [isRestoreModalVisible, setIsRestoreModalVisible] = useState(false);
  const [itemToRestore, setItemToRestore] = useState(null);
  const [searchValue, setSearchValue] = useState("");

  // Pagination states
  const [folderPage, setFolderPage] = useState(1);
  const [filePage, setFilePage] = useState(1);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);

  // Local state to accumulate loaded items
  const [allFolders, setAllFolders] = useState([]);
  const [allFiles, setAllFiles] = useState([]);

  // Redux state
  const { loanCategoryFolders, loanCategoryFoldersLoading } = useSelector(
    (state) => state?.guidelineMatrices || {}
  );

  const {
    deleteFileList,
    deleteFileListLoading,
    restoreFolderLoading,
    restoreFileLoading,
  } = useSelector((state) => state?.guidelineMatrices || {});

  // Determine if any restore operation is in progress
  const isRestoreLoading = restoreFolderLoading || restoreFileLoading;

  // Update accumulated folders when new data arrives
  useEffect(() => {
    if (loanCategoryFolders?.data?.folders) {
      if (folderPage === 1) {
        // Reset folders for new searches or initial load
        setAllFolders(loanCategoryFolders.data.folders);
      } else {
        // Use a Set to remove duplicates based on id
        const existingIds = new Set(allFolders.map((folder) => folder.id));
        const newFolders = loanCategoryFolders.data.folders.filter(
          (folder) => !existingIds.has(folder.id)
        );

        // Append only new folders to existing ones
        setAllFolders((prev) => [...prev, ...newFolders]);
      }
    }
  }, [loanCategoryFolders, folderPage]);

  // Update accumulated files when new data arrives
  useEffect(() => {
    if (deleteFileList?.data?.files) {
      if (filePage === 1) {
        // Reset files for new searches or initial load
        setAllFiles(deleteFileList.data.files);
      } else {
        // Use a Set to remove duplicates based on id
        const existingIds = new Set(allFiles.map((file) => file.id));
        const newFiles = deleteFileList.data.files.filter(
          (file) => !existingIds.has(file.id)
        );

        // Append only new files to existing ones
        setAllFiles((prev) => [...prev, ...newFiles]);
      }
    }
  }, [deleteFileList, filePage]);

  // Fetch deleted folders and files when component mounts
  useEffect(() => {
    fetchDeletedItems();
  }, []);

  const fetchDeletedItems = () => {
    // Reset pagination states when doing a new search
    setFolderPage(1);
    setFilePage(1);
    // Reset accumulated items
    setAllFolders([]);
    setAllFiles([]);

    const params = {
      search: searchValue || "",
      is_delete: true,
      page: 1,
      per_page: 12,
    };

    dispatch(fetchLoanCategoryFolders(params));
    dispatch(fetchDeleteFileList(params));
  };

  // Load more folders
  const loadMoreFolders = () => {
    if (loanCategoryFolders?.data?.pagination) {
      const { currentPage, totalPage } = loanCategoryFolders.data.pagination;

      if (currentPage < totalPage) {
        setFoldersLoading(true);
        const nextPage = currentPage + 1;
        setFolderPage(nextPage);

        const params = {
          search: searchValue || "",
          is_delete: true,
          page: nextPage,
          per_page: 12,
        };

        dispatch(fetchLoanCategoryFolders(params)).finally(() => {
          setFoldersLoading(false);
        });
      }
    }
  };

  // Load more files
  const loadMoreFiles = () => {
    if (deleteFileList?.data?.pagination) {
      const { currentPage, totalPage } = deleteFileList.data.pagination;

      if (currentPage < totalPage) {
        setFilesLoading(true);
        const nextPage = currentPage + 1;
        setFilePage(nextPage);

        const params = {
          search: searchValue || "",
          is_delete: true,
          page: nextPage,
          per_page: 12,
        };

        dispatch(fetchDeleteFileList(params)).finally(() => {
          setFilesLoading(false);
        });
      }
    }
  };

  // Use accumulated folders and files
  const folders = allFolders;
  const files = allFiles;

  // Check if there are more folders to load
  const hasMoreFolders = loanCategoryFolders?.data?.pagination
    ? loanCategoryFolders.data.pagination.currentPage <
      loanCategoryFolders.data.pagination.totalPage
    : false;

  // Check if there are more files to load
  const hasMoreFiles = deleteFileList?.data?.pagination
    ? deleteFileList.data.pagination.currentPage <
      deleteFileList.data.pagination.totalPage
    : false;

  // Add categories to each file based on colorArray
  const filesWithCategories = files.map((file) => {
    const categories = [];

    // Process the colorArray if it exists
    if (file?.colorArray && file.colorArray.length > 0) {
      file.colorArray.forEach((cat) => {
        // Main category
        if (!cat.sub_name) {
          categories.push({
            key: cat.parent_name,
            name: cat.parent_name,
            color: cat.main_color,
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
    } else {
      // Default category if no colorArray
      categories.push({
        key: "default",
        name: "Default Category",
        color: "#FF6D00",
        isMainCategory: true,
      });
    }

    return {
      ...file,
      categories: categories,
      primaryCategory: categories.length > 0 ? categories[0] : null,
    };
  });

  // Apply search filter to files with categories
  const filteredFiles = searchValue
    ? filesWithCategories.filter((file) =>
        file?.file_name?.toLowerCase().includes(searchValue.toLowerCase())
      )
    : filesWithCategories;

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

  // Handle change of modal title based on item type
  const getModalTitle = () => {
    if (!itemToRestore) return "Restore Item";
    return itemToRestore.type === "folder" ? "Restore Lender" : "Restore File";
  };

  // Handle restore item
  const handleRestore = (itemType, itemId) => {
    const item =
      itemType === "folder"
        ? folders.find((folder) => folder.id === itemId)
        : files.find((file) => file.id === itemId);

    setItemToRestore({
      id: itemId,
      type: itemType,
      name: item?.name || item?.file_name,
    });
    setIsRestoreModalVisible(true);
  };

  // Handle confirm restore
  const handleConfirmRestore = () => {
    if (itemToRestore?.id) {
      if (itemToRestore.type === "folder") {
        // Dispatch folder restore action
        dispatch(restoreFolderAction(itemToRestore.id))
          .unwrap()
          .then((result) => {
            if (result?.meta?.success === true) {
              // Close modal and remove the restored folder from the state
              setIsRestoreModalVisible(false);
              setItemToRestore(null);

              // Remove restored folder from local state
              setAllFolders((prev) =>
                prev.filter((folder) => folder.id !== itemToRestore.id)
              );
            }
          })
          .catch((error) => {
            console.error("Failed to restore folder:", error);
          });
      } else if (itemToRestore.type === "file") {
        // Dispatch file restore action
        dispatch(restoreFileAction(itemToRestore.id))
          .unwrap()
          .then((result) => {
            if (result?.meta?.success === true) {
              // Close modal and remove the restored file from the state
              setIsRestoreModalVisible(false);
              setItemToRestore(null);

              // Remove restored file from local state
              setAllFiles((prev) =>
                prev.filter((file) => file.id !== itemToRestore.id)
              );
            }
          })
          .catch((error) => {
            console.error("Failed to restore file:", error);
          });
      }
    }
  };

  // Handle cancel restore
  const handleCancelRestore = () => {
    setIsRestoreModalVisible(false);
    setItemToRestore(null);
  };

  // Format file name to avoid extremely long names
  const formatFileName = (fileName) => {
    if (!fileName) return "";
    if (fileName.length > 20) {
      return fileName.substring(0, 17) + "...";
    }
    return fileName;
  };

  // Handle search input change
  const onChangeSearch = (e) => {
    setSearchValue(e.target.value);
  };

  // Handle search submission
  const handleSearch = () => {
    fetchDeletedItems();
  };

  // Get file extension
  const getFileExtension = (fileName) => {
    if (!fileName) return "";
    return fileName.split(".").pop().toLowerCase();
  };

  // Render the appropriate icon based on file extension
  const renderFileIcon = (fileExtension) => {
    if (fileExtension === "pdf") {
      return <i className="icon-pdf text-5xl text-primary py-2" />;
    } else if (["doc", "docx"].includes(fileExtension)) {
      return <i className="icon-documents text-5xl text-primary py-2" />;
    } else if (["xls", "xlsx"].includes(fileExtension)) {
      return <i className="icon-xls text-5xl text-primary py-2" />;
    } else if (fileExtension === "csv") {
      return <i className="icon-csv text-5xl text-primary py-2" />;
    } else {
      return <i className="icon-pdf text-5xl text-primary py-2" />;
    }
  };

  // Check if there are any items to display
  const hasItems = folders.length > 0 || filteredFiles.length > 0;

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
            <Text
              className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg"
              onClick={onBack}
            >
              Guidelines & Matrices
            </Text>
            <Text className="text-grayText mx-2">
              {" "}
              <i className="icon-right-arrow" />{" "}
            </Text>
            <Text className="text-white text-lg sm:text-2xl">
              Recently Deleted
            </Text>
          </Title>
        </div>

        {/* Add search input */}
        {/* <div className="w-full sm:w-auto">
          <Input
            placeholder="Search deleted items..."
            prefix={<SearchOutlined className="text-grayText" />}
            value={searchValue}
            onChange={onChangeSearch}
            onPressEnter={handleSearch}
            className="w-full sm:w-64 rounded-lg bg-liteGray border-liteGray text-grayText"
            suffix={
              <Button 
                type="text" 
                className="text-primary hover:text-primary"
                onClick={handleSearch}
              >
                Search
              </Button>
            }
          />
        </div> */}
      </Col>

      <Col span={24} className="h-full mb-4">
        <ShadowBoxContainer height={containerHeight} shadowVisible={false}>
          {loanCategoryFoldersLoading || deleteFileListLoading ? (
            <div className="loadingClass h-full flex items-center justify-center">
              <Spin size="large" />
            </div>
          ) : !hasItems ? (
            // Show single empty state when both folders and files are empty
            <div className="flex flex-col items-center justify-center h-full">
              <Empty
                description="No deleted Lenders/Files found"
                className="mb-4"
              />
            </div>
          ) : (
            <>
              {/* Folders Section - Only show if there are folders */}
              {folders?.length > 0 && (
                <div className="mb-8">
                  <div className="flex mt-0 items-center mb-6">
                    <Text className="text-2xl font-normal text-white">
                      Lenders
                    </Text>
                    <span className="mx-3 text-grayText">&#8226;</span>
                    <div className="bg-primaryOpacity rounded-lg px-3 py-1 text-primary">
                      {loanCategoryFolders?.data?.pagination?.totalRecords ||
                        folders?.length}
                    </div>
                  </div>

                  <div className="flex gap-6 md:gap-10 flex-wrap">
                    {folders?.map((folder) => (
                      <div key={folder?.id} className=" w-32 md:w-40">
                        <div className="folder-container">
                          <div className="relative w-full mb-2 graoup">
                            <div className="absolute top-2 right-4 z-10">
                              <Button
                                shape="circle"
                                size="small"
                                className="hover:bg-primary hover:border-primary bg-black bg-opacity-40 border-0"
                                icon={<UndoOutlined className="text-white" />}
                                onClick={() =>
                                  handleRestore("folder", folder?.id)
                                }
                              />
                            </div>
                            {folder?.folder_items?.length > 0 ? (
                              <div
                                className="absolute bottom-2 left-4 px-2 py-1 bg-black bg-opacity-40  
                                flex items-center justify-center rounded-2xl text-sm z-10"
                              >
                                {folder?.folder_items?.length || 0} files
                              </div>
                            ) : (
                              <div
                                className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-40  
                                flex items-center justify-center rounded-2xl text-sm z-10"
                              >
                                Empty
                              </div>
                            )}
                            <div className="w-full h-full flex justify-center items-center">
                              <img
                                src={FolderIcon}
                                alt={`${folder?.name} folder`}
                                className="w-full object-contain"
                                style={{ maxHeight: "120px" }}
                              />
                            </div>
                          </div>
                          <div className="text-center px-1">
                            <Text
                              className="text-white text-sm line-clamp-2 hover:text-primary"
                              title={folder?.name}
                            >
                              {folder?.name}
                            </Text>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Load More Folders */}
                  {hasMoreFolders && (
                    <div className="flex justify-center mt-6">
                      <Button
                        // type="primary"
                        type="text"
                        onClick={loadMoreFolders}
                        loading={foldersLoading}
                        // style={{ backgroundColor: "#FF6D00", borderColor: "#FF6D00" }}
                      >
                        Load More Lenders
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Files Section - Only show if there are files */}
              {filteredFiles?.length > 0 && (
                <div>
                  <div className="flex mt-0 items-center mb-6">
                    <div className="text-2xl font-normal text-white">Files</div>
                    <span className="mx-3 text-grayText">&#8226;</span>
                    <div className="bg-primaryOpacity rounded-lg px-3 py-1 text-primary">
                      {deleteFileList?.data?.pagination?.totalRecords ||
                        filteredFiles?.length}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
                  {filteredFiles.map((file) => (
                      <div
                        key={file?.id}
                        className="bg-liteGray p-2 rounded-2xl flex flex-col w-full overflow-hidden"
                        style={{ borderRadius: "12px" }}
                      >
                        {/* Top part with document icon */}
                        <div className="bg-gray p-4 flex items-center justify-center relative h-32 rounded-2xl">
                          <div className="absolute top-3 right-3">
                            <div
                              className="w-8 h-8 hover:bg-[#444444] border-liteGray border rounded-full flex items-center justify-center cursor-pointer"
                              onClick={() => handleRestore("file", file?.id)}
                            >
                              <UndoOutlined />
                            </div>
                          </div>

                          {/* File Icon Based on Extension */}
                          <div
                            className="rounded-2xl flex items-center justify-center"
                            style={{ backgroundColor: "#5F3B1C" }}
                          >
                            {renderFileIcon(getFileExtension(file?.file_name))}
                          </div>
                        </div>

                        {/* Bottom part with file details */}
                        <div className="flex-grow rounded-b-lg pt-2 px-3">
                          <div className="flex justify-between items-center">
                            <div className="max-w-[75%]">
                              <Tooltip title={file?.file_name} placement="top">
                                <Text className="text-white text-base font-medium line-clamp-2 break-words">
                                  {file?.file_name}
                                </Text>
                              </Tooltip>
                            </div>
                            <div className="flex items-center ml-2">
                              <div className="flex items-center cursor-pointer">
                                <Tooltip
                                  title={
                                    <div className="bg-darkGray p-2 rounded-md">
                                      {file.categories?.map(
                                        (category, index) => (
                                          <div key={index} className="mb-2">
                                            <div className="flex items-center">
                                              {category.isMainCategory ? (
                                                <StarFilled
                                                  style={{
                                                    color:
                                                      category.color ||
                                                      "#9e9e9e",
                                                    fontSize: "16px",
                                                    marginRight: "8px",
                                                  }}
                                                />
                                              ) : (
                                                <div
                                                  className="w-5 h-5 rounded-full flex items-center justify-center mr-2"
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
                                                      fontSize: "10px",
                                                    }}
                                                  />
                                                </div>
                                              )}
                                              <Text className="text-white">
                                                {category.isMainCategory
                                                  ? category.name
                                                  : `${
                                                      category.parentName ||
                                                      "Parent"
                                                    } / ${category.name}`}
                                              </Text>
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  }
                                  placement="bottomRight"
                                  color="#212121"
                                  overlayClassName="category-tooltip"
                                >
                                  <div className="flex items-center">
                                    {file.primaryCategory && (
                                      <>
                                        {file.primaryCategory.isMainCategory ? (
                                          <StarFilled
                                            style={{
                                              color:
                                                file.primaryCategory.color ||
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
                                                  .parentColor || "#9e9e9e",
                                            }}
                                          >
                                            <StarFilled
                                              style={{
                                                color:
                                                  file.primaryCategory.color ||
                                                  "#9e9e9e",
                                                fontSize: "10px",
                                              }}
                                            />
                                          </div>
                                        )}
                                      </>
                                    )}
                                    {file.categories?.length > 1 && (
                                      <Text className="text-yellow-400 font-bold leading-none ml-1">
                                        +{file.categories.length - 1}
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

                  {/* Load More Files */}
                  {hasMoreFiles && (
                    <div className="flex justify-center mt-2 mb-6">
                      <Button
                        type="text"
                        onClick={loadMoreFiles}
                        loading={filesLoading}
                        // style={{ backgroundColor: "#FF6D00", borderColor: "#FF6D00" }}
                      >
                        Load More Files
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </ShadowBoxContainer>
      </Col>

      {/* Restore Confirmation Modal */}
      <Modal
        title={getModalTitle()}
        centered
        destroyOnClose
        open={isRestoreModalVisible}
        className="modalWrapperBox"
        onCancel={isRestoreLoading ? undefined : handleCancelRestore}
        footer={false}
        closeIcon={
          <Button
            shape="circle"
            icon={<i className="icon-close before:!m-0 text-sm" />}
            disabled={isRestoreLoading}
          />
        }
        maskClosable={!isRestoreLoading}
      >
        <div className="border-t-2 border-solid border-[#373737] mt-5">
          <Row gutter={16} className="">
            <div className="w-full pt-5 flex items-center justify-center pb-5">
              <Text className="text-base font-normal text-grayText text-center">
                Are you sure you want to restore this {itemToRestore?.type === "folder" ? "lender" : "file"}? It
                will be moved back to its original location.
              </Text>
            </div>

            <Col span={12}>
              <Button
                block
                size="large"
                onClick={handleCancelRestore}
                disabled={isRestoreLoading}
              >
                Cancel
              </Button>
            </Col>
            <Col span={12}>
              <Button
                block
                type="primary"
                size="large"
                onClick={handleConfirmRestore}
                style={{ backgroundColor: "#FF6D00", borderColor: "#FF6D00" }}
                loading={isRestoreLoading}
              >
                Restore
              </Button>
            </Col>
          </Row>
        </div>
      </Modal>
    </Row>
  );
};

export default RecentlyDeleted;
