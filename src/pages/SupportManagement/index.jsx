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
  Select,
  Empty,
  Tooltip,
  Modal,
  Form,
  Switch,
  message,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  CaretRightOutlined,
  LinkOutlined,
  EditOutlined,
  DeleteOutlined,
  DiffOutlined,
} from "@ant-design/icons";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ShadowBoxContainer from "../../components/AuthLayout/ShadowBoxContainer";
import {
  fetchCategories,
  addCategory,
  updateCategoryAction,
} from "../../services/Store/Support/action";
import { removeCategory } from "../../services/Store/Support/action";

const { Text, Title } = Typography;

const SupportManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // Check if in admin mode
  const isAdminMode = location.pathname.includes("/admin/");

  // Helper functions for dynamic navigation
  const getDashboardLink = () => {
    return isAdminMode ? "/admin" : "/dashboard";
  };

  const getSupportManagementPath = (categoryId) => {
    return isAdminMode
      ? `/admin/support-management/${categoryId}`
      : `/support-management/${categoryId}`;
  };

  // Get categories data from Redux store
  const { categoriesLoading, addCategoryLoading, updateCategoryLoading } =
    useSelector((state) => state?.support || {});

  const [form] = Form.useForm();

  // State for categories data and filters
  const [categories, setCategories] = useState(null);
  const [status, setStatus] = useState(false);
  const [openCategoriesModal, setOpenCategoriesModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteCategory, setIsDeleteCategory] = useState(false);
  const [deleteCategoryId, setDeleteCategoryId] = useState(undefined);
  const [editingCategory, setEditingCategory] = useState(null);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    filters: {
      is_active: undefined,
      category_type: undefined,
    },
    search: "",
  });


  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  // Debounce search with useRef to store timeout ID
  const searchTimeoutRef = useRef(null);
  const [searchValue, setSearchValue] = useState("");

  // Helper function to convert text to snake_case
  const convertToSnakeCase = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  };

  // Fetch categories based on current tableParams
  const fetchCategoriesData = () => {
    const params = {
      page: tableParams.pagination.current.toString(),
      per_page: tableParams.pagination.pageSize.toString(),
      ...(tableParams.filters.is_active !== undefined && {
        is_active: tableParams.filters.is_active,
      }),
      ...(tableParams.filters.category_type && {
        category_type: tableParams.filters.category_type,
      }),
      ...(tableParams.search && { search: tableParams.search }),
    };

    dispatch(fetchCategories(params))
      .then((res) => {
        if (res?.payload?.data?.categories) {
          setCategories(res?.payload?.data?.categories || []);
          const paginationData = res?.payload?.data?.pagination;

          // Update tableParams with new pagination info
          setTableParams({
            ...tableParams,
            pagination: {
              ...tableParams.pagination,
              current: paginationData?.currentPage,
              total: paginationData?.totalRecords,
            },
          });
        }
      })
      .catch((e) => {
        console.log("Error", e);
      });
  };

  // Initial fetch
  useEffect(() => {
    fetchCategoriesData();
  }, []);

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

  // Refetch when tableParams change (pagination, filters, etc.)
  useEffect(() => {
    fetchCategoriesData();
  }, [
    tableParams.pagination.current,
    tableParams.pagination.pageSize,
    tableParams.filters.is_active,
    tableParams.filters.category_type,
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

  // Category type mapping for display
  const categoryTypeMap = {
    credit_technology: { label: "Credit Technology", color: "#1890ff" },
    nmls_licensing: { label: "NMLS Licensing", color: "#52c41a" },
    meridian_link: { label: "Meridian Link", color: "#722ed1" },
    salesforce: { label: "Salesforce", color: "#eb2f96" },
  };

  // Handle create new category
  const showCreateCategory = () => {
    setIsEditMode(false);
    setEditingCategory(null);
    setStatus(false);
    form.resetFields();
    setOpenCategoriesModal(true);
  };

  // Handle edit category
  const handleEditCategory = (category) => {
    setIsEditMode(true);
    setEditingCategory(category);
    setStatus(category.is_active);

    // Pre-populate form with existing data
    form.setFieldsValue({
      question_title: category.name,
      description: category.description,
      category_link: category.login_url,
      is_active: category.is_active,
    });

    setOpenCategoriesModal(true);
  };

  // Handle delete category
  const handleDeleteCategory = (category) => {
    setIsDeleteCategory(true);
    setDeleteCategoryId(category?.id);
  };

  // Handle table pagination and filtering change
  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({
      ...tableParams,
      pagination,
    });
  };

  // Handle modal close
  const handleModalClose = () => {
    setOpenCategoriesModal(false);
    setIsEditMode(false);
    setEditingCategory(null);
    setStatus(false);
    form.resetFields();
  };

  const handleCancelDelete = () => {
    setIsDeleteCategory(false);
    setDeleteCategoryId(undefined);
  };

  // Handle category creation/update
  const handleCategoriesSubmit = (values) => {

    if (isEditMode && editingCategory) {
      // Update existing category
      const payload = {
        id: editingCategory?.id,
        name: values.question_title,
        description: values.description,
        category_type: convertToSnakeCase(values.question_title),
        login_url: values.category_link,
        is_active: status,
      };

      console.log("Update payload:", payload);

      dispatch(updateCategoryAction(payload))
        .then((res) => {

          if (res?.payload?.meta?.success && res?.payload?.data?.category) {
            // Success - update the category in categories state
            const updatedCategory = res.payload.data.category;
            setCategories((prevCategories) => {
              return prevCategories.map((cat) =>
                cat.id === updatedCategory.id ? updatedCategory : cat
              );
            });
            handleModalClose();
          }
        })
        .catch((error) => {
          console.log("Error updating category:", error);
        });
    } else {
      // Create new category
      const payload = {
        name: values.question_title,
        description: values.description,
        category_type: convertToSnakeCase(values.question_title),
        login_url: values.category_link,
        is_active: status,
      };

      console.log("Create payload:", payload);

      dispatch(addCategory(payload))
        .then((res) => {

          if (res?.payload?.meta?.success && res?.payload?.data?.category) {
            // Success - append the new category to categories state
            const newCategory = res.payload.data.category;
            setCategories((prevCategories) => {
              const updatedCategories = prevCategories
                ? [newCategory, ...prevCategories]
                : [newCategory];
              return updatedCategories;
            });

            // Update pagination total count
            setTableParams((prevParams) => ({
              ...prevParams,
              pagination: {
                ...prevParams.pagination,
                total: prevParams.pagination.total + 1,
              },
            }));

            handleModalClose();
          }
        })
        .catch((error) => {
          console.log("Error creating category:", error);
        });
    }
  };

  // Handle status filter change
  const onChangeCategoryStatus = (value) => {
    setTableParams({
      ...tableParams,
      pagination: {
        ...tableParams.pagination,
        current: 1, // Reset to first page when filter changes
      },
      filters: {
        ...tableParams.filters,
        is_active: value,
      },
    });
  };

  // Handle category type filter change
  const onChangeCategoryType = (value) => {
    setTableParams({
      ...tableParams,
      pagination: {
        ...tableParams.pagination,
        current: 1, // Reset to first page when filter changes
      },
      filters: {
        ...tableParams.filters,
        category_type: value,
      },
    });
  };

  // Handle search input change with debouncing
  const onChangeCategorySearch = (e) => {
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

  // Handle external link click
  const handleLinkClick = (url) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // Get unique category types for filter dropdown
  const getCategoryTypeOptions = () => {
    const uniqueTypes = [
      ...new Set(categories?.map((cat) => cat.category_type)),
    ];
    return uniqueTypes.map((type) => ({
      value: type,
      label: categoryTypeMap[type]?.label || type,
    }));
  };

  const onChangeSwitch = (checked) => {
    console.log("checked", checked);
    setStatus(checked);
  };

  const handleConfirmDelete = () => {
    if (deleteCategoryId !== undefined) {
      dispatch(removeCategory(deleteCategoryId))
        .then((res) => {
          console.log("res delete", res);
          if (res?.payload?.meta?.success) {
            // Get the deleted category ID from the response
            const deletedCategoryId =
              res?.payload?.data?.id || res?.payload?.id || deleteCategoryId;

            // Update categories state by filtering out the deleted category
            setCategories((prevCategories) => {
              return prevCategories.filter(
                (category) => category.id !== deletedCategoryId
              );
            });

            // Update pagination total count
            setTableParams((prevParams) => ({
              ...prevParams,
              pagination: {
                ...prevParams.pagination,
                total: Math.max(0, prevParams.pagination.total - 1),
              },
            }));

            // Close modal and reset state
            setIsDeleteCategory(false);
            setDeleteCategoryId(undefined);
          }
        })
        .catch((e) => {
          console.log("Error deleting category:", e);
        });
    }
  };

  const onClickAddDocuments = (category) => {
    navigate(getSupportManagementPath(category?.id));
  };

  // Table columns
  const columns = [
    {
      title: "Category Name",
      dataIndex: "name",
      key: "name",
      width: "30%",
      render: (text, record) => (
        <div className="flex flex-col">
          <Text className="text-white font-medium text-base">
            {text?.length >= 30 ? text?.slice(0, 28) + "..." : text}
          </Text>
        </div>
      ),
    },

    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: "45%",
      render: (text, record) => (
        <div className="flex flex-col">
          <Text className="text-white font-medium text-base">
            {text?.length >= 30 ? text?.slice(0, 28) + "..." : text}
          </Text>
        </div>
      ),
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
      width: "15%",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          {record?.login_url && (
            <Tooltip title="Visit Link">
              <Button
                type="text"
                icon={<LinkOutlined />}
                className="text-primary hover:text-primary-dark text-lg"
                onClick={() => handleLinkClick(record.login_url)}
              />
            </Tooltip>
          )}
          <Tooltip title="Edit Category">
            <Button
              type="text"
              icon={<EditOutlined />}
              className="text-primary hover:text-primary-dark text-lg"
              onClick={() => handleEditCategory(record)}
            />
          </Tooltip>
          <Tooltip title="Add Documents">
            <Button
              type="text"
              icon={<DiffOutlined />}
              className="text-primary hover:text-primary-dark text-lg"
              onClick={() => onClickAddDocuments(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Category">
            <Button
              type="text"
              icon={<DeleteOutlined className="text-error" />}
              className="text-primary hover:text-primary-dark text-lg"
              onClick={() => handleDeleteCategory(record)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <Row className="bg-darkGray px-header-wrapper h-full w-full flex flex-col gap-3 sm:gap-6">
      <div className="w-full"></div>

      <Modal
        title={
          <Text className="text-white text-lg">
            {isEditMode ? "Edit Category" : "Add New Categories"}
          </Text>
        }
        centered
        open={openCategoriesModal}
        onCancel={handleModalClose}
        footer={null}
        width={700}
        className="mcq-modal modalWrapperBox"
        destroyOnClose
        confirmLoading={isEditMode ? updateCategoryLoading : addCategoryLoading}
        closeIcon={
          <Button
            shape="circle"
            icon={<i className="icon-close before:!m-0 text-sm" />}
          />
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCategoriesSubmit}
          requiredMark={false}
        >
          <div className="wrapperFormContent" style={{ maxHeight: "60vh" }}>
            <Form.Item name="video_id" hidden>
              <Input />
            </Form.Item>

            <Form.Item
              name="question_title"
              label={<Text className="text-white">Category Name</Text>}
              rules={[
                { max: 50, message: "Category cannot exceed 50 characters" },
                { required: true, message: "Please Enter the Category" },
              ]}
            >
              <Input
                size="large"
                placeholder="Enter Category"
                maxLength={50}
                showCount
              />
            </Form.Item>

            <Form.Item
              name="description"
              label={<Text className="text-white">Description</Text>}
              rules={[
                {
                  max: 255,
                  message: "Category Description cannot Exceed 255 Characters",
                },
              ]}
            >
              <Input
                size="large"
                placeholder="Enter Description"
                maxLength={255}
                showCount
              />
            </Form.Item>

            <Form.Item
              name="category_link"
              label={<Text className="text-white">Link</Text>}
              rules={[
                {
                  type: "url",
                  message: "Please Enter Valid URL",
                },
                { required: true, message: "Please Enter the Link" },
              ]}
            >
              <Input size="large" placeholder="Enter Category Link" />
            </Form.Item>

            <Form.Item
              name="is_active"
              label={<Text className="text-base">Status</Text>}
              valuePropName="checked"
            >
              <Row align="middle" gutter={8}>
                <Col>
                  <Switch
                    size="default"
                    checkedChildren="Active"
                    unCheckedChildren="Inactive"
                    checked={status}
                    onChange={onChangeSwitch}
                  />
                </Col>
              </Row>
            </Form.Item>
          </div>

          <div className="wrapperFooter">
            <Form.Item className="mb-0">
              <div className="flex justify-end">
                <Button
                  onClick={handleModalClose}
                  className="mr-3"
                  size="large"
                  disabled={
                    isEditMode ? updateCategoryLoading : addCategoryLoading
                  }
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={
                    isEditMode ? updateCategoryLoading : addCategoryLoading
                  }
                >
                  {isEditMode ? "Update Category" : "Create Category"}
                </Button>
              </div>
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        title="Delete Category"
        centered
        destroyOnClose
        open={isDeleteCategory}
        footer={false}
        onCancel={handleCancelDelete}
        closeIcon={
          <Button
            shape="circle"
            icon={<i className="icon-close before:!m-0 text-sm" />}
          />
        }
      >
        <div className=" border-t-2 border-solid border-[#373737] mt-5">
          <Row gutter={16} className="">
            <div className="w-full pt-5 flex  items-center justify-center  pb-5">
              <Text className=" text-base font-normal text-grayText text-center">
                Are you sure you want to delete this Category?
              </Text>
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
              >
                Confirm Deletion
              </Button>
            </Col>
          </Row>
        </div>
      </Modal>

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
            <Text className="text-white text-lg sm:text-2xl">
              Support Management
            </Text>
          </Title>
        </div>
      </Col>

      <Col span={24} className="h-full mb-4">
        <ShadowBoxContainer
          height={containerHeight}
          overflow={
            !categoriesLoading && categories !== null && categories.length === 0
              ? "hidden"
              : "auto"
          }
        >
          <>
            {categoriesLoading || categories === null ? (
              <div className="loadingClass">
                <Spin size="large" />
              </div>
            ) : (
              <>
                <div className="flex mt-0 items-center justify-between mb-5">
                  <div className="flex items-center">
                    <div className="text-2xl font-normal">
                      Support Categories
                    </div>
                    {tableParams?.pagination?.total > 0 && (
                      <>
                        <span className="mx-3 text-grayText">&#8226;</span>
                        <div className="bg-primaryOpacity rounded-lg px-3 py-1 text-primary">
                          {tableParams?.pagination?.total || ""}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="w-full md:w-auto">
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
                  {categoriesLoading || categories === null ? (
                    <div className="loadingClass">
                      <Spin size="large" />
                    </div>
                  ) : categories?.length > 0 ? (
                    <div className="overflow-auto">
                      <Table
                        columns={columns}
                        dataSource={categories}
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
                        className="custom-table support-management-table bg-[#242424] !rounded-[2rem] mb-6"
                        rowClassName="bg-[#242424] hover:bg-darkGray transition-colors"
                        scroll={{
                          x: "max-content",
                        }}
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
    </Row>
  );
};

export default SupportManagement;
