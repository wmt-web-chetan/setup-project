import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  Row,
  Col,
  Table,
  Button,
  Tag,
  Avatar,
  Spin,
  Input,
  Select,
  Empty,
  Popover,
} from "antd";
import {
  ShopOutlined,
  PlusOutlined,
  SearchOutlined,
  CaretRightOutlined,
  StarOutlined,
  StarFilled,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchVendorsList } from "../../../services/Store/VendorAdmin/action";
import ShadowBoxContainer from "../../../components/AuthLayout/ShadowBoxContainer";

const { Text, Title } = Typography;

const VendorStoreManagement = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const isAdminMode = location.pathname.includes("/admin/");

  // Get vendors data from Redux store
  const { vendorsListLoading } = useSelector(
    (state) => state?.vendorStoreCategories
  );

  // State for vendors data and filters
  const [vendors, setVendors] = useState(null);
  const [tableLoading, setTableLoading] = useState(false); // New state for table-specific loading
  const [initialLoading, setInitialLoading] = useState(true); // Track initial page load
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    filters: {
      is_preferred: undefined,
    },
    search: "",
  });

  // State for popover visibility
  const [popoverVisibleMap, setPopoverVisibleMap] = useState({});

  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  // Debounce search with useRef to store timeout ID
  const searchTimeoutRef = useRef(null);
  const [searchValue, setSearchValue] = useState("");
  
  // Helper functions for dynamic navigation
  const getDashboardLink = () => {
    return isAdminMode ? "/admin" : "/dashboard";
  };

  const getVendorStoreNewPath = () => {
    return isAdminMode
      ? "/admin/vendor-store-management/new"
      : "/vendor-store-management/new";
  };

  const getVendorStoreEditPath = (vendorId) => {
    return isAdminMode
      ? `/admin/vendor-store-management/${vendorId}`
      : `/vendor-store-management/${vendorId}`;
  };

  const getVendorStoreSuggestionsPath = () => {
    return isAdminMode
      ? "/admin/vendor-store-management/view-suggestions"
      : "/vendor-store-management/view-suggestions";
  };
  
  // Fetch vendors based on current tableParams
  const fetchVendors = (isSearch = false, isFilter = false) => {
    const params = {
      page: tableParams.pagination.current.toString(),
      per_page: tableParams.pagination.pageSize.toString(),
      is_active: "all",
      ...(tableParams.filters.is_preferred !== undefined && {
        is_preferred: tableParams.filters.is_preferred,
      }),
      ...(tableParams.search && { search: tableParams.search }),
    };

    // Set appropriate loading state
    if (isSearch || isFilter || vendors !== null) {
      setTableLoading(true);
    }

    dispatch(fetchVendorsList(params)).then((res) => {
      if (res?.payload?.data?.vendors) {
        setVendors(res?.payload?.data?.vendors || []);
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

  // Refetch when tableParams change (pagination, filters, etc.)
  useEffect(() => {
    const isSearch = tableParams.search !== "";
    const isFilter = tableParams.filters.is_preferred !== undefined;
    fetchVendors(isSearch, isFilter);
  }, [
    tableParams.pagination.current,
    tableParams.pagination.pageSize,
    tableParams.filters.is_preferred,
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

  // Handle create new vendor
  const showCreateVendor = () => {
    navigate(getVendorStoreNewPath());
  };

  // Handle view suggestions
  const handleViewSuggestions = () => {
    navigate(getVendorStoreSuggestionsPath());
  };

  // Handle edit vendor
  const handleEditVendor = (vendor) => {
    navigate(getVendorStoreEditPath(vendor.id));
  };

  // Handle table pagination and filtering change
  const handleTableChange = (pagination, filters, sorter) => {
    // Close all popovers when table changes
    setPopoverVisibleMap({});

    setTableParams({
      ...tableParams,
      pagination,
      // We don't update filters here as we're handling them separately
    });
  };

  // Handle preferred status filter change
  const onChangeVendorStatus = (value) => {
    setTableParams({
      ...tableParams,
      pagination: {
        ...tableParams.pagination,
        current: 1, // Reset to first page when filter changes
      },
      filters: {
        ...tableParams.filters,
        is_preferred: value,
      },
    });
  };

  // Handle search input change with debouncing
  const onChangeVendorSearch = (e) => {
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

  // Handle popover visibility changes
  const handlePopoverVisibleChange = (visible, vendorId) => {
    // Update visibility in state
    setPopoverVisibleMap((prev) => ({
      ...prev,
      [vendorId]: visible,
    }));
  };

  // Component to render a single category tag
  const CategoryTag = ({ category }) => (
    <Tag
      key={category.id}
      className="px-2 py-1 rounded-md bg-gray text-white mr-2"
    >
      <Text className="text-white">{category.name}</Text>
    </Tag>
  );

  // Component to render all categories in a popover
  const AllCategoriesContent = ({ categories }) => (
    <div className=" p-3">
      <div className="font-medium mb-2">All Categories:</div>
      <div className="flex flex-wrap gap-2">
        {categories?.map((category) => (
          <CategoryTag key={category.id} category={category} />
        ))}
      </div>
    </div>
  );

  // Table columns
  const columns = [
    {
      title: "Vendor Name",
      dataIndex: "vendor_name",
      key: "vendor_name",
      width: "25%",
      render: (text, record) => (
        <div className="flex items-center">
          {record?.logo_path ? (
            <Avatar
              size={40}
              src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                record?.logo_path
              }`}
              style={{
                backgroundColor: "#373737",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginRight: "12px",
              }}
            />
          ) : (
            <Avatar
              size={40}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginRight: "12px",
              }}
              className="bg-primaryOpacity !rounded-full"
            >
              {record?.vendor_name?.[0]}
              {/* {getInitials(text)} */}
            </Avatar>
          )}

          <div>
            <Text className="text-white font-medium text-base">
              {text?.length >= 22 ? text?.slice(0, 20) + "..." : text}
            </Text>
            {record?.website && (
              <div className="flex items-center">
                <Text className="text-grayText text-sm">
                  {record?.website?.length >= 25
                    ? record?.website?.slice(0, 23) + "..."
                    : record?.website}
                </Text>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Categories",
      dataIndex: "categories",
      key: "categories",
      width: "30%",
      render: (categories, record) => {
        // Check if categories exist
        if (
          !categories ||
          !Array.isArray(categories) ||
          categories?.length === 0
        ) {
          return <Text className="text-grayText">No categories assigned</Text>;
        }

        // Only show first 2 categories directly in the table
        const visibleCategories = categories?.slice(0, 2);
        const remainingCategories = categories?.slice(2);
        const hasMoreCategories = remainingCategories.length > 0;

        return (
          <div className="flex items-center">
            <div
              className="flex items-center overflow-x-auto"
              style={{ whiteSpace: "nowrap" }}
            >
              {visibleCategories?.map((category) => (
                <CategoryTag key={category.id} category={category} />
              ))}

              {hasMoreCategories && (
                <Popover
                  content={<AllCategoriesContent categories={categories} />}
                  title={null}
                  trigger="click"
                  placement="bottom"
                  className="categories-popover"
                  autoAdjustOverflow={true}
                  open={popoverVisibleMap[record.id] || false}
                  onOpenChange={(visible) =>
                    handlePopoverVisibleChange(visible, record.id)
                  }
                  overlayInnerStyle={{ maxWidth: "480px" }}
                  align={{
                    overflow: {
                      adjustX: true,
                      adjustY: true,
                      alwaysByViewport: true,
                    },
                  }}
                >
                  <Tag
                    className="px-2 py-1 rounded-md bg-gray text-white mr-2 cursor-pointer"
                    style={{ backgroundColor: "#4A4A4A" }}
                  >
                    <PlusOutlined className="mr-1" />
                    <Text className="text-white">
                      {remainingCategories?.length} more
                    </Text>
                  </Tag>
                </Popover>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "is_preferred",
      key: "is_preferred",
      width: "10%",
      render: (isPreferred, record) => {
        const isNew = record?.is_new;
        return (
          <div className="flex flex-col gap-1">
            {isPreferred ? (
              <Tag
                className="px-2 py-1 rounded-md bg-gray text-white flex items-center w-fit"
                style={{ borderLeft: `3px solid #5A76FF` }}
              >
                <StarFilled className="mr-1 text-[#5A76FF]" />
                Preferred
              </Tag>
            ) : (
              <Tag
                className="px-2 py-1 rounded-md bg-gray text-white flex items-center w-fit"
                style={{ borderLeft: `3px solid #6B7280` }}
              >
                <StarOutlined className="mr-1" />
                Standard
              </Tag>
            )}
          </div>
        );
      },
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
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<i className="icon-edit" />}
            className="text-primary hover:text-primary-dark text-lg"
            onClick={() => handleEditVendor(record)}
            title="Edit Vendor"
          />
        </div>
      ),
    },
  ];

  // Close popovers when table is scrolled
  const onScrollVendorTable = () => {
    if (Object.values(popoverVisibleMap).some((isOpen) => isOpen)) {
      setPopoverVisibleMap({});
    }
  };

  // Show initial loading for the entire component on first load
  if (initialLoading && vendorsListLoading && vendors === null) {
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
                Vendor Management
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
              Vendor Management
            </Text>
          </Title>
        </div>
      </Col>

      <Col span={24} className="h-full mb-4">
        <ShadowBoxContainer
          height={containerHeight}
          overflow={
            !tableLoading && vendors !== null && vendors.length === 0
              ? "hidden"
              : "auto"
          }
        >
          <>
            <div className="flex mt-0 items-center">
              <div className="text-2xl font-normal">Vendors</div>
              {vendors?.length > 0 && (
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
                    placeholder="Search Vendors"
                    className="bg-[#171717] border-[#373737] rounded-full pl-10"
                    style={{ width: "100%" }}
                    onChange={onChangeVendorSearch}
                    value={searchValue}
                    allowClear
                  />
                </div>
                <div className="w-full md:w-auto">
                  <Select
                    size="large"
                    placeholder="Filter by Status"
                    value={tableParams?.filters?.is_preferred}
                    style={{ width: "160px" }}
                    className="bg-[#373737] rounded-full text-white filterSelection"
                    dropdownStyle={{
                      backgroundColor: "#212121",
                      borderRadius: "8px",
                      color: "white",
                    }}
                    filterOption={(input, option) =>
                      (option?.label || "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    suffixIcon={
                      <CaretRightOutlined className="rotate-90 text-white" />
                    }
                    options={[
                      { value: true, label: "Preferred" },
                      { value: false, label: "Standard" },
                    ]}
                    onChange={onChangeVendorStatus}
                    allowClear
                  />
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto mt-3 md:mt-0">
                <Button
                  size="large"
                  icon={<EyeOutlined />}
                  onClick={handleViewSuggestions}
                  className="rounded-3xl w-full md:w-auto text-white"
                >
                  View Suggestions
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={showCreateVendor}
                  className="rounded-3xl w-full md:w-auto"
                >
                  Add Vendor
                </Button>
              </div>
            </div>
            
            {/* Table Section with conditional loading */}
            <div className="h-full">
              {tableLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Spin size="large" />
                </div>
              ) : vendors?.length > 0 ? (
                <div className="overflow-auto">
                  <Table
                    columns={columns}
                    dataSource={vendors}
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
                    className="custom-table vendor-management-table bg-[#242424] !rounded-[2rem] mb-6"
                    rowClassName="bg-[#242424] hover:bg-darkGray transition-colors"
                    scroll={{
                      x: "max-content",
                    }}
                    onScroll={onScrollVendorTable}
                  />
                </div>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <Empty description="No Vendors Found" />
                </div>
              )}
            </div>
          </>
        </ShadowBoxContainer>
      </Col>
    </Row>
  );
};

export default VendorStoreManagement;