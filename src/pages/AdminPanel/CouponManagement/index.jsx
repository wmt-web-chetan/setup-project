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
  InputNumber,
  Switch,
  Space,
  Alert,
} from "antd";
import {
  GiftOutlined,
  PlusOutlined,
  SearchOutlined,
  CaretRightOutlined,
  UserAddOutlined,
  CloseOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import ShadowBoxContainer from "../../../components/AuthLayout/ShadowBoxContainer";
import { useDispatch, useSelector } from "react-redux";
import {
  addAssigns,
  addCouponAction,
  fetchCouponById,
  fetchCoupons,
  updateCouponAction,
  deleteCouponAction,
} from "../../../services/Store/Coupons/action";
import { getGuestList } from "../../../services/Store/Calender/action";
import './CouponManagement.scss'

const { Text, Title } = Typography;

const CouponManagement = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get coupons data from Redux store
  const {
    couponsLoading,
    singleCouponLoading,
    updateCouponLoading,
    createCouponLoading,
    assignCouponLoading,
    deleteCouponLoading,
  } = useSelector((state) => state?.coupons);
  const { guest, guestLoading } = useSelector((state) => state?.meetings);

  // State for coupons data and filters
  const [coupons, setCoupons] = useState(null);
  const [tableLoading, setTableLoading] = useState(false); // New state for table-specific loading
  const [initialLoading, setInitialLoading] = useState(true); // Track initial page load
  const [isNotificationModal, setIsNotificationModal] = useState(false); // Track initial page load
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    filters: {
      is_active: undefined,
    },
    search: "",
  });

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "update"
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [form] = Form.useForm();

  // Delete modal states
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState(null);

  // Assign modal states
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [userSearchValue, setUserSearchValue] = useState("");
  const [assignForm] = Form.useForm();
  const userSearchTimeoutRef = useRef(null);
  const [assignResponse, setAssignResponse] = useState(null);

  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  // Debounce search with useRef to store timeout ID
  const searchTimeoutRef = useRef(null);
  const [searchValue, setSearchValue] = useState("");

  // Fetch coupons based on current tableParams
  const fetchCouponsData = (isSearch = false) => {
    const params = {
      page: tableParams.pagination.current.toString(),
      per_page: tableParams.pagination.pageSize.toString(),
      ...(tableParams.filters.is_active !== undefined && {
        is_active: tableParams.filters.is_active,
      }),
      ...(tableParams.search && { search: tableParams.search }),
    };

    // Set appropriate loading state
    if (isSearch || coupons !== null) {
      setTableLoading(true);
    }

    dispatch(fetchCoupons(params)).then((res) => {
      if (res?.payload?.data?.coupons) {
        setCoupons(res?.payload?.data?.coupons || []);
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

  // Refetch when tableParams change (pagination, filters, etc.)
  useEffect(() => {
    const isSearch = tableParams.search !== "";
    fetchCouponsData(isSearch);
  }, [
    tableParams.pagination.current,
    tableParams.pagination.pageSize,
    tableParams.filters.is_active,
    tableParams.search,
  ]);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (userSearchTimeoutRef.current) {
        clearTimeout(userSearchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (guest?.data?.users && Array.isArray(guest?.data?.users)) {
      const newUserOptions = guest.data.users.map((user) => ({
        id: user?.id,
        name: user?.name || "Unnamed",
        email: user?.email || "",
      }));

      // Always preserve previously selected users by merging them
      setUserOptions((prevOptions) => {
        // Separate existing assignments from search results
        const existingAssignments = prevOptions.filter(
          (user) => user.isExistingAssignment
        );
        const searchResults = newUserOptions;

        // Combine existing assignments with new search results
        const allUsers = [...existingAssignments, ...searchResults];

        // Remove duplicates based on ID, preferring existing assignments
        const uniqueUsers = allUsers.filter(
          (user, index, array) =>
            array.findIndex((u) => u.id === user.id) === index
        );

        return uniqueUsers;
      });
    }
  }, [guest]);

  // Handle create new coupon
  const showCreateCoupon = () => {
    setModalMode("create");
    setSelectedCoupon(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Handle edit coupon
  const handleEditCoupon = async (coupon) => {
    setModalMode("update");
    setSelectedCoupon(coupon);
    setIsModalVisible(true);

    try {
      // Fetch complete coupon details
      const result = await dispatch(fetchCouponById(coupon.id)).unwrap();

      if (result?.data?.coupon) {
        const couponData = result.data.coupon;
        form.setFieldsValue({
          name: couponData.name,
          coupon_code: couponData.coupon_code,
          discount_type: couponData.discount_type,
          discount_value: parseFloat(couponData.discount_value),
          duration_months: couponData.duration_months,
          is_active: true,
        });
      }
    } catch (error) {
      console.error("Failed to fetch coupon details:", error);
    }
  };

  // Handle delete coupon
  const handleDeleteCoupon = (coupon) => {
    setCouponToDelete(coupon);
    setIsDeleteModalVisible(true);
  };

  // Handle cancel delete
  const handleCancelDelete = () => {
    setIsDeleteModalVisible(false);
    setCouponToDelete(null);
  };


  const handleCancelNotification = () => {
    setIsNotificationModal(false);
  };

  const truncateName = (name) => {
    if (!name) return "";
    if (name.length <= 7) return name;
    return name.substring(0, 7) + "...";
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!couponToDelete) return;

    try {
      await dispatch(deleteCouponAction(couponToDelete.id)).unwrap();
      // Update local state immediately to remove deleted coupon
      setCoupons((prevCoupons) =>
        prevCoupons.filter((item) => item.id !== couponToDelete.id)
      );
      // Update pagination count
      setTableParams((prevParams) => ({
        ...prevParams,
        pagination: {
          ...prevParams.pagination,
          total: prevParams.pagination.total - 1,
        },
      }));
      // Close modal
      setIsDeleteModalVisible(false);
      setCouponToDelete(null);
    } catch (error) {
      console.error("Failed to delete coupon:", error);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedCoupon(null);
    form.resetFields();
  };

  // Handle form submit
  const handleFormSubmit = async (values) => {
    try {
      if (modalMode === "create") {
        await dispatch(addCouponAction(values)).unwrap();
        fetchCouponsData(); // Refresh the list
      } else {
        const updatePayload = {
          id: selectedCoupon.id,
          name: values.name,
          is_active: true,
        };
        const result = await dispatch(
          updateCouponAction(updatePayload)
        ).unwrap();

        // Update local state immediately for live update
        if (result?.data?.coupon) {
          setCoupons((prevCoupons) =>
            prevCoupons.map((coupon) =>
              coupon.id === result.data.coupon.id ? result.data.coupon : coupon
            )
          );
        }
      }
      handleModalClose();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  // Handle assign coupon
  const handleAssignCoupon = (coupon) => {
    setSelectedCoupon(coupon);
    setIsAssignModalVisible(true);

    // Extract existing assigned users from coupon_user array
    if (coupon?.coupon_user && coupon.coupon_user.length > 0) {
      const existingAssignments = coupon.coupon_user.map((assignment) => {
        // Handle cases where user object might be null
        const userName = assignment.user?.name || "Unknown User";
        const userEmail = assignment.email;
        const userId = assignment.user_id || assignment.id; // Use assignment id if user_id is null

        return {
          id: userId,
          name: userName,
          email: userEmail,
          isExistingAssignment: true, // Flag to identify existing assignments
        };
      });

      // Set selected users
      setSelectedUsers(existingAssignments);

      // Add existing assignments to user options
      setUserOptions(existingAssignments);

      // Set form values with existing user IDs
      const existingUserIds = existingAssignments.map((user) => user.id);
      assignForm.setFieldsValue({
        users: existingUserIds,
      });
    } else {
      // Reset if no existing assignments
      setSelectedUsers([]);
      setUserOptions([]);
      assignForm.resetFields();
    }
  };

  // Handle assign modal close
  const handleAssignModalClose = () => {
    setIsAssignModalVisible(false);
    setSelectedCoupon(null);
    setSelectedUsers([]);
    setUserOptions([]);
    setUserSearchValue("");
    assignForm.resetFields();
    // Clear any pending search timeout
    if (userSearchTimeoutRef.current) {
      clearTimeout(userSearchTimeoutRef.current);
      userSearchTimeoutRef.current = null;
    }
  };

  // Update user options when guest data changes
  useEffect(() => {
    if (guest?.data?.users && Array.isArray(guest?.data?.users)) {
      const newUserOptions = guest.data.users.map((user) => ({
        id: user?.id,
        name: user?.name || "Unnamed",
        email: user?.email || "",
      }));

      // Always preserve previously selected users by merging them
      setUserOptions((prevOptions) => {
        const allUsers = [...selectedUsers, ...newUserOptions];
        // Remove duplicates based on ID
        const uniqueUsers = allUsers.filter(
          (user, index, array) =>
            array.findIndex((u) => u.id === user.id) === index
        );
        return uniqueUsers;
      });
    }
  }, [guest, selectedUsers]);

  // Handle user search with debouncing
  const handleUserSearch = (value) => {
    // Clear any existing timeout
    if (userSearchTimeoutRef.current) {
      clearTimeout(userSearchTimeoutRef.current);
    }

    // Set a new timeout (debounce by 500ms)
    userSearchTimeoutRef.current = setTimeout(() => {
      const trimmedValue = value?.trim();
      if (trimmedValue && trimmedValue.length >= 3) {
        setUserSearchValue(trimmedValue);
        dispatch(getGuestList({ search: trimmedValue, type: "all" }));
      } else if (trimmedValue && trimmedValue.length < 3) {
        // Don't search if less than 3 characters
        setUserSearchValue(trimmedValue);
      } else {
        // Reset search when input is cleared
        setUserSearchValue("");
        setUserOptions([]);
      }
    }, 500);
  };

  // Handle user selection change
  const handleUserChange = (selectedValues) => {
    const selectedUserObjects = selectedValues
      ?.map((id) => {
        return userOptions.find((user) => user?.id === id);
      })
      .filter(Boolean);

    setSelectedUsers(selectedUserObjects);
    assignForm.setFieldsValue({ users: selectedValues });
  };

  // Handle assign form submit
  const handleAssignSubmit = async (values) => {
    try {
      // Get selected user emails from userOptions
      const selectedUserEmails = values.users
        ?.map((userId) => {
          const user = userOptions.find((u) => u.id === userId);
          return user?.email ? { email: user.email } : null;
        })
        .filter(Boolean);

      const assignPayload = {
        coupon_id: selectedCoupon.id,
        assignments: selectedUserEmails,
      };

      const response = await dispatch(addAssigns(assignPayload)).unwrap();
      setAssignResponse(response);
      setIsNotificationModal(true);

      handleAssignModalClose();
      // Refresh coupon data to show updated assignments
      fetchCouponsData();
    } catch (error) {
      console.error("Assignment error:", error);
    }
  };

  // Handle table pagination and filtering change
  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({
      ...tableParams,
      pagination,
    });
  };

  // Handle status filter change
  const onChangeCouponStatus = (value) => {
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

  // Handle search input change with debouncing
  const onChangeCouponSearch = (e) => {
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

  // Format discount value display
  const formatDiscountValue = (discountType, discountValue) => {
    if (discountType === "percentage") {
      return `${discountValue}%`;
    } else if (discountType === "fixed_amount") {
      return `$${discountValue}`;
    }
    return discountValue;
  };

  // Get discount type color
  const getDiscountTypeColor = (discountType) => {
    switch (discountType) {
      case "percentage":
        return "#4CAF50";
      case "fixed_amount":
        return "#2196F3";
      default:
        return "#757575";
    }
  };

  // Get delete button style
  const getDeleteButtonStyle = () => {
    return {
      backgroundColor: "#382727",
      color: "#ef4444",
      borderRadius: "8px",
      border: "1px solid",
      borderColor: "#ef4444",
      fontWeight: "500",
      fontSize: "12px",
      padding: "4px 12px",
      height: "28px",
    };
  };

  // Table columns
  const columns = [
    {
      title: "Coupon Details",
      dataIndex: "name",
      key: "name",
      width: "25%",
      render: (text, record) => (
        <div className="flex flex-col">
          <Text className="text-white font-medium text-base">
            {text?.length >= 20 ? text?.slice(0, 18) + "..." : text}
          </Text>
          <Text className="text-grayText text-sm">
            Code: {record?.coupon_code}
          </Text>
          <Text className="text-grayText text-xs">
            Stripe ID: {record?.stripe_coupon_id}
          </Text>
        </div>
      ),
    },
    {
      title: "Discount",
      dataIndex: "discount_type",
      key: "discount",
      width: "15%",
      render: (discountType, record) => (
        <div className="flex flex-col">
          <Text className="text-white font-semibold">
            {formatDiscountValue(discountType, record?.discount_value)}
          </Text>
          <Text className="text-grayText text-xs mt-1">
            {discountType === "percentage" ? "Percentage" : "Fixed Amount"}
          </Text>
        </div>
      ),
    },
    {
      title: "Duration",
      dataIndex: "duration_months",
      key: "duration_months",
      width: "10%",
      render: (months) => (
        <div className="flex items-center">
          <Text className="text-grayText">
            {months} {months === 1 ? "month" : "months"}
          </Text>
        </div>
      ),
    },
    {
      title: "Assigned Users",
      dataIndex: "coupon_user",
      key: "coupon_user",
      width: "20%",
      render: (couponUsers) => {
        if (!couponUsers || couponUsers?.length === 0) {
          return <Text className="text-grayText">No assignments</Text>;
        }

        const assignedCount = couponUsers?.length;
        const appliedCount = couponUsers?.filter(
          (user) => user.stripe_coupon_apply
        )?.length;

        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Tag className="px-2 py-1 rounded-md bg-primaryOpacity text-primary">
                {assignedCount} assigned
              </Tag>
            </div>
          </div>
        );
      },
    },
    {
      title: "Created Date",
      dataIndex: "created_at",
      key: "created_at",
      width: "12%",
      render: (date) => (
        <Text className="text-grayText">
          {new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })}
        </Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      width: "8%",
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
        <div className="flex gap-2">
          <Tooltip title="Edit Coupon">
            <Button
              type="text"
              icon={<i className="icon-edit" />}
              className="text-primary hover:text-primary-dark text-lg"
              onClick={() => handleEditCoupon(record)}
              disabled={deleteCouponLoading}
            />
          </Tooltip>
          <Tooltip title="Assign Users">
            <Button
              type="text"
              icon={<UserAddOutlined />}
              className="text-primary hover:text-primary-dark text-lg"
              onClick={() => handleAssignCoupon(record)}
              disabled={deleteCouponLoading}
            />
          </Tooltip>
          <Tooltip title="Delete Coupon">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              className=" text-lg"
              onClick={() => handleDeleteCoupon(record)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  // Show initial loading for the entire component on first load
  if (initialLoading && couponsLoading && coupons === null) {
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
                Coupon Management
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
              Coupon Management
            </Text>
          </Title>
        </div>
      </Col>

      <Col span={24} className="h-full mb-4">
        <ShadowBoxContainer
          height={containerHeight}
          overflow={
            !tableLoading && coupons !== null && coupons.length === 0
              ? "hidden"
              : "auto"
          }
        >
          <>
            <div className="flex mt-0 items-center">
              <div className="text-2xl font-normal">Coupons</div>
              {coupons?.length > 0 && (
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
                    placeholder="Search Coupons"
                    className="bg-[#171717] border-[#373737] rounded-full pl-10"
                    style={{ width: "100%" }}
                    onChange={onChangeCouponSearch}
                    value={searchValue}
                    allowClear
                  />
                </div>
              </div>
              <div className="w-full md:w-auto mt-3 md:mt-0">
                <Button
                  type="primary"
                  size="large"
                  icon={<GiftOutlined />}
                  onClick={showCreateCoupon}
                  className="rounded-3xl w-full"
                >
                  Add Coupon
                </Button>
              </div>
            </div>

            {/* Table Section with conditional loading */}
            <div className="h-full">
              {tableLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Spin size="large" />
                </div>
              ) : coupons?.length > 0 ? (
                <div className="overflow-auto">
                  <Table
                    columns={columns}
                    dataSource={coupons}
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
                    className="custom-table coupon-management-table bg-[#242424] !rounded-[2rem] mb-6"
                    rowClassName="bg-[#242424] hover:bg-darkGray transition-colors"
                    scroll={{
                      x: "max-content",
                    }}
                  />
                </div>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <Empty description="No Coupons Found" />
                </div>
              )}
            </div>
          </>
        </ShadowBoxContainer>
      </Col>

      {/* Create/Update Coupon Modal */}
      <Modal
        title={modalMode === "create" ? "Create New Coupon" : "Update Coupon"}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={600}
        className="custom-modal"
        centered
      >
        {singleCouponLoading && modalMode === "update" ? (
          <div className="flex justify-center items-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFormSubmit}
            className="mt-6"
            requiredMark={false}
          >
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label={<Text type="secondary">Coupon Name</Text>}
                  name="name"
                  rules={[
                    { required: true, message: "Please enter coupon name" },
                    { min: 2, message: "Name must be at least 2 characters" },
                  ]}
                >
                  <Input size="large" placeholder="Enter Coupon Name" />
                </Form.Item>
              </Col>
            </Row>

            {modalMode === "create" && (
              <>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      label={<Text type="secondary">Coupon Code</Text>}
                      name="coupon_code"
                      rules={[
                        { required: true, message: "Please enter coupon code" },
                        {
                          min: 3,
                          message: "Code must be at least 3 characters",
                        },
                        {
                          pattern: /^\S*$/,
                          message: "Coupon code cannot contain spaces",
                        },
                      ]}
                    >
                      <Input
                        size="large"
                        placeholder="##########"
                        style={{ textTransform: "uppercase" }}
                        onChange={(e) => {
                          // Remove spaces and convert to uppercase
                          const value = e.target.value.replace(/\s/g, '').toUpperCase();
                          form.setFieldsValue({ coupon_code: value });
                        }}
                        onKeyPress={(e) => {
                          // Prevent space key from being entered
                          if (e.key === ' ') {
                            e.preventDefault();
                          }
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label={<Text type="secondary">Discount Type</Text>} name="discount_type">
                      <Select
                        size="large"
                        placeholder="Select Discount Type"
                        options={[
                          { value: "percentage", label: "Percentage" },
                          { value: "fixed_amount", label: "Fixed Amount" },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={<Text type="secondary">Discount Value</Text>}
                      name="discount_value"
                    >
                      <Input
                        type="number"
                        size="large"
                        placeholder="Enter Discount Value"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label={<Text type="secondary">Duration (Months)</Text>}
                      name="duration_months"
                    >
                      <Input
                        size="large"
                        placeholder="Enter Duration in Months"
                        min={1}
                        type="number"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}

            {modalMode === "update" && (
              <>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item label={<Text type="secondary">Coupon Code</Text>} name="coupon_code">
                      <Input
                        size="large"
                        disabled
                        style={{ textTransform: "uppercase" }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label={<Text type="secondary">Discount Type</Text>} name="discount_type">
                      <Select
                        size="large"
                        disabled
                        dropdownStyle={{
                          backgroundColor: "#212121",
                          borderRadius: "8px",
                          color: "white",
                        }}
                        options={[
                          { value: "percentage", label: "Percentage" },
                          { value: "fixed_amount", label: "Fixed Amount" },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label={<Text type="secondary">Discount Value</Text>} name="discount_value">
                      <Input size="large" disabled />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label={<Text type="secondary">Duration (Months)</Text>} name="duration_months">
                      <InputNumber size="large" disabled />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}

            <Form.Item className="mb-0 mt-6">
              <div className="flex justify-end gap-3">
                <Button
                  size="large"
                  onClick={handleModalClose}
                  className="bg-[#373737] border-[#373737] text-white hover:bg-[#4a4a4a] hover:border-[#4a4a4a]"
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  loading={
                    modalMode === "create"
                      ? createCouponLoading
                      : updateCouponLoading
                  }
                  className="bg-primary border-primary"
                >
                  {modalMode === "create" ? "Create Coupon" : "Update Coupon"}
                </Button>
              </div>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Assign Users Modal */}
      <Modal
        title="Assign Coupon to Users"
        open={isAssignModalVisible}
        onCancel={handleAssignModalClose}
        footer={null}
        width={600}
        className="custom-modal"
        centered
      >
        <div className="mb-4">
          <Text className="text-grayText">
            Assigning coupon:{" "}
            <span className="text-white font-medium">
              {selectedCoupon?.name}
            </span>
          </Text>
          <br />
          <Text className="text-grayText text-sm">
            Code: {selectedCoupon?.coupon_code}
          </Text>
        </div>

        <Form
          form={assignForm}
          layout="vertical"
          onFinish={handleAssignSubmit}
          className="mt-6"
        >
          <Form.Item label={<Text type="secondary">Select Users</Text>} name="users">
            <Select
              mode="multiple"
              placeholder="Search Users... (min. 3 characters)"
              suffixIcon={<SearchOutlined />}
              style={{ width: "100%" }}
              onChange={handleUserChange}
              onSearch={handleUserSearch}
              filterOption={false} // Disable local filtering entirely
              options={userOptions?.map((user) => ({
                value: user?.id,
                label: user?.name || "Unnamed",
              }))}
              showSearch
              className="bg-[#171717] border-[#373737] text-white"
              size="large"
              maxTagCount={6}
              notFoundContent={
                guestLoading
                  ? "Loading..."
                  : userSearchValue && userSearchValue?.trim().length < 3
                    ? "Please enter at least 3 characters"
                    : "No users found"
              }
              tagRender={(props) => {
                const { value, closable, onClose } = props;
                const user =
                  userOptions?.find((u) => u?.id === value) ||
                  selectedUsers?.find((u) => u?.id === value);
                return (
                  <Tag
                    closable={closable}
                    onClose={onClose}
                    style={{ marginRight: 3, marginBottom: 3 }}
                    className="bg-primaryOpacity text-primary border-none"
                  >
                     {user
                      ? truncateName(user.name)
                      : +`${selectedUsers.length - 6}`} 
                  
                  </Tag>
                );
              }}
            />
          </Form.Item>

          <Form.Item className="mb-0 mt-6">
            <div className="flex justify-end gap-3">
              <Button
                size="large"
                onClick={handleAssignModalClose}
                className="bg-[#373737] border-[#373737] text-white hover:bg-[#4a4a4a] hover:border-[#4a4a4a]"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={assignCouponLoading}
                className="bg-primary border-primary"
              >
                Assign Coupon
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Delete Coupon Modal */}
      <Modal
        title="Delete Coupon"
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
                Are you sure you want to delete this coupon?
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
                loading={deleteCouponLoading}
              >
                Confirm Deletion
              </Button>
            </Col>
          </Row>
        </div>
      </Modal>


      <Modal
        title="Coupon Assignment Summary"
        centered
        destroyOnClose
        open={isNotificationModal}
        footer={false}
        onCancel={handleCancelNotification}
        closeIcon={
          <Button
            shape="circle"
            icon={<i className="icon-close before:!m-0 text-sm" />}
          />
        }
      >
        <div className="border-t-2 border-solid border-[#373737] mt-5">
          <Row gutter={16} className="">
            <div className="w-full pt-5 ">
              {assignResponse?.message?.success_msg?.length > 0 ?
                <>
                  <div>Success:</div>
                  <Alert className="mb-3" message={assignResponse?.message?.success_msg} type="success" showIcon />
                  <div className="mb-5"></div>
                </>
                : null}

              {
                assignResponse?.message?.users_with_other_coupons?.length > 0 ?
                  <>
                    <div>Not Assigned:</div>
                    {
                      assignResponse?.message?.users_with_other_coupons?.map((item) => (
                        <Alert className="mb-3" key={Math.random} message={item} type="info" showIcon />
                      )
                      )

                    }
                    <div className="mb-5"></div>
                  </>
                  : null
              }
              {
                assignResponse?.message?.error_msg?.length > 0 ?
                  <>
                    <div>Skipped:</div>
                    <Alert className="mb-3" message={assignResponse?.message?.error_msg} type="error" showIcon />
                  </>
                  : null
              }
            </div>
          </Row>
        </div>
      </Modal>
    </Row>
  );
};

export default CouponManagement;