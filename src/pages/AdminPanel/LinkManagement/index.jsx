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
    Modal,
    Form,
    Select,
    Switch,
    Tag,
    Tooltip
} from "antd";
import {
    CheckCircleOutlined,
    EyeOutlined,
    CopyOutlined,
    PlusOutlined,
    SearchOutlined,
    CaretRightOutlined,
    ExclamationCircleOutlined
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import ShadowBoxContainer from "../../../components/AuthLayout/ShadowBoxContainer";
import { useDispatch, useSelector } from "react-redux";
import {
    addLink,
    fetchLinks,
    removeLink,
    updateLinkAction,
} from "../../../services/Store/Link/action";
import { fetchDropdownUsers } from "../../../services/Store/Auth/action";

const { Text, Title } = Typography;
const { Option } = Select;

const LinkManagement = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Get links data from Redux store
    const { links, linksLoading } = useSelector(
        (state) => state?.links || {}
    );

    // State for links data and filters
    const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
    const [tableParams, setTableParams] = useState({
        pagination: {
            current: 1,
            pageSize: 10,
            total: 0,
        },
        search: "",
    });

    // Modal states
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [linkToDelete, setLinkToDelete] = useState(null);
    const [modalTitle, setModalTitle] = useState("Add Link");
    const [editingLink, setEditingLink] = useState(null);
    const [status, setStatus] = useState(false);
    const [form] = Form.useForm();

    // Users dropdown state
    const [usersData, setUsersData] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [combinedUsersData, setCombinedUsersData] = useState([]);

    // Loading states for individual operations
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Debounce search with useRef to store timeout ID
    const searchTimeoutRef = useRef(null);
    const [searchValue, setSearchValue] = useState("");

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

    // Fetch users data
    const fetchUsersData = async () => {
        setUsersLoading(true);
        try {
            const res = await dispatch(fetchDropdownUsers({ role: "LO" }));
            if (res?.payload?.meta?.success) {
                console.log('Res Role Record', res?.payload?.data);
                const users = res?.payload?.data?.users || [];
                setUsersData(users);
                // Initialize combinedUsersData with available users
                setCombinedUsersData(users.map(user => ({ ...user, isUnavailable: false })));
            }
        } catch (e) {
            console.log('Error:', e);
        } finally {
            setUsersLoading(false);
        }
    };

    // Fetch links based on current tableParams
    const fetchLinksData = () => {
        const params = {
            page: tableParams.pagination.current.toString(),
            per_page: tableParams.pagination.pageSize.toString(),
            ...(tableParams.search && { search: tableParams.search }),
        };

        dispatch(fetchLinks(params));
    };

    useEffect(() => {
        // Fetch users data on component mount
        fetchUsersData();

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
        fetchLinksData();
    }, []);

    // Refetch when tableParams change (pagination, search, etc.)
    useEffect(() => {
        fetchLinksData();
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

    const handleDeleteLink = async (linkId) => {
        setIsDeleting(true);
        try {
            const response = await dispatch(removeLink(linkId));
            if (response?.payload?.meta?.success) {
                fetchLinksData(); // Refresh the link list
            } else {
                notification.error({
                    message: "Error",
                    description:
                        response?.payload?.meta?.message || "Failed to delete link",
                    placement: "top",
                    duration: 3,
                });
            }
        } catch (error) {
            notification.error({
                message: "Error",
                description: "Failed to delete link",
                placement: "top",
                duration: 3,
            });
        } finally {
            setIsDeleting(false);
        }
    };

    // Modal handlers
    const showAddModal = () => {
        setModalTitle("Add Link");
        setEditingLink(null);
        setStatus(false);
        form.resetFields();
        // Reset to only available users when adding new link
        setCombinedUsersData(usersData.map(user => ({ ...user, isUnavailable: false })));
        setIsModalVisible(true);
    };

    const showEditModal = (record) => {
        console.log('record', record);

        setModalTitle("Edit Link");
        setEditingLink(record);

        // Create combined users list including users from the link that might not be in usersData
        const linkUsers = record.users || [];
        const currentUserIds = usersData.map(user => user.id);

        // Add users from link that are not in current usersData (mark them as unavailable)
        const unavailableUsers = linkUsers
            .filter(linkUser => !currentUserIds.includes(linkUser.id))
            .map(linkUser => ({
                ...linkUser,
                isUnavailable: true
            }));

        // Combine available users with unavailable users
        const combined = [
            ...usersData.map(user => ({ ...user, isUnavailable: false })),
            ...unavailableUsers
        ];

        setCombinedUsersData(combined);

        // Set form values with all user IDs (both available and unavailable)
        const selectedUserIds = linkUsers.map(user => user.id);

        form.setFieldsValue({
            name: record.name,
            link: record.link,
            is_active: record.is_active,
            users: selectedUserIds
        });
        setStatus(record?.is_active);
        setIsModalVisible(true);
    };

    const showDeleteModal = (record) => {
        setLinkToDelete(record);
        setIsDeleteModalVisible(true);
    };

    const handleCancelDelete = () => {
        setIsDeleteModalVisible(false);
    };

    const handleConfirmDelete = () => {
        if (linkToDelete) {
            handleDeleteLink(linkToDelete.id);
            setIsDeleteModalVisible(false);
        }
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
        setStatus(false);
        form.resetFields();
        setCombinedUsersData([]);
    };

    const onChangeSwitch = (checked) => {
        setStatus(checked);
    };

    const handleModalSubmit = async () => {
        try {
            const values = await form.validateFields();
            setIsSubmitting(true);

            const linkData = {
                name: values.name,
                link: values.link,
                id: editingLink?.id,
                is_active: status ? 1 : 0,
                user_ids: values.users || []
            };

            if (editingLink) {
                // If editing, update the link
                const response = await dispatch(updateLinkAction(linkData));
                if (response?.payload?.meta?.success) {
                    // notification.success({
                    //     message: "Link updated successfully",
                    //     icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
                    //     placement: "top",
                    //     duration: 3,
                    // });
                }
                setIsModalVisible(false);
                setStatus(false);
                form.resetFields();
                fetchLinksData();
            } else {
                // If adding a new link, create the link
                const response = await dispatch(addLink(linkData));
                if (response?.payload?.meta?.success === true) {
                    // setAddLinkSuccessModal(true);
                }

                setIsModalVisible(false);
                setStatus(false);
                form.resetFields();
                fetchLinksData();
            }
        } catch (error) {
            console.error("Form validation failed:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Table columns
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
            title: "Status",
            dataIndex: "is_active",
            key: "is_active",
            width: "10%",
            render: (isActive) =>
                isActive ? (
                    <Tag
                        className="px-2 py-1 rounded-md bg-gray text-white"
                        style={{ borderLeft: "3px solid #4CAF50" }}
                    >
                        Active
                    </Tag>
                ) : (
                    <Tag
                        className="px-2 py-1 rounded-md bg-gray text-white"
                        style={{ borderLeft: "3px solid #c53b37" }}
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
                    <Button
                        type="text"
                        icon={<i className="icon-delete" />}
                        className="text-red-500 hover:text-red-600 text-lg"
                        onClick={() => showDeleteModal(record)}
                        disabled={isDeleting || isSubmitting}
                    />
                </div>
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
                            Link Management
                        </Text>
                    </Title>
                </div>
            </Col>

            <Col span={24} className="h-full mb-4">
                <ShadowBoxContainer height={containerHeight}>
                    <>
                        {(
                            <>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-0">
                                    <div className="flex items-center">
                                        <div className="text-2xl font-normal">Links</div>
                                        {links?.data?.pagination?.totalRecords > 0 && (
                                            <>
                                                <span className="mx-3 text-grayText">&#8226;</span>
                                                <div className="bg-primaryOpacity rounded-lg px-3 py-1 text-primary">
                                                    {links?.data?.pagination?.totalRecords || ""}
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
                                        disabled={isSubmitting || isDeleting}
                                        loading={false}
                                    >
                                        Add Link
                                    </Button>
                                </div>

                                <div className="flex gap-3 mb-3 pt-3 items-center">
                                    <div className="relative max-w-md w-full">
                                        <Input
                                            size="large"
                                            prefix={
                                                <SearchOutlined className="absolute left-4 top-1/2 text-xl transform -translate-y-1/2 text-grayText" />
                                            }
                                            placeholder="Search by Name or Link"
                                            className="bg-[#171717] border-[#373737] rounded-full pl-10"
                                            style={{ width: "100%" }}
                                            onChange={onSearchChange}
                                            value={searchValue}
                                            allowClear
                                            disabled={isSubmitting || isDeleting}
                                        />
                                    </div>
                                </div>

                                <div className="h-full pt-6">
                                    {linksLoading ? (
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
                            </>
                        )}
                    </>
                </ShadowBoxContainer>
            </Col>

            {/* Add/Edit Link Modal */}
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
                width={'30%'}
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
                    <Form.Item
                        name="users"
                        label={<Text type="secondary">Users</Text>}
                    >
                        <Select
                            mode="multiple"
                            size="large"
                            placeholder="Select Users"
                            className="rounded-lg"
                            disabled={isSubmitting || usersLoading}
                            allowClear
                            showSearch
                            maxTagCount={3}
                            loading={usersLoading}
                            filterOption={(input, option) => {
                                const user = combinedUsersData.find(u => u.id === option.value);
                                return user?.name?.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                            }}
                            notFoundContent={usersLoading ? <Spin size="small" /> : "No users found"}
                            tagRender={(props) => {
                                const { label, value, closable, onClose } = props;
                                const user = combinedUsersData.find(u => u.id === value);
                                const isUnavailable = user?.isUnavailable;

                                return (
                                    <Tag
                                        color={isUnavailable ? "error" : "default"}
                                        closable={closable}
                                        onClose={onClose}
                                        style={{
                                            marginRight: 3,
                                            // backgroundColor: isUnavailable ? "#ff4d4f" : undefined,
                                            borderColor: isUnavailable ? "#ff4d4f" : undefined,
                                            color: isUnavailable ? "white" : undefined,
                                        }}
                                    >
                                        {label}
                                    </Tag>
                                );
                            }}
                        >
                            {combinedUsersData.map((user) => (
                                <Option
                                    key={user.id}
                                    value={user.id}
                                    style={{
                                        color: user.isUnavailable ? "#ff4d4f" : undefined,
                                        backgroundColor: user.isUnavailable ? "#fff2f0" : undefined,
                                    }}
                                >
                                    <span style={{ color: user.isUnavailable ? "#ff4d4f" : undefined }}>
                                        {user.name} {user.isUnavailable ? <Tooltip placement="top" title={'Inactive User'} arrow={true}><ExclamationCircleOutlined className="text-xs cursor-pointer" /> </Tooltip> : null}
                                    </span>
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
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
                    </Form.Item>
                </Form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                title="Delete Link"
                centered
                destroyOnClose
                open={isDeleteModalVisible}
                footer={false}
                onCancel={handleCancelDelete}
                maskClosable={!isDeleting}
                closable={!isDeleting}
                closeIcon={
                    <Button
                        shape="circle"
                        icon={<i className="icon-close before:!m-0 text-sm" />}
                        disabled={isDeleting}
                    />
                }
            >
                <div className="border-t-2 border-solid border-[#373737] mt-5">
                    <Row gutter={16} className="">
                        <div className="w-full pt-5 flex items-center justify-center pb-5">
                            <Text className="text-base font-normal text-grayText text-center">
                                Are you sure you want to delete this Link?
                            </Text>
                        </div>
                        <Col span={12}>
                            <Button
                                block
                                onClick={handleCancelDelete}
                                size="large"
                                disabled={isDeleting}
                            >
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
                                loading={isDeleting}
                                disabled={isDeleting}
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

export default LinkManagement;