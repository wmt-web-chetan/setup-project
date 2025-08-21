import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  Row,
  Col,
  Table,
  Input,
  Button,
  Empty,
  Spin,
  Tag,
  Space,
  Tooltip,
  Collapse,
  Modal,
  Form,
  Checkbox,
  notification,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CaretRightOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMcqVideos,
  fetchMcqById,
  addMcq,
  updateMcqAction,
  deleteMcqsById,
} from "../../../services/Store/McqModule/action";
import ShadowBoxContainer from "../../../components/AuthLayout/ShadowBoxContainer";

const { Text, Title } = Typography;
const { Panel } = Collapse;

const McqManagement = () => {
  const dispatch = useDispatch();
  // Get MCQ videos data from Redux store
  const mcqVideosState = useSelector((state) => state?.mcqVideos);
  const mcqVideos = mcqVideosState?.mcqVideos || {};
  const mcqVideosLoading = mcqVideosState?.mcqVideosLoading || false;
  const mcqDetail = mcqVideosState?.mcqDetail || {};
  const mcqDetailLoading = mcqVideosState?.mcqDetailLoading || false;
  const mcqCreationLoading = mcqVideosState?.mcqCreationLoading || false;

  // State for container height and table params
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    search: "",
  });

  // State for MCQ form modal
  const [mcqModalVisible, setMcqModalVisible] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [editingMcq, setEditingMcq] = useState(null);
  // State for MCQ delete modal
  const [isDeleteMcqModalVisible, setIsDeleteMcqModalVisible] = useState(false);
  const [mcqToDelete, setMcqToDelete] = useState(null);

  const [form] = Form.useForm();

  // Debounce search with useRef to store timeout ID
  const searchTimeoutRef = useRef(null);
  const [searchValue, setSearchValue] = useState("");

  // State to track which video is expanded
  const [expandedVideoId, setExpandedVideoId] = useState(null);
  // State to track expanded row keys for table
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);

  // Set container height based on screen size
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

  // Fetch videos data
  const fetchVideosData = (page = 1, pageSize = 10) => {
    const params = {
      page: page.toString(),
      per_page: pageSize.toString(),
      ...(tableParams.search && { search: tableParams.search }),
    };

    dispatch(fetchMcqVideos(params));
  };

  // Initial fetch
  useEffect(() => {
    fetchVideosData();
  }, []);

  // Update pagination when data changes
  useEffect(() => {
    if (mcqVideos?.data?.pagination) {
      setTableParams((prev) => ({
        ...prev,
        pagination: {
          ...prev.pagination,
          current: mcqVideos.data.pagination.currentPage,
          pageSize: mcqVideos.data.pagination.perPage,
          total: mcqVideos.data.pagination.totalRecords,
        },
      }));
    }
  }, [mcqVideos]);

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

  // Handle search input change with debouncing
  const onSearchChange = (e) => {
    const value = e?.target?.value;
    setSearchValue(value);

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Only update filters if search value is empty or has at least 3 characters
    if (value === "" || value?.length >= 3) {
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
        fetchVideosData(1, tableParams.pagination.pageSize);
      }, 500);
    }
  };

  // Handle table pagination change
  const handleTableChange = (pagination) => {
    setTableParams((prev) => ({
      ...prev,
      pagination,
    }));
    fetchVideosData(pagination.current, pagination.pageSize);
  };

  // Show modal to add new MCQ
  const showAddMcqModal = (videoRecord) => {
    setCurrentVideo(videoRecord);
    setEditingMcq(null);
    form.resetFields();
    form.setFieldsValue({
      video_id: videoRecord.id,
      answers: [
        { answer_text: "", is_correct: false },
        { answer_text: "", is_correct: false },
        { answer_text: "", is_correct: false },
        { answer_text: "", is_correct: false },
      ],
    });
    setMcqModalVisible(true);
  };

  // Show modal to edit an existing MCQ
  const showEditMcqModal = (videoRecord, mcq) => {
    setCurrentVideo(videoRecord);
    setEditingMcq(mcq);

    // Map API data format to form format
    const formattedAnswers = mcq?.answers?.map((answer) => ({
      id: answer.id, // Keep the answer ID for updates
      answer_text: answer.answer_text,
      is_correct: answer.is_correct === 1,
    }));

    form.resetFields();
    form.setFieldsValue({
      video_id: videoRecord.id,
      question_title: mcq?.question_title,
      answers: formattedAnswers,
    });
    setMcqModalVisible(true);
  };

  // Handle MCQ form submission
  const handleMcqFormSubmit = (values) => {
    // Ensure exactly one answer is marked as correct
    const correctAnswers = values?.answers?.filter(
      (answer) => answer.is_correct
    );

    if (correctAnswers?.length !== 1) {
      notification.error({
        message: "Form Error",
        description: "Exactly one answer must be marked as correct.",
        duration: 3,
      });
      return;
    }

    if (editingMcq) {
      // Update existing MCQ
      const updateData = {
        id: editingMcq.id,
        question_title: values.question_title,
        answers: values?.answers?.map((answer) => {
          // If the answer has an ID, include it (for existing answers)
          if (answer.id) {
            return {
              id: answer.id,
              answer_text: answer.answer_text,
              is_correct: answer.is_correct,
            };
          } else {
            // For new answers, don't include ID
            return {
              answer_text: answer.answer_text,
              is_correct: answer.is_correct,
            };
          }
        }),
      };

      dispatch(updateMcqAction(updateData)).then((response) => {
        if (response?.payload?.meta?.success) {
          // Close the modal on success
          setMcqModalVisible(false);

          // Refresh MCQ data for the current video
          if (currentVideo) {
            dispatch(fetchMcqById(currentVideo.id));
          }

          // Refresh the videos list to update MCQ counts
          fetchVideosData(
            tableParams.pagination.current,
            tableParams.pagination.pageSize
          );
        }
      });
    } else {
      // Create new MCQ
      const mcqData = {
        video_id: values.video_id,
        question_title: values.question_title,
        answers: values.answers,
      };

      dispatch(addMcq(mcqData)).then((response) => {
        if (response?.payload?.meta?.success) {
          // Close the modal on success
          setMcqModalVisible(false);

          // Refresh MCQ data for the current video
          if (currentVideo) {
            dispatch(fetchMcqById(currentVideo.id));
          }

          // Refresh the videos list to update MCQ counts
          fetchVideosData(
            tableParams.pagination.current,
            tableParams.pagination.pageSize
          );
        }
      });
    }
  };
  const showDeleteMcqModal = (mcq) => {
    setMcqToDelete(mcq); // Set the MCQ to be deleted
    setIsDeleteMcqModalVisible(true); // Show the delete confirmation modal
  };

  // Handle cancel of MCQ delete modal
  const handleCancelDeleteMcq = () => {
    setIsDeleteMcqModalVisible(false); // Close the modal
  };

  // Handle confirm deletion of MCQ
  const handleConfirmDeleteMcq = () => {
    if (mcqToDelete) {
      handleDeleteMcq(mcqToDelete?.id, mcqToDelete?.video_id); // Call the delete function
      setIsDeleteMcqModalVisible(false); // Close the modal after deletion
    }
  };
  // Handle deleting an MCQ
  const handleDeleteMcq = (mcqId, videoId) => {
    dispatch(deleteMcqsById(mcqId)).then((response) => {
      if (response?.payload?.meta?.success) {
        // console.log("Mcq deleted");
        // notification.success({
        //   message: "MCQ deleted successfully",
        //   icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
        //   placement: "top",
        //   duration: 3,
        // });
        // Refresh MCQ data for the current video
        dispatch(fetchMcqById(videoId));
        fetchVideosData(
          tableParams.pagination.current,
          tableParams.pagination.pageSize
        );
      } else {
        console.log("failed to delete");
        // notification.error({
        //   message: "Error",
        //   description:
        //     response?.payload?.meta?.message || "Failed to delete MCQ",
        //   placement: "top",
        //   duration: 3,
        // });
      }
    });
  };

  // Function to fetch MCQ details when expanding a row
  const handleExpand = (expanded, record) => {
    if (expanded && record.mcq_count > 0) {
      // Close all other rows and open only this one
      setExpandedRowKeys([record.id]);
      setExpandedVideoId(record?.id);

      // Fetch MCQ details for the video
      dispatch(fetchMcqById(record?.id));
    } else {
      // Close the expanded row
      setExpandedRowKeys([]);
      setExpandedVideoId(null);
    }
  };

  // Define expandable row render function
  const expandedRowRender = (record) => {
    // Only render if the video has MCQs
    if (record?.mcq_count <= 0) {
      return (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <Text className="text-white text-lg font-medium">
              {/* No MCQs for this video */}
            </Text>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showAddMcqModal(record)}
              size="large"
            >
              Add MCQ
            </Button>
          </div>
          <Empty description="No MCQs for this video" />
        </div>
      );
    }

    // Check if we're currently loading MCQ details AND it's for this specific video
    if (mcqDetailLoading && expandedVideoId === record?.id) {
      return (
        <div className="flex justify-center items-center p-8">
          <Spin size="large" />
        </div>
      );
    }

    // Check if the MCQ details belong to the current video record
    // This is the key fix - only show MCQs if they belong to this specific video
    const isMcqDataForThisVideo = 
      mcqDetail?.data?.video_id === record?.id ||
      (Array.isArray(mcqDetail?.data) && mcqDetail?.data?.length > 0 && mcqDetail?.data[0]?.video_id === record?.id) ||
      (mcqDetail?.data?.questions && mcqDetail?.data?.questions?.length > 0 && mcqDetail?.data?.questions[0]?.video_id === record?.id) ||
      (mcqDetail?.data?.question && mcqDetail?.data?.question?.video_id === record?.id) ||
      expandedVideoId === record?.id;

    // If MCQ data is not for this video, show loading or empty state
    if (!isMcqDataForThisVideo) {
      return (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <Text className="text-white text-lg font-medium">
              MCQs for this video ({record.mcq_count})
            </Text>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showAddMcqModal(record)}
              size="large"
            >
              Add MCQ
            </Button>
          </div>
          
          {expandedVideoId === record?.id && mcqDetailLoading ? (
            <div className="flex justify-center items-center p-8">
              <Spin size="large" />
            </div>
          ) : (
            <Empty description="Click to refresh MCQs for this video" />
          )}
        </div>
      );
    }

    // Get the MCQ questions from the response data
    let mcqQuestions = [];

    if (Array.isArray(mcqDetail?.data)) {
      mcqQuestions = mcqDetail.data;
    } else if (Array.isArray(mcqDetail?.data?.questions)) {
      mcqQuestions = mcqDetail.data.questions;
    } else if (Array.isArray(mcqDetail?.data?.question)) {
      mcqQuestions = mcqDetail.data.question;
    } else if (mcqDetail?.data?.question) {
      mcqQuestions = [mcqDetail.data.question];
    }

    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <Text className="text-white text-lg font-medium">
            MCQs for this video ({record.mcq_count})
          </Text>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showAddMcqModal(record)}
            size="large"
          >
            Add MCQ
          </Button>
        </div>

        {mcqQuestions?.length > 0 ? (
          <Collapse
            bordered={false}
            expandIcon={({ isActive }) => (
              <CaretRightOutlined rotate={isActive ? 90 : 0} />
            )}
            className="bg-transparent"
          >
            {mcqQuestions?.map((mcq) => (
              <Panel
                key={mcq.id}
                header={
                  <div className="flex items-center justify-between w-full pr-12">
                    <Text className="text-white font-medium">
                      {mcq?.question_title}
                    </Text>
                    <div>
                      <Button
                        type="text"
                        icon={<i className="icon-edit" />}
                        className="text-primary mr-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          showEditMcqModal(record, mcq);
                        }}
                      />
                      <Button
                        type="text"
                        icon={<i className="icon-delete" />}
                        className="text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          showDeleteMcqModal(mcq); // Show the delete modal for this MCQ

                          // handleDeleteMcq(record.id, mcq.id);
                        }}
                      />
                    </div>
                  </div>
                }
                className="bg-gray border border-darkGray rounded-lg mb-3"
              >
                <div className="pl-4">
                  {mcq?.answers?.map((answer, index) => (
                    <div key={answer.id} className="flex items-center mb-2">
                      <div
                        className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center ${answer.is_correct === 1
                            ? "bg-green-600"
                            : "bg-gray-600"
                          }`}
                      >
                        {answer?.is_correct === 1 && (
                          <CheckCircleOutlined style={{ color: "white" }} />
                        )}
                      </div>
                      <Text
                        className={
                          answer?.is_correct === 1
                            ? "text-green-400"
                            : "text-grayText"
                        }
                      >
                        {String.fromCharCode(65 + index)}. {answer.answer_text}
                      </Text>
                    </div>
                  ))}
                </div>
              </Panel>
            ))}
          </Collapse>
        ) : (
          <Empty description="No MCQs found for this video" />
        )}
      </div>
    );
  };

  // Table columns
  const columns = [
    {
      title: "Video",
      key: "video",
      width: "40%",
      render: (_, record) => (
        <div className="flex items-start">
          <img
            src={record.thumbnail}
            alt={record.title}
            className="w-24 h-16 object-cover rounded mr-3"
          />
          <div className="flex flex-col">
            <Text
              className="text-white font-medium line-clamp-1"
              title={record.title}
            >
              {record.title}
            </Text>
            <Text className="text-grayText text-sm">ID: {record.video_id}</Text>
            <div className="flex items-center mt-1">
              <Text className="text-grayText text-xs">
                {formatDuration(record.duration)}
              </Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "MCQs Count",
      key: "mcqs_count",
      width: "20%",
      render: (_, record) => (
        <Tag className="text-white bg-gray px-3 py-1 text-base rounded-lg">
          {record.mcq_count} MCQs
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: "40%",
      render: (_, record) => (
        <Space>
          <Tooltip title="View Video">
            <Button
              type="primary"
              className="mr-2"
              size="large"
              onClick={() => window.open(record.embed_url, "_blank")}
            >
              View Video
            </Button>
          </Tooltip>
          <Button
            type="default"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => showAddMcqModal(record)}
          >
            Add MCQ
          </Button>
        </Space>
      ),
    },
  ];

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
              MCQ Management
            </Text>
          </Title>
        </div>
      </Col>

      <Col span={24} className="h-full mb-4">
        <ShadowBoxContainer height={containerHeight}>
          <>
            {mcqVideosLoading ? (
              <div className="loadingClass">
                <Spin size="large" />
              </div>
            ) : (
              <>
                <div className="flex items-center mt-0">
                  <div className="text-2xl font-normal">MCQ Management</div>
                  {
                    mcqVideos?.data?.videos?.length > 0 ?
                      <>
                        <span className="mx-3 text-grayText">&#8226;</span>
                        <div className="bg-primaryOpacity rounded-lg px-3 py-1 text-primary">
                          {tableParams.pagination.total || ""}
                        </div>
                      </>
                      : null
                  }
                </div>
                {/* <div className="flex justify-between mb-6 pt-6 items-center">
                  <div className="relative max-w-md w-full">
                    <Input
                      size="large"
                      prefix={
                        <SearchOutlined className="absolute left-4 top-1/2 text-xl transform -translate-y-1/2 text-grayText" />
                      }
                      placeholder="Search by Video Title or ID"
                      className="bg-[#171717] border-[#373737] rounded-full pl-10"
                      style={{ width: "100%" }}
                      onChange={onSearchChange}
                      value={searchValue}
                      allowClear
                    />
                  </div>
                </div> */}
                <div className="h-full pt-6">
                  {mcqVideosLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Spin size="large" />
                    </div>
                  ) : (mcqVideos?.data?.videos || []).length > 0 ? (
                    <div className="overflow-auto">
                      <Table
                        columns={columns}
                        dataSource={mcqVideos?.data?.videos || []}
                        rowKey="id"
                        pagination={{
                          current: tableParams.pagination.current,
                          pageSize: tableParams.pagination.pageSize,
                          total: tableParams.pagination.total,
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
                        className="custom-table bg-[#242424] !rounded-[2rem] mb-6"
                        rowClassName="bg-[#242424] hover:bg-darkGray transition-colors"
                        expandable={{
                          expandedRowRender,
                          expandRowByClick: true, // Enable expanding by clicking anywhere
                          onExpand: handleExpand,
                          expandedRowKeys: expandedRowKeys, // Control which rows are expanded
                          expandIcon: ({ expanded, onExpand, record }) =>
                            expanded ? (
                              <Button
                                type="text"
                                icon={<CaretRightOutlined rotate={90} />}
                                onClick={(e) => onExpand(record, e)}
                                className="text-primary"
                              />
                            ) : (
                              <Button
                                type="text"
                                icon={<CaretRightOutlined />}
                                onClick={(e) => onExpand(record, e)}
                                className="text-grayText hover:text-primary"
                              />
                            ),
                        }}
                        onRow={(record, rowIndex) => {
                          return {
                            onClick: () => {
                              // Toggle expansion - if already expanded, close it; otherwise open it
                              const isCurrentlyExpanded = expandedRowKeys.includes(record.id);
                              handleExpand(!isCurrentlyExpanded, record);
                            },
                          };
                        }}
                        scroll={{
                          x: "max-content",
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-64">
                      <Empty description="No MCQs Found" />
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        </ShadowBoxContainer>
      </Col>

      {/* MCQ Form Modal */}
      <Modal
        title={
          <Text className="text-white text-lg">
            {editingMcq ? "Edit MCQ" : "Add New MCQ"}
          </Text>
        }
        open={mcqModalVisible}
        onCancel={() => setMcqModalVisible(false)}
        footer={null}
        width={700}
        className="mcq-modal modalWrapperBox"
        destroyOnClose
        confirmLoading={mcqCreationLoading}
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
          onFinish={handleMcqFormSubmit}
          initialValues={{
            video_id: currentVideo?.id,
            answers: [
              { answer_text: "", is_correct: false },
              { answer_text: "", is_correct: false },
              { answer_text: "", is_correct: false },
              { answer_text: "", is_correct: false },
            ],
          }}
          requiredMark={false}
        >
          <div className="wrapperFormContent" style={{ maxHeight: "60vh" }}>
            <Form.Item name="video_id" hidden>
              <Input />
            </Form.Item>

            <Form.Item
              name="question_title"
              label={<Text className="text-white">Question</Text>}
              rules={[
                { max: 255, message: "Question cannot exceed 255 characters" },
                { required: true, message: "Please enter the question" },
              ]}
            >
              <Input size="large" placeholder="Enter Question" />
            </Form.Item>

            <div className="mb-4">
              <Text className="text-white">Answers</Text>
              <Text className="text-grayText ml-2 text-sm">
                (Mark one answer as correct)
              </Text>
            </div>

            <Form.List name="answers">
              {(fields) => (
                <>
                  {fields?.map(({ key, name, ...restField }) => (
                    <div key={key} className="flex items-start mb-4">
                      <div className="mr-3 mt-2">
                        <Text className="text-white">
                          {String.fromCharCode(65 + name)}.
                        </Text>
                      </div>
                      <div className="flex-1">
                        <Form.Item
                          {...restField}
                          name={[name, "answer_text"]}
                          rules={[
                            {
                              required: true,
                              message: "Answer text is required",
                            },
                            {
                              max: 255,
                              message: "Answer cannot exceed 255 characters",
                            },
                          ]}
                          className="mb-1"
                        >
                          <Input
                            size="large"
                            placeholder={`Answer ${String.fromCharCode(
                              65 + name
                            )}`}
                          // maxLength={255}
                          />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, "is_correct"]}
                          valuePropName="checked"
                        >
                          <Checkbox
                            onChange={(e) => {
                              // If this checkbox is being checked
                              if (e.target.checked) {
                                // Get current form values
                                const values = form.getFieldsValue();
                                // Set all other answers' is_correct to false
                                const updatedAnswers = values.answers.map(
                                  (answer, idx) => ({
                                    ...answer,
                                    is_correct: idx === name ? true : false,
                                  })
                                );
                                // Update the form
                                form.setFieldsValue({
                                  answers: updatedAnswers,
                                });
                              }
                            }}
                          >
                            <Text className="text-grayText">
                              Mark as correct answer
                            </Text>
                          </Checkbox>
                        </Form.Item>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </Form.List>
          </div>

          <div className="wrapperFooter">
            {" "}
            <Form.Item className="mb-0">
              <div className="flex justify-end">
                <Button
                  onClick={() => setMcqModalVisible(false)}
                  className="mr-3"
                  size="large"
                  disabled={mcqCreationLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={mcqCreationLoading}
                >
                  {editingMcq ? "Update MCQ" : "Create MCQ"}
                </Button>
              </div>
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        title="Delete MCQ"
        centered
        destroyOnClose
        open={isDeleteMcqModalVisible}
        // width={"30%"}
        className="modalWrapperBox"
        onCancel={handleCancelDeleteMcq}
        footer={false}
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
                Are you sure you want to delete this MCQ?
              </Text>
              {/* <Text className="text-grayText text-center px-24 py-3">
            This action is permanent and cannot be undone. Please confirm if you
            want to delete the MCQ titled {mcqToDelete?.question_title}.
          </Text> */}
            </div>

            <Col span={12}>
              <Button block size="large" onClick={handleCancelDeleteMcq}>
                Cancel
              </Button>
            </Col>
            <Col span={12}>
              <Button
                block
                type="primary"
                danger
                size="large"
                onClick={handleConfirmDeleteMcq}
              >
                Delete
              </Button>
            </Col>
          </Row>
        </div>
      </Modal>
    </Row>
  );
};

export default McqManagement;