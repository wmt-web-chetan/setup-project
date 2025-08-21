import { Button, Col, Empty, Form, Input, Modal, notification, Row, Select, Spin, Switch, Table, Typography } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  CheckCircleOutlined,
  EyeOutlined,
  CopyOutlined,
  PlusOutlined,
  SearchOutlined,
  CaretRightOutlined,
} from "@ant-design/icons";
import { fetchLinks, addLink, updateLinkAction } from '../../../services/Store/Link/action';
import { fetchDropdownUsers } from '../../../services/Store/Auth/action';

const { Option } = Select;

const MyLinks = () => {

  const { links, linksLoading } = useSelector(
    (state) => state?.links || {}
  );
  const { Text, Title } = Typography;

  const dispatch = useDispatch();
  const searchTimeoutRef = useRef(null);
  const { userForEdit } = useSelector((state) => state?.usersmanagement);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("Add Link");
  const [editingLink, setEditingLink] = useState(null);
  const [form] = Form.useForm();
  const [status, setStatus] = useState(false);
  const [usersData, setUsersData] = useState([]);

  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    search: "",
  });
  const [searchValue, setSearchValue] = useState("");

  // Fetch users dropdown data
  useEffect(() => {
    dispatch(fetchDropdownUsers({ role: "LO" })).then((res) => {
      if (res?.payload?.meta?.success) {
        console.log('Res Role', res?.payload?.data)
        setUsersData(res?.payload?.data?.users || []);
      }
    }).catch((e) => {
      console.log('Error:', e)
    })
  }, []);

  // Fetch links based on current tableParams
  const fetchLinksData = () => {
    const params = {
      user_id: userForEdit?.user?.id,
      page: tableParams.pagination.current.toString(),
      per_page: tableParams.pagination.pageSize.toString(),
      is_active: true,
      ...(tableParams.search && { search: tableParams.search }),
    };

    if (userForEdit?.user?.id) {
      dispatch(fetchLinks(params));
    }

  };

  // Initial fetch
  useEffect(() => {
    fetchLinksData();
  }, []);

  // Refetch when tableParams change (pagination, search, etc.)
  useEffect(() => {
    fetchLinksData();
  }, [
    tableParams.pagination.current,
    tableParams.pagination.pageSize,
    tableParams.search,
    userForEdit?.user?.id
  ]);

  // Handle copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        notification.success({
          message: "Link has been copied to clipboard",
          icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
          placement: "top",
          duration: 2,
        });
      },
      () => {
        notification.error({
          message: "Copy failed",
          description: "Failed to copy link to clipboard",
          placement: "topRight",
          duration: 2,
        });
      }
    );
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

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: "25%",
      render: (name) => (
        <Text className="text-white font-medium" title={name}>
          {name || "-"}
        </Text>
      ),
    },
    {
      title: "Link",
      dataIndex: "link",
      key: "link",
      width: "35%",
      render: (link) => (
        <div className="flex justify-between items-center">
          <Link to={link} target="_blank" className="text-primary hover:text-primary hover:opacity-70">{link}</Link>
          {/* <Text className="text-grayText text-sm break-all">{link || "-"}</Text> */}
          {link && (
            <Button
              type="text"
              icon={<CopyOutlined />}
              className="text-primary hover:text-primary-dark ml-2"
              onClick={() => copyToClipboard(link)}
            />
          )}
        </div>
      ),
    },
    {
      title: "Created Date",
      dataIndex: "created_at",
      key: "created_at",
      width: "15%",
      render: (date) => (
        <Text className="text-grayText">{formatDate(date)}</Text>
      ),
    },
    {
      title: "Modified Date",
      dataIndex: "updated_at",
      key: "updated_at",
      width: "15%",
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
            icon={<i className="icon-edit" />}
            className="text-primary hover:text-primary-dark text-lg"
            onClick={() => showEditModal(record)}
            disabled={isDeleting || isSubmitting}
          />
        </div>
      ),
    },
  ];

  // Handle table pagination change
  const handleTableChange = (pagination) => {
    setTableParams({
      ...tableParams,
      pagination: {
        ...tableParams.pagination,
        current: pagination.current,
        pageSize: pagination.pageSize,
      },
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

  // Modal handlers
  const showAddModal = () => {
    setModalTitle("Add Link");
    setEditingLink(null);
    setStatus(false);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (record) => {
    setModalTitle("Edit Link");
    setEditingLink(record);
    form.setFieldsValue({
      name: record.name,
      link: record.link,
      is_active: record.is_active,
      users: record.users ? record.users.map(user => user.id) : []
    });
    setStatus(record?.is_active);
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setStatus(false);
    form.resetFields();
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);

      // Create user_ids array with selected users plus logged-in user
      const selectedUsers = values.users || [];
      const loggedInUserId = userForEdit?.user?.id;
      const userIds = [...selectedUsers];

      // Add logged-in user ID if it's not already in the array
      if (loggedInUserId && !userIds.includes(loggedInUserId)) {
        userIds.push(loggedInUserId);
      }

      const linkData = {
        name: values.name,
        link: values.link,
        id: editingLink?.id,
        is_active: 1,
        // is_active: status ? 1 : 0,
        user_ids: [userForEdit?.user?.id] // Filter out any falsy values
      };

      if (editingLink) {
        // If editing, update the link
        const response = await dispatch(updateLinkAction(linkData));
        if (response?.payload?.meta?.success) {
          // notification.success({
          //   message: "Link updated successfully",
          //   icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
          //   placement: "top",
          //   duration: 3,
          // });
        }
      } else {
        // If adding a new link, create the link
        const response = await dispatch(addLink(linkData));
        if (response?.payload?.meta?.success === true) {
          // notification.success({
          //   message: "Link added successfully",
          //   icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
          //   placement: "top",
          //   duration: 3,
          // });
        }
      }

      setIsModalVisible(false);
      setStatus(false);
      form.resetFields();
      fetchLinksData();
    } catch (error) {
      console.error("Form validation failed:", error);
      // notification.error({
      //   message: "Error",
      //   description: "Please check all required fields",
      //   placement: "top",
      //   duration: 3,
      // });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onChangeSwitch = (checked) => {
    // console.log('checked', checked)
    setStatus(checked)
  }

  return (
    <div>
      <Modal
        title={modalTitle}
        open={isModalVisible}
        onCancel={handleModalCancel}
        onOk={handleModalSubmit}
        okText={editingLink ? "Update" : "Add"}
        okButtonProps={{
          className: "bg-primary hover:bg-primary-dark",
          loading: isSubmitting,
          disabled: isSubmitting
        }}
        cancelButtonProps={{
          disabled: isSubmitting
        }}
        className="link-modal"
        destroyOnClose
        centered
        maskClosable={!isSubmitting}
        closable={!isSubmitting}
        closeIcon={
          <Button
            shape="circle"
            icon={<i className="icon-close before:!m-0 text-sm" />}
            disabled={isSubmitting}
          />
        }
      >
        <Form
          form={form}
          layout="vertical"
          name="linkForm"
          initialValues={{ name: "", link: "", users: [] }}
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label={<Text type="secondary">Name</Text>}
            rules={[
              {
                required: true,
                message: "Please Enter Link Name",
              },
              {
                validator: (_, value) => {
                  if (value && value.trim() === '') {
                    return Promise.reject(new Error('Name cannot be only whitespace'));
                  }
                  return Promise.resolve();
                },
              },
              {
                max: 100,
                message: "Link name cannot exceed 100 characters",
              },
            ]}
          >
            <Input
              placeholder="Enter Link Name"
              className="rounded-lg"
              disabled={isSubmitting}
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="link"
            label={<Text type="secondary">Link</Text>}
            rules={[
              {
                required: true,
                message: "Please Enter Link URL",
              },
              {
                type: "url",
                message: "Please Enter a Valid URL",
              },
            ]}
          >
            <Input
              placeholder="https://example.com"
              className="rounded-lg"
              disabled={isSubmitting}
              size="large"
            />
          </Form.Item>

          {/* <Form.Item
            name="is_active"
            label={<Text type="secondary">Status</Text>}
            valuePropName="checked"
          >
            <Switch
              size="default"
              checkedChildren="Active"
              unCheckedChildren="Inactive"
              checked={status}
              onChange={onChangeSwitch}
            />
          </Form.Item> */}
        </Form>
      </Modal>
      <div className="h-full pt-">
        <Row className="mb-4" justify={'space-between'}>
          <Col xs={12} md={8}>
            <Title level={4}>All Links</Title>
          </Col>
          <Col xs={12} md={8} className='flex'>
            <Input
              size="large"
              prefix={
                <SearchOutlined className="absolute left-4 top-1/2 text-xl transform -translate-y-1/2 text-grayText" />
              }
              placeholder="Search by Name or Link"
              className="bg-[#171717] border-[#373737] rounded-full pl-10 mr-4"
              // style={{ width: "100%" }}
              onChange={onSearchChange}
              value={searchValue}
              allowClear
              disabled={isSubmitting || isDeleting}
            />
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={showAddModal}
              className="rounded-3xl w-full sm:w-auto"
              disabled={isSubmitting || isDeleting}
              loading={false}
            >
              Add Link
            </Button>
          </Col>

        </Row>
        {linksLoading || !userForEdit?.user?.id ? (
          <div className="flex items-center justify-center h-[30vh]">
            <Spin size="large" />
          </div>
        ) : links?.data?.links?.length > 0 ? (
          <div className="overflow-auto">
            <Table
              columns={columns}
              dataSource={links?.data?.links}
              rowKey={(record) => record.id}
              pagination={{
                ...tableParams.pagination,
                total: links?.data?.pagination?.totalRecords || 0,
                current:
                  Number.parseInt(
                    links?.data?.pagination?.currentPage
                  ) || 1,
                pageSize:
                  Number.parseInt(
                    links?.data?.pagination?.perPage
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
              }}
            />
          </div>
        ) : (
          <div className="flex justify-center items-center h-64">
            <Empty description="No Links Found" />
          </div>
        )}
      </div>
    </div>
  )
}

export default MyLinks