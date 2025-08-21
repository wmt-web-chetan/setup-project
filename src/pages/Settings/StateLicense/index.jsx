import React, { useState, useEffect } from "react";
import {
  ExclamationCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  Button,
  Row,
  Col,
  Tag,
  Table,
  Spin,
  Empty,
  Typography,
  Modal,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStateLicenses,
  removeStateLicense,
} from "../../../services/Store/StateLicense/action";
import UploadLicenseModal from "./UploadLicenseModal";

const { Text } = Typography;

const StateLicense = () => {
  const dispatch = useDispatch();

  // Get state licenses data from Redux store
  const { stateLicenses, stateLicensesLoading, deleteStateLicenseLoading } =
    useSelector((state) => state?.stateLicenses);

  // State for licenses data and pagination
  const [licenses, setLicenses] = useState(null);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
  });

  const [containerHeight, setContainerHeight] = useState("calc(100vh - 400px)");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [licenseToDelete, setLicenseToDelete] = useState(null);

  // Fetch licenses based on current tableParams
  const fetchLicenses = () => {
    const params = {
      page: tableParams.pagination.current.toString(),
      per_page: tableParams.pagination.pageSize.toString(),
      is_user: true,
    };

    dispatch(fetchStateLicenses(params)).then((res) => {
      if (res?.payload?.data?.state_licenses) {
        setLicenses(res?.payload?.data?.state_licenses || []);
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
    fetchLicenses();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setContainerHeight(
        window.innerWidth < 768 ? "calc(100vh - 380px)" : "calc(100vh - 400px)"
      );
    };

    // Set initial height
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Refetch when tableParams change (pagination)
  useEffect(() => {
    fetchLicenses();
  }, [tableParams.pagination.current, tableParams.pagination.pageSize]);

  // Handle table pagination change
  const handleTableChange = (pagination) => {
    setTableParams({
      ...tableParams,
      pagination,
    });
  };

  // Handle view license
  const handleViewLicense = (record) => {
    // Open license file in new window/tab
    if (record?.license_path) {
      const fileUrl = `${import.meta.env.VITE_IMAGE_BASE_URL}/${
        record.license_path
      }`;
      window.open(fileUrl, "_blank");
    }
  };

  // Handle delete license - show modal
  const handleDeleteLicense = (record) => {
    setLicenseToDelete(record);
    setIsDeleteModalVisible(true);
  };

  // Handle cancel delete
  const handleCancelDelete = () => {
    if (!deleteStateLicenseLoading) {
      setIsDeleteModalVisible(false);
      setLicenseToDelete(null);
    }
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (licenseToDelete) {
      dispatch(removeStateLicense(licenseToDelete.id)).then((res) => {
        if (res?.payload?.meta?.success === true) {
          setIsDeleteModalVisible(false);
          setLicenseToDelete(null);

          // Update local state to reflect the deletion immediately
          setLicenses(
            (prevLicenses) =>
              prevLicenses?.filter(
                (license) => license.id !== licenseToDelete.id
              ) || []
          );

          // Update pagination count
          setTableParams((prevParams) => ({
            ...prevParams,
            pagination: {
              ...prevParams.pagination,
              total: Math.max(0, prevParams.pagination.total - 1),
            },
          }));
        }
      });
    }
  };

  // Handle upload new license
  const handleUploadNewLicense = () => {
    setShowUploadModal(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowUploadModal(false);
  };

  // Handle successful upload
  const handleUploadSuccess = () => {
    // Refresh the licenses list
    fetchLicenses();
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Get status tag color and text
  const getStatusTag = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return (
          <Tag
            className="px-2 py-1 border-none rounded-2xl bg-[#1f312b] text-[#22C55E]"
          >
            Approved
          </Tag>
        );
      case "rejected":
        return (
          <Tag
            className="px-2 py-1 border-none rounded-2xl bg-[#382727] text-[#EF4444]"
          >
            Rejected
          </Tag>
        );
      case "pending":
      default:
        return (
          <Tag
            className="px-2 py-1 border-none  rounded-2xl bg-[#4b3a1c] text-[#FFAA16]"
          >
            Pending
          </Tag>
        );
    }
  };

  // Table columns
  const columns = [
    {
      title: "State",
      dataIndex: "state",
      key: "state",
      width: "25%",
      render: (text) => (
        <Text className="text-white font-medium text-base">{text}</Text>
      ),
    },
    {
      title: "Upload Date",
      dataIndex: "created_at",
      key: "created_at",
      width: "25%",
      render: (text) => (
        <Text className="text-grayText">{formatDate(text)}</Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "25%",
      render: (status) => getStatusTag(status),
    },
    {
      title: "Actions",
      key: "actions",
      width: "25%",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<EyeOutlined />}
            className="text-primary text-lg"
            onClick={() => handleViewLicense(record)}
            title="View License"
            disabled={deleteStateLicenseLoading}
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            className="text-[#EF4444] text-lg"
            onClick={() => handleDeleteLicense(record)}
            title="Delete License"
            disabled={deleteStateLicenseLoading}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <Row>
        <div className="font-bold text-2xl">State License</div>
      </Row>
      <Row className="rounded-2xl bg-liteGrayV1 p-6" gutter={[0, 24]}>
        <div className="bg-[#292c39] border border-[#5A76FF] text-[#5A76FF] w-full py-1 px-3 rounded-lg text-base font-normal">
          <ExclamationCircleOutlined />
          <span className="pl-3">
            Submit licenses for all states you operate in. Uploaded documents
            will be listed below and sent for admin approval.
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-0 w-full">
          <div className="flex items-center">
            <div className="text-2xl font-normal">Licenses</div>
            {licenses?.length > 0 && (
              <>
                <span className="mx-3 text-grayText">&#8226;</span>
                <div className="bg-primaryOpacity rounded-lg px-3 py-1 text-primary">
                  {licenses?.length || 0}
                </div>
              </>
            )}
          </div>
          
          <div className="flex-shrink-0">
            <Button
              type="primary"
              size="large"
              icon={<i className="icon-upload text-xl"></i>}
              className="rounded-3xl"
              onClick={handleUploadNewLicense}
              disabled={deleteStateLicenseLoading}
            >
              Upload New License
            </Button>
          </div>
        </div>

        {/* Licenses Table */}
        <div className="w-full pt-6">
          {stateLicensesLoading || licenses === null ? (
            <div className="loadingClass">
              <Spin size="large" />
            </div>
          ) : licenses?.length > 0 ? (
            <div className="overflow-auto">
              <Table
                columns={columns}
                dataSource={licenses}
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
                className="custom-table bg-[#242424] !rounded-[2rem] mb-6"
                rowClassName="bg-[#242424] hover:bg-darkGray transition-colors"
                scroll={{
                  x: "max-content",
                }}
              />
            </div>
          ) : (
            <div className="flex justify-center items-center h-full">
              <Empty description="No Licenses Found" />
            </div>
          )}
        </div>
      </Row>

      {/* Upload License Modal */}
      <UploadLicenseModal
        isVisible={showUploadModal}
        onCancel={handleModalClose}
        onSuccess={handleUploadSuccess}
      />

      {/* Delete License Modal */}
      <Modal
        title="Delete License"
        centered
        destroyOnClose
        open={isDeleteModalVisible}
        footer={false}
        onCancel={handleCancelDelete}
        maskClosable={!deleteStateLicenseLoading}
        closeIcon={
          <Button
            shape="circle"
            icon={<i className="icon-close before:!m-0 text-sm" />}
            disabled={deleteStateLicenseLoading}
          />
        }
      >
        <div className="border-t-2 border-solid border-[#373737] mt-5">
          <Row gutter={16} className="">
            <div className="w-full pt-5 flex flex-col items-center justify-center pb-5">
              <Text className="text-base font-normal text-grayText text-center">
                Are you sure you want to delete this license?
              </Text>
            </div>
            <Col span={12}>
              <Button
                block
                onClick={handleCancelDelete}
                size="large"
                disabled={deleteStateLicenseLoading}
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
                loading={deleteStateLicenseLoading}
              >
                Confirm Deletion
              </Button>
            </Col>
          </Row>
        </div>
      </Modal>
    </>
  );
};

export default StateLicense;