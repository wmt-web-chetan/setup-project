import React, { useState, useEffect } from "react";
import {
  Typography,
  Row,
  Col,
  Button,
  Tag,
  notification,
  Form,
  Input,
  Checkbox,
  Collapse,
  Spin,
  Card,
  Divider,
  Switch,
} from "antd";
import {
  TeamOutlined,
  SaveOutlined,
  RollbackOutlined,
  LockOutlined,
  CheckSquareOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ShadowBoxContainer from "../../../components/AuthLayout/ShadowBoxContainer";
import {
  addRoleAction,
  fetchPermissions,
  fetchRoleDetails,
  updateRoleData,
} from "../../../services/Store/Permission/action";

const { Text, Title } = Typography;

const PermissionsManagement = () => {
  const { roleId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [permissionsData, setPermissionsData] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const isEditMode = !!roleId;

  // Get permissions from Redux store
  const {
    permissions,
    permissionsLoading,
    permissionsError,
    roleDetails,
    roleDetailsLoading,
  } = useSelector((state) => state?.permissions);

  // Get role creation loading state from Redux store
  const { createRoleLoading } = useSelector((state) => state?.permissions);

  // Reset component state when roleId changes
  useEffect(() => {
    // Clear previous role data when navigating to different role
    setRole(null);
    setSelectedPermissions({});
    form.resetFields();
    setLoading(true);

    // Fetch new data
    dispatch(fetchPermissions());
    if (isEditMode) {
      dispatch(fetchRoleDetails(roleId));
    } else {
      setLoading(false);
    }

    // Cleanup function to reset state when component unmounts or roleId changes
    return () => {
      setRole(null);
      setSelectedPermissions({});
      form.resetFields();
    };
  }, [dispatch, isEditMode, roleId, form]);

  // Update role and permissions when role details are fetched
  useEffect(() => {
    if (isEditMode && roleDetails?.data) {
      // Set role data
      if (roleDetails?.data?.role) {
        setRole(roleDetails?.data?.role);
        form.setFieldsValue({ full_name: roleDetails?.data?.role?.full_name });
        form.setFieldsValue({ status: roleDetails?.data?.role?.status });
      }

      // Set selected permissions
      if (
        roleDetails?.data?.permissions &&
        Array.isArray(roleDetails?.data?.permissions)
      ) {
        const permissionsObj = {};
        roleDetails?.data?.permissions.forEach((item) => {
          // Since we're only showing view permissions in the UI, 
          // any permission_id from the response should be selected
          permissionsObj[item.permission_id] = true;
        });
        setSelectedPermissions(permissionsObj);
      }

      setLoading(false);
    }
  }, [roleDetails, isEditMode, form]);

  // Update permissions data when Redux store is updated - Filter to only view permissions
  useEffect(() => {
    if (permissions?.data) {
      // Filter to only include "view" permissions
      const filteredPermissions = permissions.data.map(categoryObj => {
        const categoryName = Object.keys(categoryObj)[0];
        const categoryPermissions = categoryObj[categoryName];
        
        // Filter to only include permissions that contain "view" in the name
        const viewPermissions = categoryPermissions.filter(permission => 
          permission.name.toLowerCase().includes('view')
        );
        
        return {
          [categoryName]: viewPermissions
        };
      }).filter(categoryObj => {
        // Remove categories that have no view permissions
        const categoryName = Object.keys(categoryObj)[0];
        return categoryObj[categoryName].length > 0;
      });
      
      setPermissionsData(filteredPermissions);
      if (!isEditMode) {
        setLoading(false);
      }
    }
  }, [permissions, isEditMode]);

  // Handle permission changes
  const handlePermissionChange = (permissionId, checked) => {
    setSelectedPermissions((prev) => ({
      ...prev,
      [permissionId]: checked,
    }));
  };

  // Select all permissions in a category
  const selectAllInCategory = (categoryPermissions, checked) => {
    const updatedPermissions = { ...selectedPermissions };

    categoryPermissions.forEach((permission) => {
      updatedPermissions[permission?.id] = checked;
    });

    setSelectedPermissions(updatedPermissions);
  };

  // Select ALL permissions across ALL categories
  const selectAllPermissions = (checked) => {
    const allPermissions = {};

    permissionsData.forEach((categoryObj) => {
      const categoryName = Object.keys(categoryObj)[0];
      const permissions = categoryObj[categoryName];

      permissions.forEach((permission) => {
        allPermissions[permission?.id] = checked;
      });
    });

    setSelectedPermissions(allPermissions);
  };

  // Check if all permissions in a category are selected
  const areAllSelected = (categoryPermissions) => {
    return categoryPermissions?.every(
      (permission) => selectedPermissions[permission?.id]
    );
  };

  // Check if some permissions in a category are selected
  const areSomeSelected = (categoryPermissions) => {
    return (
      categoryPermissions?.some(
        (permission) => selectedPermissions[permission?.id]
      ) && !areAllSelected(categoryPermissions)
    );
  };

  // Check if ALL permissions across ALL categories are selected
  const areAllPermissionsSelected = () => {
    let allPermissionIds = [];

    permissionsData.forEach((categoryObj) => {
      const categoryName = Object.keys(categoryObj)[0];
      const permissions = categoryObj[categoryName];

      permissions.forEach((permission) => {
        allPermissionIds.push(permission?.id);
      });
    });

    return (
      allPermissionIds.length > 0 &&
      allPermissionIds.every((id) => selectedPermissions[id])
    );
  };

  // Save role and permissions
  const handleSave = async (values) => {
    try {
      const selectedPermissionIds = Object.keys(selectedPermissions)
        .filter((key) => selectedPermissions[key])
        .map((key) => parseInt(key));

      // Prepare data to send
      let dataToSend;

      if (isEditMode) {
        if (areAllPermissionsSelected()) {
          dataToSend = {
            id: roleId,
            full_name: values?.full_name,
            status: values?.status,
            all_permissions: true,
          };
        } else {
          dataToSend = {
            id: roleId,
            full_name: values?.full_name,
            status: values?.status,
            permissions: selectedPermissionIds,
          };
        }
      } else {
        if (areAllPermissionsSelected()) {
          dataToSend = {
            full_name: values?.full_name,
            name: values?.full_name,
            status: values?.status,
            all_permissions: true,
          };
        } else {
          dataToSend = {
            full_name: values?.full_name,
            name: values?.full_name,
            status: values?.status,
            permissions: selectedPermissionIds,
          };
        }
      }

      if (isEditMode) {
        // Set local loading for edit mode
        // setLoading(true);
        // Update existing role - this would be your actual API call
        // Example: await axios.put(`/api/roles/${roleId}`, dataToSend);
        dispatch(updateRoleData(dataToSend))
          .unwrap()
          .then((res) => {
            if (res?.meta?.status === 200) {
              notification.success({
                message: "Success",
                description: `Role "${values?.full_name}" updated successfully!`,
                duration: 3,
              });
              navigate("/admin/roles");
            }
          })
          .catch((error) => {
            console.error("Error creating role:", error);
            notification.error({
              message: "Error",
              description:
                error?.meta?.message ||
                "Failed to create role. Please try again.",
              placement: "topRight",
            });
          });

        // notification.success({
        //   message: "Success",
        //   description: `Role "${values?.name}" updated successfully!`,
        //   placement: "topRight",
        //   style: {
        //     borderLeft: "4px solid #FF6D00",
        //   },
        // });
        // setLoading(false);
      } else {
        // Create new role using Redux action
        dispatch(addRoleAction(dataToSend))
          .unwrap()
          .then((res) => {
            if (res?.meta?.status === 200) {
              notification.success({
                message: "Success",
                description: `Role "${values?.full_name}" created successfully!`,
                duration: 3,
              });
              navigate("/admin/roles");
            }
          })
          .catch((error) => {
            console.error("Error creating role:", error);
            notification.error({
              message: "Error",
              description:
                error?.meta?.message ||
                "Failed to create role. Please try again.",
              placement: "topRight",
            });
          });
      }
    } catch (error) {
      console.error("Error saving role:", error);
      notification.error({
        message: "Error",
        description: `Failed to ${isEditMode ? "update" : "create"
          } role. Please try again.`,
        placement: "topRight",
      });
      if (isEditMode) {
        setLoading(false);
      }
    }
  };

  // Determine if we're loading based on local state, Redux permissions loading, role details loading, or role creation loading
  const isLoading =
    loading ||
    permissionsLoading ||
    roleDetailsLoading ||
    (createRoleLoading ?? false);

  // Show skeleton/loading view while data is being fetched
  const renderLoadingView = () => (
    <div className=" h-full loadingClass">
      <Spin size="large" />
    </div>
  );

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
              to="/admin"
              className="text-primary hover:text-primary flex justify-center"
            >
              <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
                Dashboard
              </Text>
            </Link>
            <Text className="text-grayText mx-2"> <i className="icon-right-arrow"/> </Text>
            <Link
              to="/admin/roles"
              className="text-primary hover:text-primary flex justify-center"
            >
              <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
                Roles & Permissions
              </Text>
            </Link>
            <Text className="text-grayText mx-2"><i className="icon-right-arrow"/> </Text>
            <Text className="text-white text-lg sm:text-2xl">
              {isEditMode
                ? `Edit ${role?.full_name || "Role"}`
                : "Create New Role"}
            </Text>
          </Title>
        </div>
        <div className="flex gap-2">
          <Button
            size="large"
            icon={<RollbackOutlined />}
            onClick={() => navigate("/admin/roles")}
            className="rounded-3xl"
          >
            Back
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            loading={isLoading}
            className="rounded-3xl"
            disabled={isLoading}
          >
            {isEditMode ? "Save Changes" : "Create Role"}
          </Button>
        </div>
      </Col>

      <Col span={24} className="h-full">
        <ShadowBoxContainer height="calc(100vh - 241px)">
          {isLoading ? (
            renderLoadingView()
          ) : (
            <div className="h-full overflow-auto p-4">
              <Row gutter={[24, 24]}>
                {/* Role Details Section */}
                <Col span={24}>
                  <Card className="bg-[#242424] border-0 shadow-md">
                    <div className="mb-6 flex items-center">
                      <TeamOutlined className="text-primary text-3xl mr-4" />
                      <Title level={4} className="text-white m-0">
                        Role Details
                      </Title>
                    </div>

                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={handleSave}
                      className="role-form"
                      requiredMark={false}
                    >
                      <Row gutter={16}>
                        <Col xs={24} md={24}>
                          <Form.Item
                            name="full_name"
                            label={
                              <Text className="text-white">Role Name</Text>
                            }
                            rules={[
                              {
                                required: true,
                                message: "Please enter a role name!",
                              },
                              {
                                whitespace: true,
                                message: "Role Name Cannot Contain Only Whitespace!",
                              },
                              {
                                min: 2,
                                message: "Role Name Must Be At Least 2 Characters!",
                              },
                              {
                                max: 150,
                                message: "Role Name Cannot Exceed 150 Characters!",
                              },
                            ]}
                          >
                            <Input size="large" placeholder="Enter Role Name" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={24}>
                          <Form.Item
                            name="status"
                            label={<Text className="text-white">Status</Text>}
                          // rules={[
                          //   { required: true, message: "Please enter a role name" },
                          //   { max: 50, message: "Role name cannot exceed 50 characters" }
                          // ]}
                          >
                            <Switch defaultChecked />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Form>
                  </Card>
                </Col>

                {/* Permissions Section */}
                <Col span={24}>
                  <Card
                    className="bg-[#242424] border-0 shadow-md"
                    title={
                      <div className="flex items-center">
                        <LockOutlined className="text-primary text-xl mr-2" />
                        <Text className="text-white text-lg">
                          Role Permissions
                        </Text>
                      </div>
                    }
                    extra={
                      <Button
                        type="primary"
                        icon={<CheckSquareOutlined />}
                        onClick={() =>
                          selectAllPermissions(!areAllPermissionsSelected())
                        }
                        className="rounded-3xl"
                      >
                        {areAllPermissionsSelected()
                          ? "Deselect All"
                          : "Select All Permissions"}
                      </Button>
                    }
                  >
                    <Text className="text-grayText block mb-6">
                      Select the permissions you want to assign to this role.
                      These permissions will determine what users with this role
                      can access and modify in the system.
                    </Text>

                    {permissionsData?.length > 0 && (
                      <div className="permissions-wrapper">
                        {/* {console.log('permissionsData',permissionsData)} */}
                        <div className="space-y-4">
                          {permissionsData.map((categoryObj, index) => {
                            const categoryName = Object.keys(categoryObj)[0];
                            const permissions = categoryObj[categoryName];
                            
                            return (
                              <div
                                key={index}
                                className="bg-[#2a2a2a] p-4 rounded-md flex items-center justify-between"
                              >
                                <Text className="text-white font-medium text-lg">
                                  {categoryName}
                                </Text>
                                <Checkbox
                                  checked={areAllSelected(permissions)}
                                  indeterminate={areSomeSelected(permissions)}
                                  onChange={(e) =>
                                    selectAllInCategory(
                                      permissions,
                                      e.target.checked
                                    )
                                  }
                                  className="custom-checkbox"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </ShadowBoxContainer>
      </Col>
    </Row>
  );
};

export default PermissionsManagement;





// import React, { useState, useEffect } from "react";
// import {
//   Typography,
//   Row,
//   Col,
//   Button,
//   Tag,
//   notification,
//   Form,
//   Input,
//   Checkbox,
//   Collapse,
//   Spin,
//   Card,
//   Divider,
//   Switch,
// } from "antd";
// import {
//   TeamOutlined,
//   SaveOutlined,
//   RollbackOutlined,
//   LockOutlined,
//   CheckSquareOutlined,
// } from "@ant-design/icons";
// import { useParams, useNavigate, Link } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import ShadowBoxContainer from "../../../components/AuthLayout/ShadowBoxContainer";
// import {
//   addRoleAction,
//   fetchPermissions,
//   fetchRoleDetails,
//   updateRoleData,
// } from "../../../services/Store/Permission/action";

// const { Text, Title } = Typography;
// const { Panel } = Collapse;

// const PermissionsManagement = () => {
//   const { roleId } = useParams();
//   const navigate = useNavigate();
//   const dispatch = useDispatch();
//   const [form] = Form.useForm();

//   const [loading, setLoading] = useState(true);
//   const [role, setRole] = useState(null);
//   const [permissionsData, setPermissionsData] = useState([]);
//   const [selectedPermissions, setSelectedPermissions] = useState({});
//   const isEditMode = !!roleId;

//   // Get permissions from Redux store
//   const {
//     permissions,
//     permissionsLoading,
//     permissionsError,
//     roleDetails,
//     roleDetailsLoading,
//   } = useSelector((state) => state?.permissions);

//   // Get role creation loading state from Redux store
//   const { createRoleLoading } = useSelector((state) => state?.permissions);

//   // Reset component state when roleId changes
//   useEffect(() => {
//     // Clear previous role data when navigating to different role
//     setRole(null);
//     setSelectedPermissions({});
//     form.resetFields();
//     setLoading(true);

//     // Fetch new data
//     dispatch(fetchPermissions());
//     if (isEditMode) {
//       dispatch(fetchRoleDetails(roleId));
//     } else {
//       setLoading(false);
//     }

//     // Cleanup function to reset state when component unmounts or roleId changes
//     return () => {
//       setRole(null);
//       setSelectedPermissions({});
//       form.resetFields();
//     };
//   }, [dispatch, isEditMode, roleId, form]);

//   // Update role and permissions when role details are fetched
//   useEffect(() => {
//     if (isEditMode && roleDetails?.data) {
//       // Set role data
//       if (roleDetails?.data?.role) {
//         setRole(roleDetails?.data?.role);
//         form.setFieldsValue({ full_name: roleDetails?.data?.role?.full_name });
//         form.setFieldsValue({ status: roleDetails?.data?.role?.status });
//       }

//       // Set selected permissions
//       if (
//         roleDetails?.data?.permissions &&
//         Array.isArray(roleDetails?.data?.permissions)
//       ) {
//         const permissionsObj = {};
//         roleDetails?.data?.permissions.forEach((item) => {
//           permissionsObj[item.permission_id] = true;
//         });
//         setSelectedPermissions(permissionsObj);
//       }

//       setLoading(false);
//     }
//   }, [roleDetails, isEditMode, form]);

//   // Update permissions data when Redux store is updated
//   useEffect(() => {
//     if (permissions?.data) {
//       setPermissionsData(permissions?.data);
//       if (!isEditMode) {
//         setLoading(false);
//       }
//     }
//   }, [permissions, isEditMode]);

//   // Handle permission changes
//   const handlePermissionChange = (permissionId, checked) => {
//     setSelectedPermissions((prev) => ({
//       ...prev,
//       [permissionId]: checked,
//     }));
//   };

//   // Select all permissions in a category
//   const selectAllInCategory = (categoryPermissions, checked) => {
//     const updatedPermissions = { ...selectedPermissions };

//     categoryPermissions.forEach((permission) => {
//       updatedPermissions[permission?.id] = checked;
//     });

//     setSelectedPermissions(updatedPermissions);
//   };

//   // Select ALL permissions across ALL categories
//   const selectAllPermissions = (checked) => {
//     const allPermissions = {};

//     permissionsData.forEach((categoryObj) => {
//       const categoryName = Object.keys(categoryObj)[0];
//       const permissions = categoryObj[categoryName];

//       permissions.forEach((permission) => {
//         allPermissions[permission?.id] = checked;
//       });
//     });

//     setSelectedPermissions(allPermissions);
//   };

//   // Check if all permissions in a category are selected
//   const areAllSelected = (categoryPermissions) => {
//     return categoryPermissions?.every(
//       (permission) => selectedPermissions[permission?.id]
//     );
//   };

//   // Check if some permissions in a category are selected
//   const areSomeSelected = (categoryPermissions) => {
//     return (
//       categoryPermissions?.some(
//         (permission) => selectedPermissions[permission?.id]
//       ) && !areAllSelected(categoryPermissions)
//     );
//   };

//   // Check if ALL permissions across ALL categories are selected
//   const areAllPermissionsSelected = () => {
//     let allPermissionIds = [];

//     permissionsData.forEach((categoryObj) => {
//       const categoryName = Object.keys(categoryObj)[0];
//       const permissions = categoryObj[categoryName];

//       permissions.forEach((permission) => {
//         allPermissionIds.push(permission?.id);
//       });
//     });

//     return (
//       allPermissionIds.length > 0 &&
//       allPermissionIds.every((id) => selectedPermissions[id])
//     );
//   };

//   // Save role and permissions
//   const handleSave = async (values) => {
//     try {
//       const selectedPermissionIds = Object.keys(selectedPermissions)
//         .filter((key) => selectedPermissions[key])
//         .map((key) => parseInt(key));

//       // Prepare data to send
//       let dataToSend;

//       if (isEditMode) {
//         if (areAllPermissionsSelected()) {
//           dataToSend = {
//             id: roleId,
//             full_name: values?.full_name,
//             status: values?.status,
//             all_permissions: true,
//           };
//         } else {
//           dataToSend = {
//             id: roleId,
//             full_name: values?.full_name,
//             status: values?.status,
//             permissions: selectedPermissionIds,
//           };
//         }
//       } else {
//         if (areAllPermissionsSelected()) {
//           dataToSend = {
//             full_name: values?.full_name,
//             name: values?.full_name,
//             status: values?.status,
//             all_permissions: true,
//           };
//         } else {
//           dataToSend = {
//             full_name: values?.full_name,
//             name: values?.full_name,
//             status: values?.status,
//             permissions: selectedPermissionIds,
//           };
//         }
//       }

//       if (isEditMode) {
//         // Set local loading for edit mode
//         // setLoading(true);
//         // Update existing role - this would be your actual API call
//         // Example: await axios.put(`/api/roles/${roleId}`, dataToSend);
//         dispatch(updateRoleData(dataToSend))
//           .unwrap()
//           .then((res) => {
//             if (res?.meta?.status === 200) {
//               notification.success({
//                 message: "Success",
//                 description: `Role "${values?.full_name}" updated successfully!`,
//                 duration: 3,
//               });
//               navigate("/admin/roles");
//             }
//           })
//           .catch((error) => {
//             console.error("Error creating role:", error);
//             notification.error({
//               message: "Error",
//               description:
//                 error?.meta?.message ||
//                 "Failed to create role. Please try again.",
//               placement: "topRight",
//             });
//           });

//         // notification.success({
//         //   message: "Success",
//         //   description: `Role "${values?.name}" updated successfully!`,
//         //   placement: "topRight",
//         //   style: {
//         //     borderLeft: "4px solid #FF6D00",
//         //   },
//         // });
//         // setLoading(false);
//       } else {
//         // Create new role using Redux action
//         dispatch(addRoleAction(dataToSend))
//           .unwrap()
//           .then((res) => {
//             if (res?.meta?.status === 200) {
//               notification.success({
//                 message: "Success",
//                 description: `Role "${values?.full_name}" created successfully!`,
//                 duration: 3,
//               });
//               navigate("/admin/roles");
//             }
//           })
//           .catch((error) => {
//             console.error("Error creating role:", error);
//             notification.error({
//               message: "Error",
//               description:
//                 error?.meta?.message ||
//                 "Failed to create role. Please try again.",
//               placement: "topRight",
//             });
//           });
//       }
//     } catch (error) {
//       console.error("Error saving role:", error);
//       notification.error({
//         message: "Error",
//         description: `Failed to ${isEditMode ? "update" : "create"
//           } role. Please try again.`,
//         placement: "topRight",
//       });
//       if (isEditMode) {
//         setLoading(false);
//       }
//     }
//   };

//   // Determine if we're loading based on local state, Redux permissions loading, role details loading, or role creation loading
//   const isLoading =
//     loading ||
//     permissionsLoading ||
//     roleDetailsLoading ||
//     (createRoleLoading ?? false);

//   // Show skeleton/loading view while data is being fetched
//   const renderLoadingView = () => (
//     <div className=" h-full loadingClass">
//       <Spin size="large" />
//     </div>
//   );

//   return (
//     <Row className="bg-darkGray px-header-wrapper h-full w-full flex flex-col gap-3 sm:gap-6">
//       <div className="w-full"></div>

//       <Col
//         span={24}
//         className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0"
//       >
//         <div className="flex justify-center items-center">
//           <Title
//             level={3}
//             className="text-white !m-0 h-auto flex flex-wrap sm:flex-nowrap justify-center items-center text-base sm:text-lg md:text-xl"
//           >
//             <Link
//               to="/admin"
//               className="text-primary hover:text-primary flex justify-center"
//             >
//               <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
//                 Dashboard
//               </Text>
//             </Link>
//             <Text className="text-grayText mx-2"> <i className="icon-right-arrow"/> </Text>
//             <Link
//               to="/admin/roles"
//               className="text-primary hover:text-primary flex justify-center"
//             >
//               <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
//                 Roles & Permissions
//               </Text>
//             </Link>
//             <Text className="text-grayText mx-2"><i className="icon-right-arrow"/> </Text>
//             <Text className="text-white text-lg sm:text-2xl">
//               {isEditMode
//                 ? `Edit ${role?.full_name || "Role"}`
//                 : "Create New Role"}
//             </Text>
//           </Title>
//         </div>
//         <div className="flex gap-2">
//           <Button
//             size="large"
//             icon={<RollbackOutlined />}
//             onClick={() => navigate("/admin/roles")}
//             className="rounded-3xl"
//           >
//             Back
//           </Button>
//           <Button
//             type="primary"
//             size="large"
//             icon={<SaveOutlined />}
//             onClick={() => form.submit()}
//             loading={isLoading}
//             className="rounded-3xl"
//             disabled={isLoading}
//           >
//             {isEditMode ? "Save Changes" : "Create Role"}
//           </Button>
//         </div>
//       </Col>

//       <Col span={24} className="h-full">
//         <ShadowBoxContainer height="calc(100vh - 241px)">
//           {isLoading ? (
//             renderLoadingView()
//           ) : (
//             <div className="h-full overflow-auto p-4">
//               <Row gutter={[24, 24]}>
//                 {/* Role Details Section */}
//                 <Col span={24}>
//                   <Card className="bg-[#242424] border-0 shadow-md">
//                     <div className="mb-6 flex items-center">
//                       <TeamOutlined className="text-primary text-3xl mr-4" />
//                       <Title level={4} className="text-white m-0">
//                         Role Details
//                       </Title>
//                     </div>

//                     <Form
//                       form={form}
//                       layout="vertical"
//                       onFinish={handleSave}
//                       className="role-form"
//                       requiredMark={false}
//                     >
//                       <Row gutter={16}>
//                         <Col xs={24} md={24}>
//                           <Form.Item
//                             name="full_name"
//                             label={
//                               <Text className="text-white">Role Name</Text>
//                             }
//                             rules={[
//                               {
//                                 required: true,
//                                 message: "Please enter a role name",
//                               },
//                               {
//                                 whitespace: true,
//                                 message: "Role Name Cannot Contain Only Whitespace",
//                               },
//                               {
//                                 min: 2,
//                                 message: "Role Name Must Be At Least 2 Characters!",
//                               },
//                               {
//                                 max: 150,
//                                 message: "Role Name Cannot Exceed 150 Characters!",
//                               },
//                             ]}
//                           >
//                             <Input size="large" placeholder="Enter Role Name" />
//                           </Form.Item>
//                         </Col>
//                         <Col xs={24} md={24}>
//                           <Form.Item
//                             name="status"
//                             label={<Text className="text-white">Status</Text>}
//                           // rules={[
//                           //   { required: true, message: "Please enter a role name" },
//                           //   { max: 50, message: "Role name cannot exceed 50 characters" }
//                           // ]}
//                           >
//                             <Switch defaultChecked />
//                           </Form.Item>
//                         </Col>
//                       </Row>
//                     </Form>
//                   </Card>
//                 </Col>

//                 {/* Permissions Section */}
//                 <Col span={24}>
//                   <Card
//                     className="bg-[#242424] border-0 shadow-md"
//                     title={
//                       <div className="flex items-center">
//                         <LockOutlined className="text-primary text-xl mr-2" />
//                         <Text className="text-white text-lg">
//                           Role Permissions
//                         </Text>
//                       </div>
//                     }
//                     extra={
//                       <Button
//                         type="primary"
//                         icon={<CheckSquareOutlined />}
//                         onClick={() =>
//                           selectAllPermissions(!areAllPermissionsSelected())
//                         }
//                         className="rounded-3xl"
//                       >
//                         {areAllPermissionsSelected()
//                           ? "Deselect All"
//                           : "Select All Permissions"}
//                       </Button>
//                     }
//                   >
//                     <Text className="text-grayText block mb-6">
//                       Select the permissions you want to assign to this role.
//                       These permissions will determine what users with this role
//                       can access and modify in the system.
//                     </Text>

//                     {permissionsData?.length > 0 && (
//                       <div className="permissions-wrapper">
//                         <Collapse
//                           defaultActiveKey={permissionsData?.map((_, index) =>
//                             index.toString()
//                           )}
//                           className="permissions-collapse bg-darkGray border-0"
//                         >
//                           {permissionsData.map((categoryObj, index) => {
//                             const categoryName = Object.keys(categoryObj)[0];
//                             const permissions = categoryObj[categoryName];

//                             return (
//                               <Panel
//                                 header={
//                                   <div className="flex justify-between items-center w-full pr-8">
//                                     <Text className="text-white font-medium">
//                                       {categoryName}
//                                     </Text>
//                                     <Checkbox
//                                       checked={areAllSelected(permissions)}
//                                       indeterminate={areSomeSelected(
//                                         permissions
//                                       )}
//                                       onChange={(e) =>
//                                         selectAllInCategory(
//                                           permissions,
//                                           e.target.checked
//                                         )
//                                       }
//                                       className="custom-checkbox"
//                                     />
//                                   </div>
//                                 }
//                                 key={index}
//                                 className="bg-[#242424] mb-2 rounded-md border-0"
//                               >
//                                 <Row gutter={[16, 16]}>
//                                   {permissions?.map((permission) => (
//                                     <Col
//                                       span={24}
//                                       md={12}
//                                       lg={6}
//                                       key={permission?.id}
//                                     >
//                                       <div className="flex items-center bg-darkGray p-3 rounded-md">
//                                         <Checkbox
//                                           checked={
//                                             !!selectedPermissions[
//                                             permission?.id
//                                             ]
//                                           }
//                                           onChange={(e) =>
//                                             handlePermissionChange(
//                                               permission?.id,
//                                               e.target.checked
//                                             )
//                                           }
//                                           className="custom-checkbox"
//                                         />
//                                         <div className="ml-2">
//                                           <Text className="text-white block capitalize">
//                                             {permission?.name}
//                                           </Text>
//                                           <Text className="text-grayText text-xs">
//                                             {permission?.slug}
//                                           </Text>
//                                         </div>
//                                       </div>
//                                     </Col>
//                                   ))}
//                                 </Row>
//                               </Panel>
//                             );
//                           })}
//                         </Collapse>
//                       </div>
//                     )}
//                   </Card>
//                 </Col>
//               </Row>
//             </div>
//           )}
//         </ShadowBoxContainer>
//       </Col>
//     </Row>
//   );
// };

// export default PermissionsManagement;
