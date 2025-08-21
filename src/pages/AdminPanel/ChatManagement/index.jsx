import {
  Button,
  Col,
  Input,
  Row,
  Select,
  Typography,
  Table,
  Pagination,
  Avatar,
  Tag,
  Tooltip,
  Modal,
  Form,
  Upload,
  Switch,
  message,
  notification,
  Spin,
  Empty,
} from "antd";
import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import ShadowBoxContainer from "../../../components/AuthLayout/ShadowBoxContainer";
import {
  PlusOutlined,
  SearchOutlined,
  CaretRightOutlined,
  LinkOutlined,
  UserOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  CopyOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  addChatRoom,
  fetchChatRoomList,
  removeChatRoom,
  updateChatRoomAction,
} from "../../../services/Store/Chat/action";
import dayjs from "dayjs";
import { deleteChatRoom } from "../../../services/Apis/chat";

const ChatManagement = () => {
  const dispatch = useDispatch();
  const { Text, Title } = Typography;

  const [isActiveState, setIsActiveState] = useState(true);
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  const [searchValue, setSearchValue] = useState("");
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreateGroupeModal, setIsCreateGroupeModal] = useState(false);
  const [isDeleteGroupeModal, setIsDeleteGroupeModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' or 'edit'
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageFile, setImageFile] = useState(null); // Store the actual file for FormData
  const [imageLoading, setImageLoading] = useState(false);
  const [deleteData, setDeleteData] = useState(null);

  // Add ref for search input and focus tracking
  const searchInputRef = useRef(null);
  const shouldMaintainFocus = useRef(false);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    totalPage: 0,
  });
  const [form] = Form.useForm();

  const { newChatRoomLoading } = useSelector((state) => state?.chat);

  const fetchChatRooms = (page = 1, perPage = 10, search = "") => {
    setLoading(true);
    const params = {
      page,
      per_page: perPage,
      search,
    };

    dispatch(fetchChatRoomList(params))
      .then((res) => {
        if (res?.payload?.meta?.success) {
          setChatRooms(res.payload.data.chat_rooms || []);
          setPagination({
            current: res.payload.data.currentPage,
            pageSize: res.payload.data.perPage,
            total: res.payload.data.totalRecords,
            totalPage: res.payload.data.totalPage,
          });
        }
        setLoading(false);
        
        // Restore focus if needed
        if (shouldMaintainFocus.current && searchInputRef.current) {
          setTimeout(() => {
            searchInputRef.current.focus();
            shouldMaintainFocus.current = false;
          }, 0);
        }
      })
      .catch((e) => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchChatRooms();

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

  const handlePageChange = (page, pageSize) => {
    fetchChatRooms(page, pageSize, searchValue);
  };

  const handleSearch = (value) => {
    setSearchValue(value);
    fetchChatRooms(1, pagination.pageSize, value);
  };

  const onChangeChatRoomSearch = (e) => {
    const value = e.target.value;
    setSearchValue(value);

    // Set focus flag when user is typing
    shouldMaintainFocus.current = true;

    // Debounce search to prevent excessive API calls
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }

    window.searchTimeout = setTimeout(() => {
      handleSearch(value);
    }, 500);
  };

  const getBase64 = (img, callback) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result));
    reader.readAsDataURL(img);
  };

  const beforeUpload = (file) => {
    // Check file type - only allow jpg, jpeg, png
    const isAcceptedType =
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/jpg";
    if (!isAcceptedType) {
      message.error("You can only upload JPG, JPEG, or PNG files!");
      return Upload.LIST_IGNORE;
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Image must be smaller than 2MB!");
      return Upload.LIST_IGNORE;
    }

    // Store file for later use in FormData
    setImageFile(file);
    return false; // Return false to prevent default upload behavior
  };

  const handleChange = (info) => {
    if (info.file.status === "uploading") {
      setImageLoading(true);
      return;
    }

    if (info.file.status === "error") {
      setImageLoading(false);
      message.error("Image upload failed");
      return;
    }

    if (info.file.status === "removed") {
      setImageLoading(false);
      setImageUrl(null);
      setImageFile(null);
      return;
    }

    // Get the base64 image URL for preview
    getBase64(info.file, (url) => {
      setImageLoading(false);
      setImageUrl(url);
    });
  };

  const uploadButton = (
    <div>
      {imageLoading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  const onClickAddGroupChat = () => {
    setModalMode("create");
    setSelectedRecord(null);
    setImageUrl(null);
    setImageFile(null);
    setIsActiveState(true); // Reset to default value
    form.resetFields();
    setIsCreateGroupeModal(true);
  };

  const handleEdit = (record) => {
    setModalMode("edit");
    setSelectedRecord(record);
    // Fix: Use the correct property for the profile photo
    setImageUrl(
      `${import.meta.env.VITE_IMAGE_BASE_URL}/${record.profile_photo_path}`
    );
    setImageFile(null); // Reset file when editing

    // Convert is_active from 1/0 to true/false for the Form
    const isActive = record.is_active === 1;
    // console.log("Setting form value is_active to:", isActive);

    // Set our separate state tracker
    setIsActiveState(isActive);

    form.setFieldsValue({
      roomName: record.name,
      is_active: isActive,
    });

    setIsCreateGroupeModal(true);
  };

  const handleDelete = (record) => {
    // Add delete confirmation
    setIsDeleteGroupeModal(true);
    setDeleteData(record);
  };

  const handleConfirmDelete = () => {
    // call Delete chat room api here
    // console.log("call delete api ", deleteData);
    if (deleteData?.id) {
      dispatch(removeChatRoom(deleteData?.id))
        .then((res) => {
          if (res?.payload?.meta?.success) {
            // console.log("delete res", res?.payload?.data);

            // Update chatRooms state by filtering out the deleted room
            setChatRooms((prevChatRooms) =>
              prevChatRooms.filter((room) => room.id !== res?.payload?.data?.id)
            );

            // Close the delete modal
            setIsDeleteGroupeModal(false);
            setDeleteData(null);

            // Show success message
            // message.success("Chat room deleted successfully");
          } else {
            // message.error(
            //   res?.payload?.message || "Failed to delete chat room"
            // );
          }
        })
        .catch((e) => {
          console.log("Error", e);
          // message.error("Failed to delete chat room");
        });
    }
  };

  const handleModalCancel = () => {
    setIsCreateGroupeModal(false);
    form.resetFields();
    setImageUrl(null);
    setImageFile(null);
  };
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

  const handleCancelDelete = () => {
    setIsDeleteGroupeModal(false);
    setDeleteData(null);
  };

  const handleModalSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        // Log the form values to debug
        // console.log("Form values before submission:", values);
        // console.log("is_active value type:", typeof values.is_active);
        // console.log("is_active state value:", isActiveState);

        // Create FormData object for API submission
        const formData = new FormData();
        formData.append("name", values.roomName);

        // Use our tracked state instead of form value
        const isActiveValue = isActiveState ? 1 : 0;
        // console.log("Converted is_active value:", isActiveValue);
        formData.append("is_active", isActiveValue);

        // Add image to FormData if available
        if (imageFile) {
          formData.append("profile_photo", imageFile);
        } else if (imageUrl && modalMode === "edit") {
          // For edit mode, if there's an imageUrl but no new file,
          // pass the existing image path
          formData.append("profile_photo", imageUrl);
        }

        if (modalMode === "create") {
          // Create new chat room API call
          setLoading(true);

          dispatch(addChatRoom(formData))
            .then((res) => {
              // console.log("res?.payload", res?.payload);

              setLoading(false);
              if (res?.payload?.meta?.success) {
                // message.success('Chat room created successfully');

                // Fix for issue 2: Immediately add the new chat room to the list
                if (res?.payload?.data) {
                  // Add the new chat room to the list without refetching

                  const newChatRoom = res.payload.data.chat_room;

                  // console.log("chatRooms", chatRooms);
                  // console.log("newChatRoom", newChatRoom);

                  setChatRooms((prevChatRooms) => [
                    newChatRoom,
                    ...prevChatRooms,
                  ]);
                } else {
                  // If the structure is different, fetch the updated list
                  fetchChatRooms(
                    pagination.current,
                    pagination.pageSize,
                    searchValue
                  );
                }

                // Close the modal and reset form
                setIsCreateGroupeModal(false);
                form.resetFields();
                setImageUrl(null);
                setImageFile(null);
              } else {
                // message.error(
                //   res?.payload?.message || "Failed to create chat room"
                // );
              }
            })
            .catch((error) => {
              setLoading(false);
              // message.error("Failed to create chat room");
            });
        } else {
          // Update existing chat room API call
          formData.append("id", selectedRecord.id);

          // Implement the update API call
          setLoading(true);
          dispatch(updateChatRoomAction(formData))
            .then((res) => {
              setLoading(false);
              if (res?.payload?.meta?.success) {
                // Update the chat room in the list
                const updatedChatRoom = res?.payload?.data?.chat_room;
                if (updatedChatRoom) {
                  setChatRooms((prevChatRooms) =>
                    prevChatRooms.map((room) =>
                      room.id === updatedChatRoom.id ? updatedChatRoom : room
                    )
                  );
                } else {
                  // If the structure is different, fetch the updated list
                  fetchChatRooms(
                    pagination.current,
                    pagination.pageSize,
                    searchValue
                  );
                }

                // Close the modal and reset form
                setIsCreateGroupeModal(false);
                form.resetFields();
                setImageUrl(null);
                setImageFile(null);
              } else {
                // message.error(
                //   res?.payload?.message || "Failed to update chat room"
                // );
              }
            })
            .catch((error) => {
              setLoading(false);
              // message.error("Failed to update chat room");
            });
        }
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const columns = [
    {
      title: <Text className="text-white">Chat Room</Text>,
      dataIndex: "name",
      key: "name",
      width: "25%", // Increased width slightly
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {record.profile_photo_path ? (
              <Avatar
                size={40}
                src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                  record.profile_photo_path
                }`}
                className="bg-gray-700"
              />
            ) : (
              <Avatar
                size={40}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                className="bg-primaryOpacity !rounded-full"
              >
                {record?.name[0]}
              </Avatar>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {" "}
            {/* min-w-0 is crucial for text truncation */}
            <div
              className="text-white font-medium truncate" // Use truncate class
              title={text} // Show full text on hover
            >
              {text}
            </div>
            {record.description && (
              <div
                className="text-grayText text-sm truncate" // Also truncate description
                title={record.description}
              >
                {record.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: <Text className="text-white">Status</Text>,
      dataIndex: "is_active",
      key: "is_active",
      width: "10%",
      render: (is_active) =>
        is_active === 1 ? (
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
      title: <Text className="text-white">Chat Room Link</Text>,
      dataIndex: "meeting_link",
      key: "meeting_link",
      width: "35%", // Increased width for longer URLs
      render: (url) => (
        <div className="flex justify-between items-center gap-2">
          <div
            className="text-grayText text-sm truncate flex-1 min-w-0"
            title={url || "-"}
          >
            {url || "-"}
          </div>
          {url && (
            <Button
              type="text"
              icon={<CopyOutlined />}
              className="text-primary hover:text-primary-dark flex-shrink-0"
              onClick={() => copyToClipboard(url)}
            />
          )}
        </div>
      ),
    },
    {
      title: <Text className="text-white">Created At</Text>,
      dataIndex: "created_at",
      key: "created_at",
      width: "15%",
      render: (date) => (
        <Text className="text-grayText flex items-center">
          {dayjs(date).format("MM/DD/YYYY")}
        </Text>
      ),
    },
    {
      title: <Text className="text-white">Actions</Text>,
      key: "actions",
      width: "15%",
      render: (_, record) => (
        <div className="flex gap-1">
          <Button
            type="text"
            icon={<i className="icon-edit" />}
            className="text-primary hover:text-primary-dark text-lg"
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            icon={<i className="icon-delete" />}
            className="text-red-500 hover:text-red-600 text-lg"
            onClick={() => handleDelete(record)}
          />
        </div>
      ),
    },
  ];

  const modalTitle =
    modalMode === "create" ? "Create Chat Room" : "Edit Chat Room";
  const submitButtonText = modalMode === "create" ? "Add" : "Update";

  return (
    <Row className="bg-darkGray px-header-wrapper h-full w-full flex flex-col gap-3 sm:gap-6">
      <div className="w-full"></div>

      <Modal
        title="Delete Chat Room"
        centered
        destroyOnClose
        open={isDeleteGroupeModal}
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
                Are you sure you want to delete this Chat Room?
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

      <Modal
        title={<Text className="text-lg">{modalTitle}</Text>}
        open={isCreateGroupeModal}
        onCancel={handleModalCancel}
        onOk={handleModalSubmit}
        okText={submitButtonText}
        okButtonProps={{
          className: "bg-primary hover:bg-primary-dark",
          size: "large",
          loading: newChatRoomLoading,
        }}
        cancelButtonProps={{ size: "large" }}
        className="chat-room-modal"
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
          name="chatRoomForm"
          initialValues={{
            roomName: "",
            is_active: true,
          }}
          requiredMark={false}
        >
          <Row gutter={16}>
            <Col span={24} className="mb-4 text-center">
              <Form.Item
                name="groupImage"
                label={<Text className="text-base">Group Image</Text>}
              >
                <Upload
                  name="avatar"
                  listType="picture-circle"
                  className="avatar-uploader"
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  onChange={handleChange}
                  accept=".jpg,.jpeg,.png"
                  customRequest={({ onSuccess }) => {
                    // Manual success to prevent actual upload
                    setTimeout(() => {
                      onSuccess("ok");
                    }, 0);
                  }}
                >
                  {imageUrl ? (
                    <Avatar
                      src={imageUrl}
                      alt="avatar"
                      size={80}
                      className="rounded-full"
                    />
                  ) : (
                    uploadButton
                  )}
                </Upload>
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="roomName"
                label={<Text className="text-base">Chat Room Name</Text>}
                rules={[
                  {
                    required: true,
                    message: "Please Enter Chat Room Name",
                  },
                  {
                    max: 50,
                    message: "Chat Room Name cannot exceed 50 characters",
                  },
                ]}
              >
                <Input
                  size="large"
                  placeholder="Enter Chat Room Name"
                  className="rounded-lg"
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="is_active"
                label={<Text className="text-base">Status</Text>}
                valuePropName="checked"
                getValueFromEvent={(checked) => {
                  // console.log("Switch value changed to:", checked);
                  return checked;
                }}
              >
                <Row align="middle" gutter={8}>
                  <Col>
                    <Switch
                      size="default"
                      checkedChildren="Active"
                      unCheckedChildren="Inactive"
                      checked={isActiveState}
                      onChange={(checked) => {
                        // console.log("Switch toggled to:", checked);
                        setIsActiveState(checked);
                        form.setFieldsValue({ is_active: checked });
                      }}
                    />
                  </Col>
                </Row>
              </Form.Item>
            </Col>
          </Row>
        </Form>
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
              Chat Management
            </Text>
          </Title>
        </div>
      </Col>

      <Col span={24} className="h-full mb-4">
        <ShadowBoxContainer height={containerHeight}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Spin size="large" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* <div className="flex flex-col md:flex-row justify-between items-start md:items-center"> */}
              <div className="flex mt-0 items-center">
                <div className="text-2xl font-normal">Chat Room</div>
                <>
                  <span className="mx-3 text-grayText">&#8226;</span>
                  <div className="bg-primaryOpacity rounded-lg px-3 py-1 text-primary">
                    {pagination?.total}
                  </div>
                </>
              </div>
              <div className="flex flex-col md:flex-row justify-between gap-3 w-full md:w-auto mt-4 md:mt-0">
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
                  <div className="relative w-full md:max-w-md">
                    <Input
                      ref={searchInputRef}
                      size="large"
                      prefix={
                        <SearchOutlined className="absolute left-4 top-1/2 text-xl transform -translate-y-1/2 text-grayText" />
                      }
                      placeholder="Search Chat Rooms"
                      className="bg-[#171717] border-[#373737] rounded-full pl-10"
                      style={{ width: "100%" }}
                      onChange={onChangeChatRoomSearch}
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
                    onClick={onClickAddGroupChat}
                    className="rounded-3xl w-full"
                  >
                    Add Chat Room
                  </Button>
                </div>
              </div>

              {/* </div> */}
              {chatRooms?.length > 0 ? (
                <>
                  <div className="mt-4">
                    <Table
                      columns={columns}
                      dataSource={chatRooms}
                      rowKey="id"
                      loading={loading}
                      pagination={false}
                      className="custom-table chat-room-table"
                      scroll={{ x: "max-content" }}
                    />

                    {pagination.total > 0 && (
                      <Row justify="end" className="mt-4">
                        <div className="flex justify-end items-center mb-12 mt-4">
                          <div className="text-grayText w-full text-center md:text-left mb-4 md:mb-0">
                            Showing{" "}
                            {pagination.current === 1
                              ? 1
                              : pagination.current * pagination.pageSize - 9}
                            -
                            {pagination.current === pagination.totalPage
                              ? pagination.total
                              : pagination.current * pagination.pageSize}{" "}
                            of {pagination.total} results
                          </div>
                          <Pagination
                            current={pagination.current}
                            pageSize={pagination.pageSize}
                            total={pagination.total}
                            onChange={handlePageChange}
                            showSizeChanger={false}
                            className="text-white customPagination"
                          />
                        </div>
                      </Row>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex justify-center items-center h-[28rem]">
                  <Empty description="No Chat Room Found" />
                </div>
              )}
            </div>
          )}
        </ShadowBoxContainer>
      </Col>
    </Row>
  );
};

export default ChatManagement;