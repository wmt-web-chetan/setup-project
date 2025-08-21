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
  Empty,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCoachingPrograms } from "../../../services/Store/CoachingProgram/action";
import ShadowBoxContainer from "../../../components/AuthLayout/ShadowBoxContainer";

const { Text, Title } = Typography;

const CoachingProgramManagement = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  
  // Check if we're in admin mode based on current path
  const isAdminMode = location.pathname.includes('/admin/');

  // Get coaching programs data from Redux store
  const { coachingProgramsLoading } = useSelector((state) => state?.coachingPrograms);

  // State for coaching programs data and filters
  const [coachingPrograms, setCoachingPrograms] = useState(null);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    search: "",
  });

  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  // Debounce search with useRef to store timeout ID
  const searchTimeoutRef = useRef(null);
  const [searchValue, setSearchValue] = useState("");

  // Helper functions for dynamic navigation
  const getDashboardLink = () => {
    return isAdminMode ? '/admin' : '/dashboard';
  };

  const getCoachingProgramNewPath = () => {
    return isAdminMode ? '/admin/coaching-program-management/new' : '/coaching-program-management/new';
  };

  const getCoachingProgramEditPath = (programId) => {
    return isAdminMode ? `/admin/coaching-program-management/${programId}` : `/coaching-program-management/${programId}`;
  };

  const getCoachingProgramViewPath = (programId) => {
    return isAdminMode ? `/admin/coaching-program/${programId}/view` : `/coaching-program/${programId}/view`;
  };

  // Fetch coaching programs based on current tableParams
  const fetchCoachingProgramsData = () => {
    const params = {
      page: tableParams.pagination.current.toString(),
      per_page: tableParams.pagination.pageSize.toString(),
      is_active: "all",
      ...(tableParams.search && { search: tableParams.search }),
    };

    dispatch(fetchCoachingPrograms(params)).then((res) => {
      if (res?.payload?.data?.coaching_programs) {
        setCoachingPrograms(res?.payload?.data?.coaching_programs || []);
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
    });
  };

  // Initial fetch
  useEffect(() => {
    fetchCoachingProgramsData();
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

  // Refetch when tableParams change (pagination, search, etc.)
  useEffect(() => {
    fetchCoachingProgramsData();
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

  // Handle create new coaching program
  const showCreateCoachingProgram = () => {
    navigate(getCoachingProgramNewPath());
  };

  // Handle view coaching program
  const handleViewCoachingProgram = (program) => {
    navigate(getCoachingProgramViewPath(program.id));
  };

  // Handle edit coaching program
  const handleEditCoachingProgram = (program) => {
    navigate(getCoachingProgramEditPath(program.id));
  };

  // Handle delete coaching program
  const handleDeleteCoachingProgram = (program) => {
    // Add delete functionality here
    // console.log("Delete program:", program);
  };

  // Handle table pagination change
  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({
      ...tableParams,
      pagination,
    });
  };

  // Handle search input change with debouncing
  const onChangeCoachingProgramSearch = (e) => {
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

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      ? name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
      : "CP"; // Default for Coaching Program
  };

  // Table columns
  const columns = [
    {
      title: "Program Details",
      dataIndex: "name",
      key: "name",
      width: "35%",
      render: (text, record) => (
        <div className="flex items-center">
          {record?.thumbnail_img ? (
            <Avatar
              size={40}
              src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${record?.thumbnail_img
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
              {getInitials(text)}
            </Avatar>
          )}

          <div>
            <Text className="text-white font-medium text-base">
              {text?.length >= 25 ? text?.slice(0, 23) + "..." : text}
            </Text>
            <div className="flex items-center">
              <Text className="text-grayText text-sm">
                {record?.academy_name?.length >= 25
                  ? record?.academy_name?.slice(0, 23) + "..."
                  : record?.academy_name}
              </Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: "25%",
      render: (text) => (
        <div className="flex items-center">
          <Text className="text-grayText">
            {text?.length >= 30 ? text?.slice(0, 28) + "..." : text}
          </Text>
        </div>
      ),
    },
    {
      title: "Website",
      dataIndex: "website_url",
      key: "website_url",
      width: "25%",
      render: (text) => (
        <div className="flex items-center">
          {text ? (
            <a
              href={text}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <Text className="text-primary hover:text-blue-600">
                <GlobalOutlined className="mr-2 text-primary" />
                {text?.length >= 25 ? text?.slice(0, 23) + "..." : text}
              </Text>
            </a>
          ) : (
            <Text className="text-grayText">No website</Text>
          )}
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
          {/* <Button
            type="text"
            icon={<EyeOutlined />}
            className="text-blue-500 hover:text-blue-600 text-lg"
            onClick={() => handleViewCoachingProgram(record)}
            title="View"
          /> */}
          <Button
            type="text"
            icon={<EditOutlined />}
            className="text-primary text-lg"
            onClick={() => handleEditCoachingProgram(record)}
            title="Edit"
          />
          {/* <Button
            type="text"
            icon={<DeleteOutlined />}
            className="text-red-500 hover:text-red-600 text-lg"
            onClick={() => handleDeleteCoachingProgram(record)}
            title="Delete"
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
              Coaching Programs
            </Text>
          </Title>
        </div>
      </Col>

      <Col span={24} className="h-full mb-4">
        <ShadowBoxContainer
          height={containerHeight}
          overflow={
            !coachingProgramsLoading && coachingPrograms !== null && coachingPrograms.length === 0
              ? "hidden"
              : "auto"
          }
        >
          <>
            {coachingProgramsLoading || coachingPrograms === null ? (
              <div className="loadingClass">
                <Spin size="large" />
              </div>
            ) : (
              <>
                <div className="flex mt-0 items-center">
                  <div className="text-2xl font-normal">Coaching Programs</div>
                  {coachingPrograms?.length > 0 && (
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
                        placeholder="Search Coaching Programs"
                        className="bg-[#171717] border-[#373737] rounded-full pl-10"
                        style={{ width: "100%" }}
                        onChange={onChangeCoachingProgramSearch}
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
                      onClick={showCreateCoachingProgram}
                      className="rounded-3xl w-full"
                    >
                      Add Coaching Program
                    </Button>
                  </div>
                </div>
                <div className="h-full">
                  {coachingProgramsLoading || coachingPrograms === null ? (
                    <div className="loadingClass">
                      <Spin size="large" />
                    </div>
                  ) : coachingPrograms?.length > 0 ? (
                    <div className="overflow-auto">
                      <Table
                        columns={columns}
                        dataSource={coachingPrograms}
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
                        className="custom-table coaching-program-table bg-[#242424] !rounded-[2rem] mb-6"
                        rowClassName="bg-[#242424] hover:bg-darkGray transition-colors"
                        scroll={{
                          x: "max-content",
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <Empty description="No Coaching Programs Found" />
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

export default CoachingProgramManagement;