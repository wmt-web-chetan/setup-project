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
  Modal,
  Divider,
  Switch,
} from "antd";
import {
  CalendarOutlined,
  PlusOutlined,
  SearchOutlined,
  CaretRightOutlined,
  TeamOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
// import "./MeetingManagement.scss";
import ShadowBoxContainer from "../../../components/AuthLayout/ShadowBoxContainer";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { fetchMeetings } from "../../../services/Store/Chat/action";
import "./MeetingModule.scss";
import { deleteMeetingAction, statusMeetingAction } from "../../../services/Store/Calender/action";

const { Text, Title } = Typography;

const MeetingModule = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get meetings data from Redux store
  const { meetingsLoading } = useSelector((state) => state?.meetings);

  // State for meetings data and filters
  const [meetings, setMeetings] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    filters: {
      tag_id: undefined,
    },
    search: "",
  });

  // State for modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedMeetingWithDelete, setSelectedMeetingWithDelete] = useState(null);

  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  // Debounce search with useRef to store timeout ID
  const searchTimeoutRef = useRef(null);
  const [searchValue, setSearchValue] = useState("");

  // Fetch meetings based on current tableParams
  const fetchMeetingsData = () => {
    const params = {
      page: tableParams.pagination.current.toString(),
      per_page: tableParams.pagination.pageSize.toString(),
      ...(tableParams.filters.tag_id !== undefined && {
        tag_id: tableParams.filters.tag_id,
      }),
      ...(tableParams.search && { search: tableParams.search }),
    };

    dispatch(fetchMeetings(params)).then((res) => {
      if (res?.payload?.data?.meetings) {
        const meetingsData = res?.payload?.data?.meetings || [];
        setMeetings(meetingsData);

        // Extract unique tags for filter dropdown
        const uniqueTags = meetingsData
          .filter((meeting) => meeting?.tag)
          .reduce((acc, meeting) => {
            const existingTag = acc.find((tag) => tag.id === meeting.tag.id);
            if (!existingTag) {
              acc.push(meeting.tag);
            }
            return acc;
          }, []);
        setAvailableTags(uniqueTags);

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
    fetchMeetingsData();
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
    fetchMeetingsData();
  }, [
    tableParams.pagination.current,
    tableParams.pagination.pageSize,
    tableParams.filters.tag_id,
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

  // Status mapping for display
  const statusMap = {
    scheduled: { label: "Scheduled", color: "#4CAF50" },
    ongoing: { label: "Ongoing", color: "#FF9800" },
    completed: { label: "Completed", color: "#2196F3" },
    cancelled: { label: "Cancelled", color: "#F44336" },
  };

  // Handle create new meeting - Navigate to create meeting page
  const showCreateMeeting = () => {
    navigate("/admin/meeting-management/new");
  };

  // Handle view meeting details - Open modal
  const handleViewMeeting = (meeting) => {
    setSelectedMeeting(meeting);
    setIsModalVisible(true);
  };

  const onClickDelete = (record) => {
    setSelectedMeetingWithDelete(record)
    setIsDeleteModalVisible(true)
  }

  const handleCancelDelete = () => {
    setSelectedMeetingWithDelete(null)
    setIsDeleteModalVisible(false)
  }

  const handleConfirmDelete = () => {
    dispatch(deleteMeetingAction(selectedMeetingWithDelete?.id)).then((res) => {
      if (res?.payload?.meta?.status === 200) {
        console.log('Delete Success')
        // Refetch meetings data to show updated list
        fetchMeetingsData();
      }
    })
    setIsDeleteModalVisible(false)
  }

  // Handle modal close
  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedMeeting(null);
  };

  // Handle table pagination and filtering change
  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({
      ...tableParams,
      pagination,
    });
  };

  // Handle tag filter change
  const onChangeMeetingTag = (value) => {
    setTableParams({
      ...tableParams,
      pagination: {
        ...tableParams.pagination,
        current: 1, // Reset to first page when filter changes
      },
      filters: {
        ...tableParams.filters,
        tag_id: value,
      },
    });
  };

  // Handle search input change with debouncing
  const onChangeMeetingSearch = (e) => {
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

  // Format date and time
  const formatDateTime = (dateTime) => {
    return dayjs(dateTime).format("MM/DD/YYYY hh:mm A");
  };

  const onChange = (check, status) => {
    console.log(`switch to ${check} `, status);
    dispatch(statusMeetingAction({ id: status?.id, is_active: check ? 1 : 0 }))
  };

  // Table columns
  const columns = [
    {
      title: "Meeting Title",
      dataIndex: "title",
      key: "title",
      width: "20%",
      render: (text, record) => (
        <div className="flex flex-col">
          <Text className="text-white font-medium text-base">
            {text?.length >= 30 ? text?.slice(0, 28) + "..." : text}
          </Text>
          {record?.tag?.name && (
            <Tag
              className="text-xs mt-1 rounded-md px-2 py-1 border-0 font-medium w-fit"
              style={{
                backgroundColor: `${record?.tag?.color}10`,
                color: record?.tag?.color,
              }}
            >
              {record?.tag?.name}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Date & Time",
      dataIndex: "start_time",
      key: "start_time",
      width: "20%",
      render: (text, record) => (
        <div className="flex flex-col">
          <Text className="text-white text-sm">{formatDateTime(text)}</Text>
          <Text className="text-grayText text-xs">
            to {dayjs(record?.end_time).format("hh:mm A")}
          </Text>
        </div>
      ),
    },
    {
      title: "Created By",
      dataIndex: "creator",
      key: "creator",
      width: "20%",
      render: (creator) => (
        <div className="flex items-center">
          {creator?.profile_photo_path ? (
            <Avatar
              size={32}
              src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${creator.profile_photo_path}`}
              className="mr-2"
            />
          ) : (
            <Avatar
              size={32}
              className="bg-primaryOpacity mr-2"
            >
              {creator?.name?.[0]}
            </Avatar>
          )}
          <div>
            <Text className="text-white text-sm">
              {creator?.name?.length >= 15 ? creator?.name?.slice(0, 13) + "..." : creator?.name}
            </Text>
          </div>
        </div>
      ),
    },

    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "15%",
      render: (status) => {
        const statusInfo = statusMap[status] || {
          label: status,
          color: "#666",
        };
        return (
          <Tag
            className="px-2 py-1 rounded-md bg-gray text-white"
            style={{ borderLeft: `3px solid ${statusInfo.color}` }}
          >
            {statusInfo.label}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: "15%",
      render: (_, record) => (
        <div className="flex items-center">
          <Switch onChange={(check) => onChange(check, record)} defaultChecked={record?.is_active} className="mr-2"/>
          <Button
            type="text"
            icon={<EyeOutlined />}
            className="text-primary text-lg"
            onClick={() => handleViewMeeting(record)}
            title="View Details"
          />
          <Button
            type="text"
            icon={<i className="icon-delete " />}
            className="text-error text-lg"
            onClick={() => onClickDelete(record)}
            title="Delete Meeting"
          />
        </div>
      ),
    },
  ];

  // Close popovers when table is scrolled
  //   const onScrollMeetingTable = () => {
  //     if (Object.values(popoverVisibleMap).some((isOpen) => isOpen)) {
  //       setPopoverVisibleMap({});
  //     }
  //   };

  return (
    <Row className="bg-darkGray px-header-wrapper h-full w-full flex flex-col gap-3 sm:gap-6">
      <div className="w-full"></div>

      <Modal
        title="Delete Meeting"
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
                Are you sure you want to delete this Meeting?
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
              Meeting Module
            </Text>
          </Title>
        </div>
      </Col>

      <Col span={24} className="h-full mb-4">
        <ShadowBoxContainer
          height={containerHeight}
          overflow={
            !meetingsLoading && meetings !== null && meetings.length === 0
              ? "hidden"
              : "auto"
          }
        >
          <>
            {meetingsLoading || meetings === null ? (
              <div className="loadingClass">
                <Spin size="large" />
              </div>
            ) : (
              <>
                <div className="flex mt-0 items-center">
                  <div className="text-2xl font-normal">Meetings</div>
                  {meetings?.length > 0 && (
                    <>
                      <span className="mx-3 text-grayText">&#8226;</span>
                      <div className="bg-primaryOpacity rounded-lg px-3 py-1 text-primary">
                        {tableParams.pagination.total || ""}
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
                        placeholder="Search Meetings"
                        className="bg-[#171717] border-[#373737] rounded-full pl-10"
                        style={{ width: "100%" }}
                        onChange={onChangeMeetingSearch}
                        value={searchValue}
                        allowClear
                      />
                    </div>
                    <div className="w-full md:w-auto">
                      <Select
                        size="large"
                        placeholder="Filter by Tag"
                        value={tableParams?.filters?.tag_id}
                        className="bg-[#373737] rounded-full text-white filterSelection"
                        dropdownStyle={{
                          backgroundColor: "#212121",
                          borderRadius: "8px",
                          color: "white",
                          minWidth: '280px', // Ensure dropdown is wide enough to show full text
                          maxWidth: '400px', // Prevent it from being too wide
                        }}
                        filterOption={(input, option) =>
                          (option?.label || "")
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        suffixIcon={
                          <CaretRightOutlined className="rotate-90 text-white" />
                        }
                        options={availableTags?.map((tag) => ({
                          value: tag.id,
                          label: tag.name,
                        }))}
                        onChange={onChangeMeetingTag}
                        allowClear
                        dropdownMatchSelectWidth={false} // Allow dropdown to be wider than select
                      />
                    </div>
                  </div>
                  {/* <div className="w-full md:w-auto mt-3 md:mt-0">
                    <Button
                      type="primary"
                      size="large"
                      icon={<CalendarOutlined />}
                      onClick={showCreateMeeting}
                      className="rounded-3xl w-full"
                    >
                      Schedule Meeting
                    </Button>
                  </div> */}
                </div>
                <div className="h-full">
                  {meetingsLoading || meetings === null ? (
                    <div className="loadingClass">
                      <Spin size="large" />
                    </div>
                  ) : meetings?.length > 0 ? (
                    <div className="overflow-auto">
                      <Table
                        columns={columns}
                        dataSource={meetings}
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
                        className="custom-table meeting-management-table bg-[#242424] !rounded-[2rem] mb-6"
                        rowClassName="bg-[#242424] hover:bg-darkGray transition-colors"
                        scroll={{
                          x: "max-content",
                        }}
                      // onScroll={onScrollMeetingTable}
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <Empty description="No Meetings Found" />
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        </ShadowBoxContainer>
      </Col>

      {/* Meeting Details Modal */}
      <Modal
        title="Meeting Details"
        centered
        destroyOnClose
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={false}
        closeIcon={
          <Button
            shape="circle"
            icon={<i className="icon-close before:!m-0 text-sm" />}
          />
        }
        width={800}
        className="modalWrapperBox"
      >
        <div className="pt-5">
          {selectedMeeting && (
            <>
              {/* Scrollable Content Area */}
              <div className="max-h-[28rem] overflow-y-auto pr-2 custom-scrollbar mb-6">
                {/* Meeting Header */}
                <div className="flex items-center gap-4 mb-6 p-4 bg-darkGray rounded-lg border border-[#373737]">
                  <div className="w-12 h-12 bg-primaryOpacity rounded-full flex items-center justify-center flex-shrink-0">
                    <CalendarOutlined className="text-primary text-xl" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <Text className="text-white text-xl font-semibold block truncate">
                      {selectedMeeting.title}
                    </Text>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedMeeting?.tag?.name && (
                        <Tag
                          className="rounded-md px-2 py-1 text-xs font-medium border-0"
                          style={{
                            backgroundColor: `${selectedMeeting?.tag?.color}20`,
                            color: selectedMeeting?.tag?.color,
                          }}
                        >
                          {selectedMeeting.tag.name}
                        </Tag>
                      )}
                      <Tag
                        className="px-2 py-1 rounded-md text-xs font-medium"
                        style={{
                          backgroundColor: `${statusMap[selectedMeeting.status]?.color
                            }20`,
                          borderColor: statusMap[selectedMeeting.status]?.color,
                          color: statusMap[selectedMeeting.status]?.color,
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor:
                                statusMap[selectedMeeting.status]?.color,
                            }}
                          />
                          {statusMap[selectedMeeting.status]?.label ||
                            selectedMeeting.status}
                        </div>
                      </Tag>
                    </div>
                  </div>
                </div>

                {/* Description Section */}
                {selectedMeeting.description && (
                  <div className="mb-6 p-4 bg-darkGray rounded-lg border border-[#373737]">
                    <div className="flex items-center gap-2 mb-3">
                      <i className="icon-file-text text-purple-400 text-lg" />
                      <Text className="text-white font-medium">
                        Description
                      </Text>
                    </div>
                    <Text className="text-grayText leading-relaxed">
                      {selectedMeeting.description}
                    </Text>
                  </div>
                )}

                {/* Meeting Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Schedule Info */}
                  <div className="p-4 bg-darkGray rounded-lg border border-[#373737]">
                    <div className="flex items-center  mb-3">
                      <i className="icon-clock text-orange-400 text-lg" />
                      <Text className="text-white font-medium">Schedule</Text>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Text className="text-grayText text-xs  tracking-wide font-medium">
                          Start Time
                        </Text>
                        <div className="text-white font-medium mt-1">
                          {formatDateTime(selectedMeeting.start_time)}
                        </div>
                      </div>

                      <div>
                        <Text className="text-grayText text-xs  tracking-wide font-medium">
                          End Time
                        </Text>
                        <div className="text-white font-medium mt-1">
                          {formatDateTime(selectedMeeting.end_time)}
                        </div>
                      </div>

                      {/* <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                        <Text className="text-blue-300 text-xs font-medium">
                          Duration: {dayjs(selectedMeeting.end_time).diff(dayjs(selectedMeeting.start_time), 'hour', true).toFixed(1)} hours
                        </Text>
                      </div> */}
                    </div>
                  </div>

                  {/* Creator Info */}
                  <div className="p-4 bg-darkGray rounded-lg border border-[#373737]">
                    <div className="flex items-center gap-2 mb-3">
                      <i className="icon-user text-blue-400 text-lg" />
                      <Text className="text-white font-medium">Created By</Text>
                    </div>

                    <div className="flex items-center">
                      {selectedMeeting?.creator?.profile_photo_path ? (
                        <Avatar
                          size={48}
                          src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${selectedMeeting.creator.profile_photo_path}`}
                          className="mr-3 flex-shrink-0"
                        />
                      ) : (
                        <Avatar size={48} className="bg-primaryOpacity mr-3 flex-shrink-0">
                          {selectedMeeting?.creator?.name?.[0]}
                        </Avatar>
                      )}
                      <div className="flex-grow min-w-0">
                        <Text className="text-white font-medium text-base block truncate">
                          {selectedMeeting?.creator?.name}
                        </Text>
                        <Text className="text-grayText text-sm truncate">
                          {selectedMeeting?.creator?.email}
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Participants Section */}
                <div className="mb-6 p-4 bg-darkGray rounded-lg border border-[#373737]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <TeamOutlined className="text-primary text-lg" />
                      <Text className="text-white font-medium">
                        Participants
                      </Text>
                    </div>
                    <div className="bg-primaryOpacity text-primary px-3 py-1 rounded-full text-xs font-medium">
                      {selectedMeeting?.participants?.length || 0} attendees
                    </div>
                  </div>

                  {selectedMeeting?.participants?.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto scrollbar-none">
                      <div className="space-y-2">
                        {selectedMeeting.participants.map((participant) => (
                          <div key={participant.id} className="flex items-center p-3 bg-[#171717] hover:bg-[#202020] rounded-lg border border-[#373737] transition-colors">
                            {participant?.user?.profile_photo_path ? (
                              <Avatar
                                size={40}
                                src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${participant.user.profile_photo_path}`}
                                className="mr-3 flex-shrink-0"
                              />
                            ) : (
                              <Avatar size={40} className="bg-primaryOpacity mr-3 flex-shrink-0">
                                {participant?.user?.name?.[0]}
                              </Avatar>
                            )}
                            <div className="flex-grow min-w-0">
                              <Text className="text-white font-medium text-sm block truncate">
                                {participant?.user?.name}
                              </Text>
                              <Text className="text-grayText text-xs truncate">
                                {participant?.user?.email}
                              </Text>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-[#373737] rounded-full flex items-center justify-center mx-auto mb-3">
                        <TeamOutlined className="text-grayText text-xl" />
                      </div>
                      <Text className="text-grayText">No participants added yet</Text>
                    </div>
                  )}
                </div>

                {/* Zoom Link Section */}
                {selectedMeeting?.zoom_join_url && (
                  <div className="mb-6 p-4 bg-darkGray rounded-lg border border-[#373737]">
                    <div className="flex items-center gap-2 mb-3">
                      <i className="icon-video text-primary text-lg" />
                      <Text className="text-white font-medium">
                        Zoom Meeting Link
                      </Text>
                    </div>
                    <Button
                      type="primary"
                      size="large"
                      icon={<i className="icon-video text-lg" />}
                      onClick={() =>
                        window.open(selectedMeeting.zoom_join_url, "_blank")
                      }
                      style={{ backgroundColor: "#0a51df" }}
                      className=""
                      block
                    >
                      Join Zoom Meeting
                    </Button>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="border-t-2 border-solid border-[#373737] pt-6">
                <Button block size="large" onClick={handleModalClose}>
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </Row>
  );
};

export default MeetingModule;