import React, { useState, useEffect } from "react";
import { Input, Select, Button, Space, Tag, Spin } from "antd";
import {
  PlusOutlined,
  FilterOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { DebounceInput } from "react-debounce-input";
import ActionTagTable from "../../components/Common/ActionTagTable";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminUsers,
  removeAdminUser,
} from "../../services/Store/Employee/actions";
import DeleteModal from "./Components/DeleteModal/index";
import Loading from "../../components/Common/Loading";
import Nodata from "../../assets/no-data.jpg";
import { useNavigate } from "react-router-dom";
import { tryDecrypt } from "../../utils/cryption";
import { hasPermission } from "../../utils/commonfunction";

const { Option } = Select;

const AdminEmployeeTable = () => {
  const [deleteableId, setDeleteableId] = useState(null);
  const [isShowDeleteModal, setIsShowDeleteModal] = useState(false);
  const [searchText, setSearchText] = useState(null);
  const [filter, setFilter] = useState(null);
  const [paginationForTable, setPaginationforTable] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    itemLength: 0,
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    adminUsers,
    adminUsersLoading,
    deleteAdmin,
  } = useSelector((state) => state.adminUsers);

  // Fetch admin users on search change
  useEffect(() => {
    const data = {
      page: 1,
      search: searchText?.trim(),
      status: filter,
      limit: paginationForTable.pageSize,
    };
    dispatch(fetchAdminUsers(data));
  }, [searchText]);

  // Update pagination when data changes
  useEffect(() => {
    setPaginationforTable({
      current: adminUsers?.data?.pagination?.currentPage,
      pageSize: paginationForTable?.pageSize,
      total: adminUsers?.data?.pagination?.totalRecords,
      itemLength: adminUsers?.data?.data?.length,
    });
  }, [adminUsers]);

  // Handle page change
  const handleChange = (pagination) => {
    const { current, pageSize } = pagination;
    setPaginationforTable({
      ...paginationForTable,
      pageSize: pageSize,
    });
    const data = {
      page: current,
      search: searchText,
      status: filter || "",
      limit: pageSize,
    };
    dispatch(fetchAdminUsers(data));
  };

  // Handle search
  const handleSearch = (e) => {
    if(e.target.value.trim().length > 0){
      setSearchText(e.target.value);     
  }else{
   setSearchText(null);
  }
  };

  // Handle filter
  const handleFilter = (value) => {
    setFilter(value);
    const newData = {
      page: 1,
      search: searchText,
      limit: paginationForTable.pageSize,
      status: value,
    };
    dispatch(fetchAdminUsers(newData));
  };

  const columns = [
    {
      title: "Sr.No",
      key: "serial",
      render: (text, record, index) => (
        <span>
          {(paginationForTable.current - 1) * paginationForTable.pageSize +
            index +
            1}
        </span>
      ),
      width: "8%",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div className="">
          <span onClick={() => onClickView(record)} className="cursor-pointer">
            {tryDecrypt(record?.first_name)} {tryDecrypt(record?.last_name)}
          </span>
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text) => <span>{tryDecrypt(text)}</span>,
    },
    {
      title: "Phone",
      dataIndex: "phone_number",
      key: "phone",
      render: (text) => <span>{tryDecrypt(text)}</span>,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (roles) => (
        <span>{roles?.[0]?.name ? tryDecrypt(roles[0].name) : "N/A"}</span>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => (
        <Tag
          color={record?.status === "ACTIVE" ? "green" : "volcano"}
          className="text-capitalize"
        >
          {record?.status === "ACTIVE" ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "action",
      width: "15%",
      render: (_, record) => (
        <Space size="middle">
          <EyeOutlined
            className="text-blue-500 cursor-pointer"
            onClick={() => onClickView(record)}
          />
         {hasPermission("employee_management", "update") &&  <EditOutlined
            className="text-primary cursor-pointer"
            onClick={() => onClickEdit(record)}
          />}
          {hasPermission("employee_management", "delete") &&<DeleteOutlined
          style={{ color: "#ee4b4f" }}
            className="text-danger cursor-pointer"
            onClick={() => onClickDelete(record)}
          />}
        </Space>
      ),
    },
  ];

  // Navigation handlers
  const onClickAdd = () => {
    navigate("/employee-management/create");
  };

  const onClickEdit = (record) => {
    navigate(`/employee-management/edit/${record?.id}`);
  };

  const onClickView = (record) => {
    navigate(`/employee-management/detail/${record?.id}`);
  };

  // Handle delete with reason
  const onDeleteConfirm = (reason) => {
    dispatch(removeAdminUser({ id: deleteableId, reason }));
    setIsShowDeleteModal(false);
  };

  const onDeleteCancel = () => {
    setIsShowDeleteModal(false);
  };

  const onClickDelete = (record) => {
    setDeleteableId(record?.id);
    setIsShowDeleteModal(true);
  };

  // Handle pagination after delete
  useEffect(() => {
    if (deleteAdmin?.meta?.success === true) {
      const isSingleItemOnPage = paginationForTable?.itemLength === 1;
      const currentPage = paginationForTable?.current;

      let newData = {
        search: searchText,
        status: filter,
        limit: paginationForTable.pageSize,
      };

      if (isSingleItemOnPage && currentPage > 1) {
        newData.page = currentPage - 1;
      } else {
        newData.page = currentPage;
      }

      dispatch(fetchAdminUsers(newData));
    }
  }, [deleteAdmin]);

  return (
    <div>
      <DeleteModal
        openModal={isShowDeleteModal}
        onOk={onDeleteConfirm}
        onCancel={onDeleteCancel}
        text="Are you sure you want to delete this admin user?"
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Admin Employees</h1>
        {hasPermission("employee_management", "create") && <Button
          type="primary"
          icon={<PlusOutlined />}
          className="w-full md:w-auto"
          size="large"
          onClick={onClickAdd}
        >
          Add Admin Employee
        </Button>}
      </div>

      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <DebounceInput
              element={Input}
              onChange={handleSearch}
              minLength={1}
              debounceTimeout={500}
              placeholder="Search Admin Employee with First Name or Last Name or Email"
              size="large"
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              style={{ width: "100%" }}
              placeholder="Filter by Status"
              onChange={handleFilter}
              allowClear
              size="large"
            >
              <Option value="ACTIVE">Active</Option>
              <Option value="INACTIVE">Inactive</Option>
            </Select>
          </div>
        </div>
        {(searchText || filter) && (
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <FilterOutlined className="mr-2" />
            <span>
              Showing results for
              {searchText && (
                <span className="font-medium"> "{searchText}"</span>
              )}
              {filter && searchText && " and "}
              {filter && (
                <span className="font-medium">
                  {filter === "ACTIVE" ? " Active" : " Inactive"}
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {adminUsersLoading ? (
       <div className="flex justify-center items-center h-[50vh]">
       <Spin size="large" />
     </div>
      ) : adminUsers?.data?.data?.length > 0 ? (
        <div className="overflow-x-auto">
          <ActionTagTable
            dataSource={adminUsers?.data?.data}
            columns={columns}
            pagination={paginationForTable}
            handleChange={handleChange}
          />
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center h-full">
          <img src={Nodata} alt="no data" width={250} height={200} />
          <div className="text-2xl">No data found!</div>
        </div>
      )}
    </div>
  );
};

export default AdminEmployeeTable;