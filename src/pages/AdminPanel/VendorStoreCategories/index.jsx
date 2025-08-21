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
  Space,
  Switch,
} from "antd";
import {
  AppstoreOutlined,
  PlusOutlined,
  SearchOutlined,
  CaretRightOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import ShadowBoxContainer from "../../../components/AuthLayout/ShadowBoxContainer";
import { useDispatch, useSelector } from "react-redux";
import {
  addVendorStoreCategory,
  fetchVendorStoreCategories,
  updateVendorStoreCategoryAction,
  fetchVendorStoreCategoryById, // Add the new action import
} from "../../../services/Store/VendorAdmin/action";

const { Text, Title } = Typography;

const VendorStoreCategories = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get vendor categories data from Redux store
  const {
    vendorCategories,
    vendorCategoriesLoading,
    vendorCategoriesError,
    createVendorCategoryLoading,
    updateVendorCategoryLoading,
    // Add the new state variables
    vendorStoreCategoryDetails,
    vendorStoreCategoryDetailsLoading,
    vendorStoreCategoryDetailsError,
  } = useSelector((state) => 
    state?.vendorStoreCategories
  );
  
  // State for categories data and filters
  const [categories, setCategories] = useState(null);
  const [tableLoading, setTableLoading] = useState(false); // New state for table-specific loading
  const [initialLoading, setInitialLoading] = useState(true); // Track initial page load
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    search: "",
  });

  // Modal states
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [form] = Form.useForm();

  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  // Debounce search with useRef to store timeout ID
  const searchTimeoutRef = useRef(null);
  const [searchValue, setSearchValue] = useState("");
  const [editSwitchValue, setEditSwitchValue] = useState(false);

  // Fetch vendor categories based on current tableParams
  const fetchVendorCategoriesData = (isSearch = false) => {
    const params = {
      page: tableParams.pagination.current.toString(),
      per_page: tableParams.pagination.pageSize.toString(),
      is_active: "all",
      ...(tableParams.search && { search: tableParams.search }),
    };

    // Set appropriate loading state
    if (isSearch || categories !== null) {
      setTableLoading(true);
    }

    dispatch(fetchVendorStoreCategories(params)).then((res) => {
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
      
      // Clear loading states
      setTableLoading(false);
      setInitialLoading(false);
    }).catch(() => {
      setTableLoading(false);
      setInitialLoading(false);
    });
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
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Refetch when tableParams change (pagination, search, etc.)
  useEffect(() => {
    const isSearch = tableParams.search !== "";
    fetchVendorCategoriesData(isSearch);
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

  // Watch for vendorStoreCategoryDetails changes and populate form
  useEffect(() => {
    if (
      vendorStoreCategoryDetails?.data &&
      isEditModalVisible &&
      !vendorStoreCategoryDetailsLoading
    ) {
      const categoryData = vendorStoreCategoryDetails.data;
      const isActiveBoolean = categoryData.is_active === 1 || categoryData.is_active === true || categoryData.is_active === "1";
      // console.log('converted is_active:', isActiveBoolean);

      // Set local state for switch
      setEditSwitchValue(isActiveBoolean);
      form.setFieldsValue({
        name: categoryData.name,
        is_active: isActiveBoolean, // Convert 1/0 to true/false for Switch
      });
    }
  }, [vendorStoreCategoryDetails, isEditModalVisible, vendorStoreCategoryDetailsLoading, form]);

  // Handle create new category
  const showCreateCategory = () => {
    setModalMode("create");
    setIsCreateModalVisible(true);
    setSelectedCategory(null);
    form.resetFields();
    // Set default values for create mode
    form.setFieldsValue({
      is_active: true, // Default to active
    });
  };

  // Handle edit category - Updated to fetch fresh data
  const handleEditCategory = (category) => {
    setIsEditModalVisible(true);
    setSelectedCategory(category);
    setModalMode("edit");
    
    // Clear form first
    form.resetFields();
    // Reset switch state
    setEditSwitchValue(false);
    
    // Set loading state and open modal
    setIsEditModalVisible(true);
    // Dispatch action to fetch fresh category data
    dispatch(fetchVendorStoreCategoryById(category.id));
    
    // console.log("Edit category:", category);
  };

  // Handle delete category
  const handleDeleteCategory = (category) => {
    // Show delete confirmation
  };

  // Handle view category
  const handleViewCategory = (category) => {
    setSelectedCategory(category);
    setIsViewModalVisible(true);
  };

  // Handle create modal close
  const handleCreateModalClose = () => {
    setIsCreateModalVisible(false);
    setSelectedCategory(null);
    form.resetFields();
  };

  // Handle edit modal close
  const handleEditModalClose = () => {
    setIsEditModalVisible(false);
    setSelectedCategory(null);
    setEditSwitchValue(false);
    form.resetFields();

  };

  // Handle form submit
  const handleFormSubmit = async (values) => {
    try {
      // Get the current form values to ensure we have the latest switch state
      const formValues = form.getFieldsValue();

      // Convert boolean to 1/0 for is_active
      const payload = {
        ...values,
        is_active: formValues.is_active ? 1 : 0,
      };

      // console.log("Form values:", formValues);
      // console.log("Final payload:", payload);

      if (modalMode === "create") {
        await dispatch(addVendorStoreCategory(payload)).unwrap();
        handleCreateModalClose();
      } else {
        const updatePayload = {
          name: payload.name,
          is_active: payload.is_active,
          id: selectedCategory.id,
        };
        await dispatch(updateVendorStoreCategoryAction(updatePayload)).unwrap();

        // Update local state immediately for live update
        setCategories((prevCategories) =>
          prevCategories?.map((category) =>
            category.id === selectedCategory.id
              ? {
                  ...category,
                  name: payload.name,
                  is_active: payload.is_active,
                }
              : category
          )
        );
        handleEditModalClose();
      }
      fetchVendorCategoriesData(); // Refresh the list
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  // Handle view modal close
  const handleViewModalClose = () => {
    setIsViewModalVisible(false);
    setSelectedCategory(null);
  };

  // Handle table pagination change
  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({
      ...tableParams,
      pagination,
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

  // Table columns
  const columns = [
    {
      title: "Category Details",
      dataIndex: "name",
      key: "name",
      width: "35%",
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primaryOpacity rounded-lg flex items-center justify-center">
            {record?.icon ? (
              <img
                src={record.icon}
                alt={text}
                className="w-6 h-6 object-contain"
              />
            ) : (
              <AppstoreOutlined className="text-primary text-lg" />
            )}
          </div>
          <div className="flex flex-col">
            <Text className="text-white font-medium text-base">
              {text?.length >= 30 ? text?.slice(0, 28) + "..." : text}
            </Text>
            <Text className="text-grayText text-sm">
              ID: {record?.id?.slice(0, 8)}...
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      width: "15%",
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
      title: "Created Date",
      dataIndex: "created_at",
      key: "created_at",
      width: "15%",
      render: (date) => (
        <Text className="text-grayText">
          {date ? new Date(date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      }) : "N/A"}
        </Text>
      ),
    },
    {
      title: "Updated Date",
      dataIndex: "updated_at",
      key: "updated_at",
      width: "15%",
      render: (date) => (
        <Text className="text-grayText">
          {date ? new Date(date).toLocaleDateString() : "N/A"}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: "20%",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<EditOutlined />}
            className="text-primary hover:text-primary text-lg"
            onClick={() => handleEditCategory(record)}
          />
        </div>
      ),
    },
  ];

  // Show initial loading for the entire component on first load
  if (initialLoading && vendorCategoriesLoading && categories === null) {
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
                Vendor Store Categories
              </Text>
            </Title>
          </div>
        </Col>
        <Col span={24} className="h-full mb-4">
          <ShadowBoxContainer height={containerHeight} overflow="hidden">
            <div className="loadingClass">
              <Spin size="large" />
            </div>
          </ShadowBoxContainer>
        </Col>
      </Row>
    );
  }

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
              Vendor Store Categories
            </Text>
          </Title>
        </div>
      </Col>

      <Col span={24} className="h-full mb-4">
        <ShadowBoxContainer
          height={containerHeight}
          overflow={
            !tableLoading &&
            categories !== null &&
            categories?.length === 0
              ? "hidden"
              : "auto"
          }
        >
          <>
            <div className="flex mt-0 items-center">
              <div className="text-2xl font-normal">Vendor Categories</div>
              {categories?.length > 0 && (
                <>
                  <span className="mx-3 text-grayText">&#8226;</span>
                  <div className="bg-primaryOpacity rounded-lg px-3 py-1 text-primary">
                    {tableParams?.pagination?.total  || ""}
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
                    onChange={onChangeCategorySearch}
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
            
            {/* Table Section with conditional loading */}
            <div className="h-full">
              {tableLoading ? (
                <div className="flex justify-center items-center h-64">
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
                    className="custom-table vendor-categories-table bg-[#242424] !rounded-[2rem] mb-6"
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
        </ShadowBoxContainer>
      </Col>

      {/* Create Category Modal */}
      <Modal
        title="Create New Category"
        open={isCreateModalVisible}
        onCancel={handleCreateModalClose}
        footer={null}
        width={500}
        className="custom-modal"
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          className="mt-6"
        >
          <Form.Item
            label={<Text type="secondary">Category Name</Text>}
            name="name"
            rules={[
              { required: true, message: "Please enter category name!" },
              { min: 2, message: "Name must be at least 2 characters!" },
              { max: 50, message: "Name must not exceed 50 characters!" },
            ]}
          >
            <Input
              size="large"
              maxLength={50}
              placeholder="Enter category name"
              className="bg-[#171717] border-[#373737] text-white"
              showCount
            />
          </Form.Item>

          <Form.Item
            label={<Text type="secondary">Status</Text>}
            name="is_active"
            valuePropName="checked"
            initialValue={true}
          >
            <div className="flex items-center gap-3">
              <Switch
                size="default"
                className="bg-gray-600"
                checkedChildren="Active"
                unCheckedChildren="Inactive"
                onChange={(checked) => {
                  form.setFieldsValue({ is_active: checked });
                  // console.log("Create switch changed:", checked);
                }}
              />
            </div>
          </Form.Item>

          <Form.Item className="mb-0 mt-6">
            <div className="flex justify-end gap-3">
              <Button
                size="large"
                onClick={handleCreateModalClose}
                className="bg-[#373737] border-[#373737] text-white hover:bg-[#4a4a4a] hover:border-[#4a4a4a]"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={createVendorCategoryLoading}
                className="bg-primary border-primary"
              >
                Create Category
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        title="Edit Category"
        open={isEditModalVisible}
        onCancel={handleEditModalClose}
        footer={null}
        width={500}
        className="custom-modal"
        centered
      >
        {vendorStoreCategoryDetailsLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFormSubmit}
            requiredMark={false}
            key={selectedCategory?.id} // Force re-render when category changes
            className="mt-6"
          >
            <Form.Item
              label={<Text type="secondary">Category Name</Text>}
              name="name"
              rules={[
                { required: true, message: "Please enter category name!" },
                { min: 2, message: "Name must be at least 2 characters!" },
                { max: 50, message: "Name must not exceed 50 characters!" },
              ]}
            >
              <Input
                size="large"
                maxLength={50}
                placeholder="Enter category name!"
                className="bg-[#171717] border-[#373737] text-white"
              />
            </Form.Item>

            <Form.Item label={<Text type="secondary">Status</Text>} name="is_active" valuePropName="checked">
              <div className="flex items-center gap-3">
                <Switch
                  size="default"
                  className="bg-gray-600"
                  checkedChildren="Active"
                  unCheckedChildren="Inactive"
                  checked={editSwitchValue}
                  onChange={(checked) => {
                    setEditSwitchValue(checked);
                    form.setFieldsValue({ is_active: checked });
                    // console.log("Edit switch changed:", checked);
                  }}
                />
              </div>
            </Form.Item>

            <Form.Item className="mb-0 mt-6">
              <div className="flex justify-end gap-3">
                <Button
                  size="large"
                  onClick={handleEditModalClose}
                  className="bg-[#373737] border-[#373737] text-white hover:bg-[#4a4a4a] hover:border-[#4a4a4a]"
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  loading={updateVendorCategoryLoading}
                  className="bg-primary border-primary"
                >
                  Update Category
                </Button>
              </div>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* View Category Modal */}
      <Modal
        title="Category Details"
        open={isViewModalVisible}
        onCancel={handleViewModalClose}
        footer={[
          <Button
            key="close"
            size="large"
            onClick={handleViewModalClose}
            className="bg-[#373737] border-[#373737] text-white hover:bg-[#4a4a4a] hover:border-[#4a4a4a]"
          >
            Close
          </Button>,
        ]}
        width={500}
        className="custom-modal"
        centered
      >
        {selectedCategory && (
          <div className="mt-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-primaryOpacity rounded-lg flex items-center justify-center">
                {selectedCategory?.icon ? (
                  <img
                    src={selectedCategory.icon}
                    alt={selectedCategory.name}
                    className="w-10 h-10 object-contain"
                  />
                ) : (
                  <AppstoreOutlined className="text-primary text-2xl" />
                )}
              </div>
              <div>
                <Title level={4} className="text-white !mb-1">
                  {selectedCategory?.name}
                </Title>
                <Text className="text-grayText">
                  ID: {selectedCategory?.id}
                </Text>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <Text className="text-grayText">Status:</Text>
                <Tag
                  color={selectedCategory?.is_active === 1 ? "green" : "red"}
                  className="rounded-full px-3 py-1"
                >
                  {selectedCategory?.is_active === 1 ? "Active" : "Inactive"}
                </Tag>
              </div>
              <div className="flex justify-between">
                <Text className="text-grayText">Created Date:</Text>
                <Text className="text-white">
                  {selectedCategory?.created_at
                    ? new Date(selectedCategory.created_at).toLocaleString("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })
                    : "N/A"}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text className="text-grayText">Updated Date:</Text>
                <Text className="text-white">
                  {selectedCategory?.updated_at
                    ? new Date(selectedCategory.updated_at).toLocaleString("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })
                    : "N/A"}
                </Text>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Row>  
  );
};

export default VendorStoreCategories;