import { useState, useEffect, useRef } from "react";
import {
  Typography,
  Row,
  Col,
  Table,
  Input,
  Empty,
  Spin,
  notification,
  Button,
  Tag,
  Modal,
  Form,
  Tabs,
  Switch,
} from "antd";
import {
  CheckCircleOutlined,
  EyeOutlined,
  CopyOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ShadowBoxContainer from "../../../components/AuthLayout/ShadowBoxContainer";
import { useDispatch, useSelector } from "react-redux";
import {
  addVimeoVideo,
  EditVimeoVideo,
  fetchVimeoVideos,
  RemoveVimeoVideo,
} from "../../../services/Store/VideoModule/action";

const { Text, Title } = Typography;

const VideoManagement = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();
  const location = useLocation();

  const isAdminMode = location.pathname.includes("/admin/");

  // Get videos data from Redux store
  const { videos, videosLoading } = useSelector(
    (state) => state?.vimeoVideos || {}
  );

  // State for videos data and filters
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    filters: {
      duration: undefined,
    },
    search: "",
  });

  const [tabType, setTabType] = useState("Onboarding");
  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false); // State for delete modal visibility
  const [videoToDelete, setVideoToDelete] = useState(null); // Store video to delete
  const [modalTitle, setModalTitle] = useState("Add Video");
  const [editingVideo, setEditingVideo] = useState(null);
  const [addVideoSuccessModal, setAddVideoSuccessModal] = useState(false);
  const [status, setStatus] = useState(false);
  const [modalLoading, setModalLoading] = useState(false); // New loading state for modal operations
  const [form] = Form.useForm();

  // Debounce search with useRef to store timeout ID
  const searchTimeoutRef = useRef(null);
  const [searchValue, setSearchValue] = useState("");

  // Handle copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        notification.success({
          message: "URL has been copied to clipboard",
          icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
          placement: "top",
          duration: 3,
        });
      },
      () => {
        notification.error({
          message: "Copy failed",
          description: "Failed to copy URL to clipboard",
          placement: "topRight",
          duration: 3,
        });
      }
    );
  };

  // Fetch videos based on current tableParams
  const fetchVideos = () => {
    const params = {
      album_name: tabType, // Use the selected tab as the album name
      page: tableParams.pagination.current.toString(),
      per_page: tableParams.pagination.pageSize.toString(),
      ...(tableParams.filters.duration !== undefined && {
        duration: tableParams.filters.duration,
      }),
      ...(tableParams.search && { search: tableParams.search }),
    };

    dispatch(fetchVimeoVideos(params));
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
    fetchVideos();
  }, []);

  // Refetch when tableParams change (pagination, filters, etc.)
  useEffect(() => {
    fetchVideos();
  }, [
    tableParams.pagination.current,
    tableParams.pagination.pageSize,
    tableParams.filters.duration,
    tableParams.search,
  ]);

  // Refetch when tabType changes
  useEffect(() => {
    fetchVideos();
  }, [tabType]);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Format video duration from seconds to MM:SS or HH:MM:SS
  const formatDuration = (seconds) => {
    if (!seconds) return "-";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Format date in a readable format
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  // Handle search input change with debouncing
  const onSearchChange = (e) => {
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

  // Handle duration filter change
  const onDurationFilterChange = (value) => {
    setTableParams({
      ...tableParams,
      pagination: {
        ...tableParams.pagination,
        current: 1, // Reset to first page when filter changes
      },
      filters: {
        ...tableParams.filters,
        duration: value,
      },
    });
  };

  // Handle table pagination and filtering change
  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({
      ...tableParams,
      pagination: {
        ...tableParams.pagination,
        current: pagination.current,
        pageSize: pagination.pageSize,
      },
      // We don't update filters here as we're handling them separately
    });
  };

  const handleTabChange = (key) => {
    setTabType(key);
    setTableParams({
      ...tableParams,
      pagination: {
        ...tableParams.pagination,
        current: 1, // Reset to first page when tab changes
      },
    });
  };
  const handleDeleteVideo = (videoId) => {
    dispatch(RemoveVimeoVideo(videoId)).then((response) => {
      if (response?.payload?.meta?.success) {
        // notification.success({
        //   message: "Video deleted successfully",
        //   icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
        //   placement: "top",
        //   duration: 3,
        // });
        fetchVideos(); // Refresh the video list
      } else {
        console.log("error while deleting video");
        // notification.error({
        //   message: "Error",
        //   description:
        //     response?.payload?.meta?.message || "Failed to delete video",
        //   placement: "top",
        //   duration: 3,
        // });
      }
    });
  };
  // Helper functions for dynamic navigation
  const getDashboardLink = () => {
    return isAdminMode ? "/admin" : "/dashboard";
  };

  // Modal handlers
  const showAddModal = () => {
    setModalTitle("Add Video");
    setEditingVideo(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (record) => {
    setModalTitle("Edit Video");
    setEditingVideo(record);
    form.setFieldsValue({
      embedUrl: record.embed_url,
    });
    form.setFieldsValue({
      is_active: record.is_active,
    });
    setIsModalVisible(true);
  };
  const showDeleteModal = (record) => {
    setVideoToDelete(record); // Store the video that is about to be deleted
    setIsDeleteModalVisible(true); // Show the delete confirmation modal
  };
  const handleCancelDelete = () => {
    setIsDeleteModalVisible(false); // Close the modal without deleting
  };

  const handleConfirmDelete = () => {
    if (videoToDelete) {
      handleDeleteVideo(videoToDelete.id); // Call the delete function
      setIsDeleteModalVisible(false); // Close the modal after deletion
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setStatus(false);
    form.resetFields();
  };

  const handleCloseOnAddSuccessModal = () => {
    setAddVideoSuccessModal(false);
  };

  const handleAddMCQs = () => {
    navigate("/admin/mcq-management");
  };

  const onChangeSwitch = (checked) => {
    setStatus(checked);
  };

  const handleModalSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        const videoData = {
          url: values.embedUrl, // The URL from the form
          category_type: tabType, // Category, e.g., Onboarding
          is_active: status ? 1 : 0,
        };

        setModalLoading(true); // Start loading

        if (editingVideo) {
          // If editing, update the video
          const videoId = editingVideo?.id; // Get the video ID from the editingVideo object

          // Dispatch the EditVimeoVideo action with video ID and data
          dispatch(EditVimeoVideo({ id: videoId, data: videoData }))
            .then((response) => {
              if (response?.payload?.meta?.success) {
                // console.log(
                //   "video edited successfully",
                //   response?.payload?.meta?.success
                // );
              } 

              setModalLoading(false); // Stop loading
              setIsModalVisible(false);
              setStatus(false);
              form.resetFields();
              fetchVideos(); // Refresh the list of videos
            })
            .catch((error) => {
              setModalLoading(false); // Stop loading on error
            });
        } else {
          // If adding a new video, create the video
          dispatch(addVimeoVideo(videoData))
            .then((response) => {
              if (response?.payload?.meta?.success === true) {
                setAddVideoSuccessModal(true);
              } 

              setModalLoading(false); // Stop loading
              setIsModalVisible(false);
              setStatus(false);
              form.resetFields();
              fetchVideos(); // Refresh the list of videos
            })
            .catch((error) => {
              setModalLoading(false); // Stop loading on error
            });
        }
      })
      .catch((error) => {
        console.log("Form validation failed:", error);
      });
  };

  // Table columns
  const columns = [
    {
      title: "Video",
      key: "video",
      width: "30%",
      render: (_, record) => (
        <div className="flex items-start">
          <img
            src={record?.thumbnail || "/placeholder.svg"}
            alt={record?.title}
            className="w-24 h-16 object-cover rounded mr-3"
          />
          <div className="flex flex-col">
            <Text
              className="text-white font-medium line-clamp-1"
              title={record?.title}
            >
              {record?.title}
            </Text>
            <Text className="text-grayText text-sm">
              ID: {record?.video_id}
            </Text>
            <div className="flex items-center mt-1">
              <Text className="text-grayText text-xs">
                {formatDuration(record?.duration)}
              </Text>
              {record.description && (
                <Tag className="ml-2 px-2 py-0 rounded-md" color="blue">
                  With Description
                </Tag>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Embed URL",
      dataIndex: "embed_url",
      key: "embed_url",
      width: "30%",
      render: (url) => (
        <div className="flex justify-between items-center">
          <Text className="text-grayText text-sm break-all">{url || "-"}</Text>
          {url && (
            <Button
              type="text"
              icon={<CopyOutlined />}
              className="text-primary hover:text-primary-dark ml-2"
              onClick={() => copyToClipboard(url)}
            />
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
      title: "Created Date",
      dataIndex: "created_time",
      key: "created_time",
      width: "13%",
      render: (date) => (
        <Text className="text-grayText">{formatDate(date)}</Text>
      ),
    },
    {
      title: "Modified Date",
      dataIndex: "modified_time",
      key: "modified_time",
      width: "13%",
      render: (date) => (
        <Text className="text-grayText">{formatDate(date)}</Text>
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
            icon={<EyeOutlined />}
            className="text-primary hover:text-primary-dark text-lg"
            onClick={() => window.open(record?.embed_url, "_blank")}
          />
          <Button
            type="text"
            icon={<i className="icon-edit" />}
            className="text-primary hover:text-primary-dark text-lg"
            onClick={() => showEditModal(record)}
          />
          <Button
            type="text"
            icon={<i className="icon-delete" />}
            className="text-red-500 hover:text-red-600 text-lg"
            onClick={() => showDeleteModal(record)}
          />
        </div>
      ),
    },
  ];

  console.log("setTableParams",tableParams)

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
              Video Management
            </Text>
          </Title>
        </div>
      </Col>

      <Col span={24} className="h-full mb-4">
        <ShadowBoxContainer height={containerHeight}>
          <>
            {videosLoading ? (
              <div className="flex items-center justify-center h-full">
                <Spin size="large" />
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-0">
                  <div className="flex items-center">
                    <div className="text-2xl font-normal">Videos</div>
                    {videos?.data?.videos?.length > 0 && (
                      <>
                        <span className="mx-3 text-grayText">&#8226;</span>
                        <div className="bg-primaryOpacity rounded-lg px-3 py-1 text-primary">
                        {videos?.data?.pagination?.total || 0}
                        </div>
                      </>
                    )}
                  </div>
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={showAddModal}
                    className="rounded-3xl w-full sm:w-auto"
                  >
                    Add Video
                  </Button>
                </div>

                <Tabs
                  defaultActiveKey="Onboarding"
                  activeKey={tabType}
                  onChange={handleTabChange}
                  className="mt-4 custom-tabs"
                  items={[
                    {
                      key: "Onboarding",
                      label: "Onboarding",
                    },
                    // {
                    //   key: "Support",
                    //   label: "Support",
                    // },
                  ]}
                />
                {/* <div className="flex gap-3 mb-6 pt-6 items-center">
                  <div className="relative max-w-md w-full">
                    <Input
                      size="large"
                      prefix={
                        <SearchOutlined className="absolute left-4 top-1/2 text-xl transform -translate-y-1/2 text-grayText" />
                      }
                      placeholder="Search by Title or ID"
                      className="bg-[#171717] border-[#373737] rounded-full pl-10"
                      style={{ width: "100%" }}
                      onChange={onSearchChange}
                      value={searchValue}
                      allowClear
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 ">
                    <Select
                      size="large"
                      placeholder="Short (< 5 min)"
                      style={{ width: "100%", color: "white" }}
                      className="bg-[#373737] rounded-full text-white filterSelection"
                      dropdownStyle={{
                        backgroundColor: "#212121",
                        borderRadius: "8px",
                        color: "white",
                      }}
                      suffixIcon={
                        <CaretRightOutlined className="rotate-90 text-white" />
                      }
                      options={[
                        { value: "short", label: "Short (< 5 min)" },
                        { value: "medium", label: "Medium (5-15 min)" },
                        { value: "long", label: "Long (> 15 min)" },
                      ]}
                      onChange={onDurationFilterChange}
                    />
                  </div>
                </div> */}
                <div className="h-full pt-6">
                  {videosLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Spin size="large" />
                    </div>
                  ) : videos?.data?.videos?.length > 0 ? (
                    <div className="overflow-auto">
                      <Table
                        columns={columns}
                        dataSource={videos?.data?.videos}
                        rowKey={(record) => record.uri}
                        pagination={{
                          ...tableParams.pagination,
                          total: videos?.data?.pagination?.total || 0,
                          current:
                            Number.parseInt(
                              videos?.data?.pagination?.current_page
                            ) || 1,
                          pageSize:
                            Number.parseInt(
                              videos?.data?.pagination?.per_page
                            ) || 10,
                          showTotal: (total, range) => (
                            <div className="text-grayText w-full text-center md:text-left mb-4 md:mb-0">
                              Showing {range[0]}-{range[1]} of {total} results
                            </div>
                          ),
                          responsive: true,
                          className: "custom-pagination flex-wrap-pagination",
                        }}
                        onChange={handleTableChange}
                        className="custom-table bg-[#242424] !rounded-[2rem] mb-6"
                        rowClassName="bg-[#242424] hover:bg-darkGray transition-colors"
                        scroll={{
                          x: "max-content",
                          // y: "calc(100vh - 420px)",
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-64">
                      <Empty description="No Videos Found" />
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        </ShadowBoxContainer>
      </Col>

      {/* Add/Edit Video Modal */}
      <Modal
        title={modalTitle}
        open={isModalVisible}
        onCancel={handleModalCancel}
        onOk={handleModalSubmit}
        okText={editingVideo ? "Update" : "Add"}
        okButtonProps={{
          className: "bg-primary hover:bg-primary-dark",
          loading: modalLoading,
          disabled: modalLoading,
        }}
        className="video-modal"
        destroyOnClose
        centered
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
          name="videoForm"
          initialValues={{ embedUrl: "" }}
        >
          <Form.Item
            name="embedUrl"
            label={<Text type="secondary">Embed URL</Text>}
            rules={[
              {
                type: "url",
                message: "Please enter a valid URL",
              },
            ]}
          >
            <Input
              placeholder="https://player.vimeo.com/video/123456789"
              className=" rounded-lg"
            />
          </Form.Item>
          <Form.Item name="is_active" label={<Text type="secondary">Status</Text>} valuePropName="checked">
            <Switch
              size="default"
              checkedChildren="Active"
              unCheckedChildren="Inactive"
              checked={status}
              onChange={onChangeSwitch}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={false}
        centered
        destroyOnClose
        open={addVideoSuccessModal}
        width={"40%"}
        onCancel={handleCloseOnAddSuccessModal}
        footer={
          <Row gutter={16}>
            <Col span={12}>
              <Button block onClick={handleCloseOnAddSuccessModal} size="large">
                Cancel
              </Button>
            </Col>
            <Col span={12}>
              <Button block type="primary" size="large" onClick={handleAddMCQs}>
                Add MCQs
              </Button>
            </Col>
          </Row>
        }
        closeIcon={
          <Button
            shape="circle"
            icon={<i className="icon-close before:!m-0 text-sm" />}
          />
        }
      >
        <div className="flex items-center justify-center mt-8">
          <div className="bg-primaryOpacity p-4 rounded-full w-fit">
            <div className="bg-primary p-4 rounded-full">
              <i className="icon-tick before:!m-0 text-white text-5xl" />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center pt-10 pb-5">
          <Text className="font-semibold text-xl text-center">Success!</Text>
          <Text className="text-grayText text-center px-24 py-3">
            Video uploaded successfully Please add MCQs to activate the video.
          </Text>
        </div>
      </Modal>

      <Modal
        title="Delete Video"
        centered
        destroyOnClose
        open={isDeleteModalVisible}
        footer={false}
        // width={"40%"}
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
                Are you sure you want to delete this Video?
              </Text>
              {/* <Text className="text-grayText text-center px-24 py-3">
                    This action is permanent and cannot be undone. Please confirm if you
                    want to delete the MCQ titled {mcqToDelete?.question_title}.
                  </Text> */}
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
    </Row>
  );
};

export default VideoManagement;
