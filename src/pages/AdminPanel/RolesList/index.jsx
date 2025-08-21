import React, { useState, useEffect, useRef } from "react";
import "./RoleList.scss";
import {
  Typography,
  Row,
  Col,
  Table,
  Button,
  Tag,
  Select,
  Spin,
  Empty,
  Input,
} from "antd";
import {
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  KeyOutlined,
  SearchOutlined,
  CaretRightOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import ShadowBoxContainer from "../../../components/AuthLayout/ShadowBoxContainer";
import { useDispatch, useSelector } from "react-redux";
import { fetchRolesList } from "../../../services/Store/Permission/action";
import Loading from "../../../components/AuthLayout/Loading";

const { Text, Title } = Typography;

const RolesList = () => {
  const dispatch = useDispatch();
  const { rolesListLoading } = useSelector((state) => state?.permissions);

  // State for roles data and filters
  const [roles, setRoles] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: undefined,
    search: "",
  });
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");

  // Debounce search with useRef to store timeout ID
  const searchTimeoutRef = useRef(null);
  const [searchValue, setSearchValue] = useState("");
  
  // Add ref for search input and focus tracking
  const searchInputRef = useRef(null);
  const shouldMaintainFocus = useRef(false);

  // Fetch roles based on current filters and pagination
  const fetchRoles = (page = 1, pageSize = 10) => {
    const params = {
      page: page.toString(),
      per_page: pageSize.toString(),
      ...(filters.status !== undefined && { status: filters.status }),
      ...(filters.search && { search: filters.search }),
    };

    dispatch(fetchRolesList(params)).then((res) => {
      if (res?.payload?.data) {
        setRoles(res?.payload?.data?.roles || []);
        const paginationData = res?.payload?.data?.pagination;
        setPagination({
          current: paginationData?.currentPage,
          pageSize: paginationData?.perPage,
          total: paginationData?.totalRecords,
        });
        
        // Restore focus if needed
        if (shouldMaintainFocus.current && searchInputRef.current) {
          setTimeout(() => {
            searchInputRef.current.focus();
            shouldMaintainFocus.current = false;
          }, 0);
        }
      }
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
  // Initial fetch
  useEffect(() => {
    fetchRoles();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchRoles(1); // Reset to first page when filters change
  }, [filters]);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Navigate to role form page (handles both create and edit)
  const navigate = useNavigate();

  // Handle edit role - navigate to role form page with roleId
  const handleEditRole = (role) => {
    navigate(`/admin/roles/${role.id}`);
  };

  // Handle create new role - navigate to role form page without roleId
  const showCreateRole = () => {
    navigate("/admin/roles/new");
  };

  // Handle table pagination change
  const handleTableChange = (pagination) => {
    fetchRoles(pagination.current, pagination.pageSize);
  };

  // Handle status filter change
  const onChangeRoleStatus = (value) => {
    setFilters((prev) => ({ ...prev, status: value }));
  };

  // Handle search input change with debouncing
  const onChangeRoleSearch = (e) => {
    const value = e.target.value;
    setSearchValue(value);

    // Set focus flag when user is typing
    shouldMaintainFocus.current = true;

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Only update filters if search value is empty or has at least 3 characters
    if (value === "" || value.length >= 3) {
      // Set a new timeout for 500ms
      searchTimeoutRef.current = setTimeout(() => {
        setFilters((prev) => ({ ...prev, search: value }));
      }, 500);
    }
  };

  // Table columns
  const columns = [
    {
      title: "SR.No.",
      dataIndex: "id",
      key: "id",
      width: "10%",
      render: (text, record, index) => (
        <Text className="text-white">
          {(pagination.current - 1) * pagination.pageSize + index + 1}
        </Text>
      ),
    },
    {
      title: "Role Name",
      dataIndex: "full_name",
      key: "full_name",
      width: "30%",
      render: (text, record) => (
        <div className="flex items-center">
          <Text className="text-white font-medium text-base">
            {record?.full_name || text}
          </Text>
        </div>
      ),
    },
    {
      title: "Date of Creation",
      dataIndex: "created_at",
      key: "created_at",
      width: "25%",
      render: (text) => (
        <Text className="text-white">
          {text
            ? new Date(text).toLocaleDateString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })
            : ""}
        </Text>
      ),
    },
    {
      title: "Status",
      key: "status",
      dataIndex: "status",
      width: "15%",
      render: (status) =>
        status ? (
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
      width: "10%",
      render: (_, record) => (
        <div className="flex">
          <Button
            type="text"
            icon={<i className="icon-edit" />}
            className="text-lg"
            onClick={() => handleEditRole(record)}
          />
          {/* <Button
            type="text"
            icon={<DeleteOutlined />}
            className="text-red-500 hover:text-red-700 text-lg"
          // onClick={() => handleDeleteRole(record)}
          // disabled={record.name === "A"} // Prevent deleting Administrator
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
              Roles & Permissions
            </Text>
          </Title>
        </div>
      </Col>

      <Col span={24} className="h-full mb-4">
        <ShadowBoxContainer height={containerHeight}>
          <>
            {rolesListLoading || roles === null ? (
              <Loading />
            ) : (
              <>
                <div className="flex mt-0 items-center">
                  <div className="text-2xl font-normal">Roles</div>
                  {roles?.length > 0 && (
                    <>
                      <span className="mx-3  text-grayText">&#8226;</span>
                      <div className="bg-primaryOpacity rounded-lg px-3 py-1 text-primary">
                        {pagination?.total || ""}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex flex-col md:flex-row justify-between gap-3 mb-6 pt-6">
                  <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
                    <div className="relative w-full md:max-w-md">
                      <Input
                        ref={searchInputRef}
                        size="large"
                        prefix={
                          <SearchOutlined className="absolute left-4 top-1/2 text-xl transform -translate-y-1/2 text-grayText" />
                        }
                        placeholder="Search Role"
                        className="bg-[#171717] border-[#373737] rounded-full pl-10"
                        style={{ width: "100%" }}
                        onChange={onChangeRoleSearch}
                        value={searchValue}
                        allowClear
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 ">
                      <Select
                        size="large"
                        placeholder="Filter by Status"
                        value={filters?.status}
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
                          { value: true, label: "Active" },
                          { value: false, label: "Inactive" },
                        ]}
                        onChange={onChangeRoleStatus}
                        allowClear
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-auto mt-3 md:mt-0">
                    <Button
                      type="primary"
                      size="large"
                      icon={<PlusOutlined />}
                      onClick={showCreateRole}
                      className="rounded-3xl w-full"
                    >
                      Add Role
                    </Button>
                  </div>
                </div>
                <div className="h-full">
                  {rolesListLoading || roles === null ? (
                    <Loading />
                  ) : roles?.length > 0 ? (
                    <div className="overflow-auto">
                      <Table
                        columns={columns}
                        dataSource={roles}
                        rowKey="id"
                        loading={rolesListLoading}
                        pagination={{
                          current: pagination.current,
                          pageSize: pagination.pageSize,
                          total: pagination.total,
                          position: ["bottomRight"],
                          showSizeChanger: false,
                          className: "custom-pagination flex-wrap-pagination",
                          showTotal: (total, range) => (
                            <div className="text-grayText w-full text-center md:text-left mb-4 md:mb-0">
                              Showing {range[0]}-{range[1]} of {total} results
                            </div>
                          ),
                          onChange: (page) => {
                            fetchRoles(page, pagination.pageSize);
                          },
                        }}
                        onChange={handleTableChange}
                        className="custom-table roles-table bg-[#242424] !rounded-[2rem] mb-6"
                        rowClassName="bg-[#242424] hover:bg-darkGray transition-colors"
                        scroll={{
                          x: "max-content",
                          // y: "calc(100vh - 420px)",
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <Empty description="No Roles Found" />
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

export default RolesList;