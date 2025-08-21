import React, { useState, useEffect } from "react";
import { Typography, Row, Col, Table, Button, Spin, Empty } from "antd";
import { EyeOutlined, DownloadOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchInvoiceHistory } from "../../../../services/Store/Subscription/action";
import ShadowBoxContainer from "../../../../components/AuthLayout/ShadowBoxContainer";

const { Text, Title } = Typography;

const InvoiceHistoryTable = () => {
  const dispatch = useDispatch();

  // Get invoice history data from Redux store
  const { invoiceHistoryLoading } = useSelector(
    (state) => state?.subscriptions
  );

  // State for invoice history data and pagination
  const [invoiceHistory, setInvoiceHistory] = useState(null);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
  });

  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");

  // Fetch invoice history data
  const fetchInvoiceHistoryData = () => {
    dispatch(fetchInvoiceHistory()).then((res) => {
      if (res?.payload?.data?.users) {
        setInvoiceHistory(res?.payload?.data?.users || []);
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
    fetchInvoiceHistoryData();
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

  // Handle table pagination change
  const handleTableChange = (pagination) => {
    setTableParams({
      ...tableParams,
      pagination,
    });
  };

  // Handle view invoice
  const handleViewInvoice = (record) => {
    if (record?.invoice_url) {
      window.open(record.invoice_url, "_blank");
    }
  };

  // Handle download invoice
  const handleDownloadInvoice = (record) => {
    if (record?.receipt_url) {
      window.open(record.receipt_url, "_blank");
    }
  };

  // Table columns
  const columns = [
    {
      title: "Invoice ID",
      dataIndex: "id",
      key: "id",
      width: "25%",
      render: (text) => (
        <Text className="text-white font-medium text-base">{text}</Text>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: "20%",
      render: (text) => <Text className="text-grayText">{text}</Text>,
    },
    {
      title: "Plan",
      dataIndex: "plan",
      key: "plan",
      width: "20%",
      render: (text) => <Text className="text-grayText">{text || "N/A"}</Text>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: "20%",
      render: (text) => <Text className="text-white font-medium">{text}</Text>,
    },
    {
      title: "Actions",
      key: "actions",
      width: "15%",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<EyeOutlined />}
            className="text-primary text-lg"
            onClick={() => handleViewInvoice(record)}
            title="View Invoice"
          />
          <Button
            type="text"
            icon={<DownloadOutlined />}
            className="text-primary text-lg"
            onClick={() => handleDownloadInvoice(record)}
            title="Download Invoice"
          />
        </div>
      ),
    },
  ];

  return (
    <Row className="w-full flex flex-col gap-3 sm:gap-6 mt-6">
      <Col span={24} className="h-full mb-4">
        {/* <ShadowBoxContainer
          height={containerHeight}
          overflow={
            !invoiceHistoryLoading && invoiceHistory !== null && invoiceHistory.length === 0
              ? "hidden"
              : "auto"
          }
        > */}
        <>
          {invoiceHistoryLoading || invoiceHistory === null ? (
            <div className="loadingClass">
              <Spin size="large" />
            </div>
          ) : (
            <>
              <div className="flex mt-0 items-center">
                <div className="font-bold text-2xl">Plan History</div>
                {invoiceHistory?.length > 0 && (
                  <>
                    <span className="mx-3 text-grayText">&#8226;</span>
                    <div className="bg-primaryOpacity rounded-lg px-3 py-1 text-primary">
                      {invoiceHistory?.length || ""}
                    </div>
                  </>
                )}
              </div>

              <div className=" pt-6">
                {invoiceHistoryLoading || invoiceHistory === null ? (
                  <div className="loadingClass">
                    <Spin size="large" />
                  </div>
                ) : invoiceHistory?.length > 0 ? (
                  <div className="overflow-auto">
                    <Table
                      columns={columns}
                      dataSource={invoiceHistory}
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
                      className="custom-table invoice-history-table bg-[#242424] !rounded-[2rem] mb-6"
                      rowClassName="bg-[#242424] hover:bg-darkGray transition-colors"
                      scroll={{
                        x: "max-content",
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <Empty description="No Invoice History Found" />
                  </div>
                )}
              </div>
            </>
          )}
        </>
        {/* </ShadowBoxContainer> */}
      </Col>
    </Row>
  );
};

export default InvoiceHistoryTable;
