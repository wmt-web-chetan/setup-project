import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  Row,
  Col,
  Table,
  Button,
  Tag,
  Spin,
  Input,
  Empty,
  Tooltip,
  Modal,
  Popover,
} from "antd";
import { PlusOutlined, SearchOutlined, StarFilled } from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import ShadowBoxContainer from "../../../components/AuthLayout/ShadowBoxContainer";
import LoanCategoryModal from "./LoanCategoryModal";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchLoanCategories,
  removeLoanCategory,
} from "../../../services/Store/LoanCategory/action";

const { Text, Title } = Typography;

const LoanCategory = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get loan categories data from Redux store
  const { loanCategories, loanCategoriesLoading, deleteLoanCategoryLoading } =
    useSelector((state) => state?.loanCategories);

  const [createCategoryVisible, setCreateCategoryVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Delete modal states
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // State for filters and pagination
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    search: "",
  });

  // State for popover visibility
  const [popoverVisibleMap, setPopoverVisibleMap] = useState({});

  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  // Debounce search with useRef to store timeout ID
  const searchTimeoutRef = useRef(null);
  const [searchValue, setSearchValue] = useState("");

  // Fetch loan categories based on current tableParams
  const fetchCategories = () => {
    const params = {
      page: tableParams.pagination.current.toString(),
      is_active: 'all',
      per_page: tableParams.pagination.pageSize.toString(),
      is_delete: false,
      ...(tableParams.search && { search: tableParams.search }),
    };

    dispatch(fetchLoanCategories(params));
  };

  // Update table params when data changes
  useEffect(() => {
    if (loanCategories?.data?.pagination) {
      setTableParams((prev) => ({
        ...prev,
        pagination: {
          ...prev.pagination,
          current: loanCategories.data.pagination.currentPage,
          total: loanCategories.data.pagination.totalRecords,
        },
      }));
    }
  }, [loanCategories]);

  // Initial fetch
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setContainerHeight(
        window.innerWidth < 768 ? "calc(100vh - 212px)" : "calc(100vh - 241px)"
      );

      // Close all popovers on resize to prevent overflow issues
      setPopoverVisibleMap({});
    };

    // Set initial height
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close popovers when the container is scrolled
  useEffect(() => {
    const handleScroll = (e) => {
      // Close all popovers on scroll
      setPopoverVisibleMap({});
    };

    // Add scroll event listeners to both window and table container
    window.addEventListener("scroll", handleScroll, true);
    const tableContainer = document.querySelector(".ant-table-body");
    if (tableContainer) {
      tableContainer.addEventListener("scroll", handleScroll, {
        passive: true,
      });
    }

    // Clean up
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      if (tableContainer) {
        tableContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  // Refetch when tableParams change (pagination, search, etc.)
  useEffect(() => {
    fetchCategories();
  }, [
    tableParams.pagination.current,
    tableParams.pagination.pageSize,
    tableParams.search,
  ]);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Handle create new category
  const showCreateCategory = () => {
    setEditingCategory(null);
    setCreateCategoryVisible(true);
  };

  // Handle edit category
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCreateCategoryVisible(true);
  };

  // Delete modal handlers
  const showDeleteModal = (category) => {
    setCategoryToDelete(category);
    setIsDeleteModalVisible(true);
  };

  const handleCancelDelete = () => {
    setIsDeleteModalVisible(false);
    setCategoryToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      dispatch(removeLoanCategory(categoryToDelete.id)).then((result) => {
        if (result.payload?.meta?.success) {
          fetchCategories();
          setIsDeleteModalVisible(false);
          setCategoryToDelete(null);
        }
      });
    }
  };

  // Handle table pagination change
  const handleTableChange = (pagination, filters, sorter) => {
    // Close all popovers when table changes
    setPopoverVisibleMap({});

    setTableParams({
      ...tableParams,
      pagination,
    });
  };

  // Handle search input change with debouncing
  const onChangeSearch = (e) => {
    const value = e.target.value;
    setSearchValue(value);

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Only update filters if search value is empty or has at least 3 characters
    if (value === "" || value.length >= 3) {
      // Set a new timeout for 500ms
      searchTimeoutRef.current = setTimeout(() => {
        setTableParams({
          ...tableParams,
          pagination: {
            ...tableParams.pagination,
            current: 1, // Reset to first page when search changes
          },
          search: value,
        });
      }, 500);
    }
  };

  // Handle form submission (callback for modal)
  const handleCategoryFormFinish = async () => {
    setCreateCategoryVisible(false);
    setEditingCategory(null);
    fetchCategories();
  };

  // Truncate text with ellipsis and return with tooltip if needed
  const truncateWithTooltip = (text) => {
    if (text && text.length > 30) {
      return (
        <Tooltip title={text} placement="top">
          <span>{text.substring(0, 30)}...</span>
        </Tooltip>
      );
    }
    return text;
  };

  // Handle popover visibility changes
  const handlePopoverVisibleChange = (visible, categoryId) => {
    // Update visibility in state
    setPopoverVisibleMap((prev) => ({
      ...prev,
      [categoryId]: visible,
    }));
  };

  // Component to render a single subcategory tag
  const SubCategoryTag = ({ subCategory }) => (
    <Tag
      key={subCategory.id}
      className="px-2 py-1 rounded-md"
      style={{ borderColor: `${subCategory.color}` }}
    >
      <Text
        style={{
          display: "block",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "105px",
          color: `${subCategory.color}`,
        }}
      >
        {subCategory.name}
      </Text>
    </Tag>
  );

  // Component to render all subcategories in a popover
  const AllSubCategoriesContent = ({ subCategories }) => (
    <div className="max-w-md p-4">
      <div className="font-medium mb-2">All Subcategories:</div>
      <div className="flex flex-wrap gap-2">
        {subCategories.map((subCat) => (
          <SubCategoryTag key={subCat.id} subCategory={subCat} />
        ))}
      </div>
    </div>
  );

  // Function to render subcategories
  const renderSubCategories = (subCategories, record) => {
    if (
      !subCategories ||
      !Array.isArray(subCategories) ||
      subCategories.length === 0
    ) {
      return <Text className="text-grayText">No Subcategories</Text>;
    }

    // Show only first 4 subcategories
    const visibleSubcategories = subCategories.slice(0, 5);
    const remainingCount = subCategories.length - 5;
    const hasMoreSubcategories = remainingCount > 0;

    return (
      <div className="flex items-center">
        <div
          className="flex items-center overflow-x-auto"
          style={{ whiteSpace: "nowrap" }}
        >
          {visibleSubcategories.map((subCat) => (
            <SubCategoryTag key={subCat.id} subCategory={subCat} />
          ))}

          {hasMoreSubcategories && (
            <Popover
              content={
                <AllSubCategoriesContent subCategories={subCategories} />
              }
              title={null}
              trigger="click"
              placement="bottom"
              className="subcategories-popover"
              autoAdjustOverflow={true}
              open={popoverVisibleMap[record.id] || false}
              onOpenChange={(visible) =>
                handlePopoverVisibleChange(visible, record.id)
              }
              overlayInnerStyle={{ maxWidth: "300px" }}
              align={{
                overflow: {
                  adjustX: true,
                  adjustY: true,
                  alwaysByViewport: true,
                },
              }}
            >
              <Tag className="px-2 py-1 rounded-md bg-[#4A4A4A] text-white mr-2 cursor-pointer">
                <PlusOutlined className="mr-1" />
                <Text className="text-white">{remainingCount} more</Text>
              </Tag>
            </Popover>
          )}
        </div>
      </div>
    );
  };

  // Close popovers when table is scrolled
  const onScrollCategoryTable = () => {
    if (Object.values(popoverVisibleMap).some((isOpen) => isOpen)) {
      setPopoverVisibleMap({});
    }
  };

  // Table columns
  const columns = [
    {
      title: "Category Name",
      dataIndex: "name",
      key: "name",
      width: "25%",
      render: (text, record) => (
        <div>
          <Row>
            <Col xs={18}>
              <Text className="text-white font-medium">
                {truncateWithTooltip(text)}
              </Text>
            </Col>
            <Col xs={4} className="flex justify-end">
              <StarFilled
                className="text-lg"
                style={{ color: `${record.color}` }}
              />
            </Col>
          </Row>
        </div>
      ),
    },
    {
      title: "Sub Categories",
      dataIndex: "sub_categories",
      key: "sub_categories",
      width: "60%",
      render: (subCategories, record) =>
        renderSubCategories(subCategories, record),
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      width: "10%",
      render: (isActive) =>
        isActive ? (
          <Tag
            className="px-2 py-1 rounded-md bg-gray text-white"
            style={{ borderLeft: `3px solid #4CAF50` }}
          >
            Active
          </Tag>
        ) : (
          <Tag
            className="px-2 py-1 rounded-md bg-gray text-white"
            style={{ borderLeft: `3px solid #c53b37` }}
          >
            Inactive
          </Tag>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: "5%",
      render: (_, record) => (
        <div className="flex justify-center">
          <Button
            type="text"
            icon={<i className="icon-edit" />}
            className="text-primary hover:text-primary-dark text-lg"
            onClick={() => handleEditCategory(record)}
          />
          {/* <Button
            type="text"
            icon={<i className="icon-delete " />}
            className="text-danger hover:text-danger-dark text-lg"
            onClick={() => showDeleteModal(record)}
            loading={
              deleteLoanCategoryLoading &&
              record.id === loanCategories?.deletingId
            }
          /> */}
        </div>
      ),
    },
  ];

  return (
    <Row className="bg-darkGray px-header-wrapper h-full w-full flex flex-col gap-3 sm:gap-6">
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
              to="/admin"
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
              Loan Categories
            </Text>
          </Title>
        </div>
      </Col>

      <Col span={24} className="h-full mb-4">
        <ShadowBoxContainer
          height={containerHeight}
          overflow={
            !loanCategoriesLoading &&
              (!loanCategories?.data?.loan_categories ||
                loanCategories?.data?.loan_categories.length === 0)
              ? "hidden"
              : "auto"
          }
        >
          <>
            {loanCategoriesLoading && !loanCategories ? (
              <div className="loadingClass">
                <Spin size="large" />
              </div>
            ) : (
              <>
                <div className="flex mt-0 items-center">
                  <div className="text-2xl font-normal">Loan Categories</div>
                  {loanCategories?.data?.loan_categories?.length > 0 && (
                    <>
                      <span className="mx-3 text-grayText">&#8226;</span>
                      <div className="bg-primaryOpacity rounded-lg px-3 py-1 text-primary">
                        {loanCategories?.data?.loan_categories?.length || 0}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex flex-col md:flex-row justify-between gap-3 mb-6 pt-6 w-full">
                  <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
                    <div className="relative w-full md:max-w-md">
                      <Input
                        size="large"
                        prefix={
                          <SearchOutlined className="absolute left-4 top-1/2 text-xl transform -translate-y-1/2 text-grayText" />
                        }
                        placeholder="Search Categories"
                        className="bg-[#171717] border-[#373737] rounded-full pl-10"
                        style={{ width: "100%" }}
                        onChange={onChangeSearch}
                        value={searchValue}
                        allowClear
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-auto mt-3 md:mt-0">
                    <Button
                      type="primary"
                      size="large"
                      icon={<PlusOutlined />}
                      onClick={showCreateCategory}
                      className="rounded-3xl w-full"
                    >
                      Add Category
                    </Button>
                  </div>
                </div>
                <div className="h-full">
                  {loanCategoriesLoading ? (
                    <div className="loadingClass">
                      <Spin size="large" />
                    </div>
                  ) : loanCategories?.data?.loan_categories?.length > 0 ? (
                    <div className="overflow-auto">
                      <Table
                        columns={columns}
                        dataSource={loanCategories.data.loan_categories}
                        rowKey="id"
                        pagination={{
                          ...tableParams.pagination,
                          position: ["bottomRight"],
                          showSizeChanger: false,
                          className:
                            "custom-pagination bg-lightGray flex-wrap-pagination",
                          showTotal: (total, range) => (
                            <div className="text-grayText w-full text-center md:text-left mb-4 md:mb-0">
                              Showing {range[0]}-{range[1]} of {total} results
                            </div>
                          ),
                        }}
                        onChange={handleTableChange}
                        className="custom-table loan-category-table bg-[#242424] !rounded-[2rem] mb-6"
                        rowClassName="bg-[#242424] hover:bg-darkGray transition-colors"
                        scroll={{
                          x: "max-content",
                        }}
                        onScroll={onScrollCategoryTable}
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <Empty description="No Categories Found" />
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        </ShadowBoxContainer>
      </Col>

      {/* Category modal */}
      {createCategoryVisible && (
        <LoanCategoryModal
          visible={createCategoryVisible}
          onClose={() => {
            setCreateCategoryVisible(false);
            setEditingCategory(null);
          }}
          onFinish={handleCategoryFormFinish}
          editingCategory={editingCategory}
        />
      )}

      {/* Delete Modal */}
      <Modal
        title="Delete Category"
        centered
        destroyOnClose
        open={isDeleteModalVisible}
        footer={false}
        onCancel={handleCancelDelete}
        closeIcon={
          <Button
            shape="circle"
            icon={<i className="icon-close before:!m-0 text-sm" />}
          />
        }
      >
        <div className="border-t-2 border-solid border-[#373737] mt-5">
          <Row gutter={16} className="">
            <div className="w-full pt-5 flex flex-col items-center justify-center pb-5">
              <Text className="text-base font-normal text-grayText text-center">
                Are you sure you want to delete this category?
              </Text>
              {/* {categoryToDelete && (
                <Text className="text-grayText text-center px-24 py-3">
                  This action is permanent and cannot be undone. Please confirm
                  if you want to delete the category "{categoryToDelete.name}".
                </Text>
              )} */}
            </div>
            <Col span={12}>
              <Button block onClick={handleCancelDelete} size="large">
                Cancel
              </Button>
            </Col>
            <Col span={12}>
              <Button
                block
                danger
                type="primary"
                size="large"
                onClick={handleConfirmDelete}
                loading={
                  deleteLoanCategoryLoading &&
                  categoryToDelete?.id === loanCategories?.deletingId
                }
              >
                Confirm Deletion
              </Button>
            </Col>
          </Row>
        </div>
      </Modal>
    </Row>
  );
};

export default LoanCategory;
