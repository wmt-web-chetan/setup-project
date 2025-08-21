// Simple targeted fix for UserManagementModal.jsx
// Focus only on the critical parts that need to be fixed

import React, { useState, useEffect } from "react";
import {
  Typography,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Row,
  Col,
  Tag,
  Modal,
  Divider,
  Spin,
  Empty,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  createUserAction,
  fetchUserForEdit,
  updateUserAction,
} from "../../../../services/Store/Users/action";
import { fetchAllRolesList } from "../../../../services/Store/Permission/action";
import {
  formatPhoneNumberWithOne,
  normalizeNMLSNumber,
  normalizePhoneNumber,
  trimPhoneNumber,
  validatePhoneNumber,
} from "../../../../utils/commonfunction";
import USFlag from "../../../../assets/SVGs/US-Flag.svg";
import Loading from "../../../../components/AuthLayout/Loading";
import ContractAgreementEdit from "../../../../components/AuthLayout/ContractAgreementEdit";
import { IMAGE_BASE_URL } from "../../../../utils/constant";

const { Text, Title } = Typography;
const { Option } = Select;

const UserManagementModal = ({ visible, onClose, onFinish, editingUser }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [initialValues, setInitialValues] = useState();
  const [contractAgreementData, setContractAgreementData] = useState("");
  const [passwordFields, setPasswordFields] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Track the original contract data received from server
  const [originalContractData, setOriginalContractData] = useState("");

  // Get loading states from Redux store
  const { createUserLoading, updateUserLoading } = useSelector(
    (state) => state?.users || {}
  );
  const { allRoles, allRolesLoading } = useSelector(
    (state) => state?.permissions || {}
  );

  // Determine if we're in loading state based on the operation
  const isLoading = editingUser ? updateUserLoading : createUserLoading;

  // Debug logging for contract data changes
  useEffect(() => {
    if (contractAgreementData) {
      // console.log(
      //   "Contract data updated:",
      //   contractAgreementData.substring(0, 30) + "..."
      // );
    }
  }, [contractAgreementData]);

  // Handle window resize for responsive view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch all roles on component mount
  useEffect(() => {
    dispatch(fetchAllRolesList());
  }, [dispatch]);

  // Convert API roles to options format for Select component
  const roleOptions = allRoles?.data?.roles
    ? allRoles.data.roles.map((role) => ({
        label: role.full_name || role.name,
        value: role.name,
      }))
    : [];

  // Fetch user data for editing
  useEffect(() => {
    if (editingUser?.id) {
      dispatch(fetchUserForEdit(editingUser?.id)).then((res) => {
        if (res?.payload?.meta?.status === 200) {
          setInitialValues(res?.payload?.data?.user);

          // Initialize password fields state from the response
          if (res?.payload?.data?.user?.passwords?.length > 0) {
            const passwordData = {};
            res.payload.data.user.passwords.forEach((pwd) => {
              passwordData[pwd.id] = {
                user_name: pwd.user_name || "",
                password: pwd.password || "",
              };
            });
            setPasswordFields(passwordData);
          }

          // Initialize contract agreement data
          if (res?.payload?.data?.user?.user_detail?.contract_template_text) {
            const templateText =
              res?.payload?.data?.user?.user_detail?.contract_template_text;
            // console.log("Setting initial contract data from API");
            setContractAgreementData(templateText);
            setOriginalContractData(templateText);
          } else {
            setContractAgreementData("");
            setOriginalContractData("");
          }
        }
      });
    } else {
      // Reset all data for new users
      setContractAgreementData("");
      setOriginalContractData("");
    }
  }, [dispatch, editingUser]);

  // Update form when initialValues change
  useEffect(() => {
    if (initialValues) {
      // Ensure that roles is properly formatted for the form
      const formattedValues = { ...initialValues };

      // If roles is an array of objects, extract the name property
      if (formattedValues.roles && Array.isArray(formattedValues.roles)) {
        // Extract role names for the roles field
        formattedValues.roles = formattedValues.roles.map((role) =>
          typeof role === "object" ? role.name : role
        );

        // Find the default role based on is_default flag
        const defaultRole = initialValues.roles.find(
          (role) => role.pivot?.is_default === 1
        );
        if (defaultRole) {
          formattedValues.default_role = defaultRole.name;
        }

        formattedValues.phone_number = trimPhoneNumber(
          formattedValues.phone_number
        );

        // Initialize selectedRoles state with the formatted roles
        setSelectedRoles(formattedValues.roles);
      }

      // Remove passwords from formattedValues as we'll handle them separately
      delete formattedValues.passwords;

      form.setFieldsValue(formattedValues);
    }
  }, [initialValues, form, visible]);

  // Update selectedRoles when form values change
  useEffect(() => {
    const roles = form.getFieldValue("roles") || [];
    setSelectedRoles(roles);
  }, [form]);

  // Handle password field changes
  const handlePasswordFieldChange = (id, field, value) => {
    setPasswordFields((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  // CRITICAL FIX: Handle contract agreement data change - Always update local state
  const handleContractDataChange = (data) => {
    // console.log("Contract data changed in editor");
    if (data) {
      // Always update the contract data state
      setContractAgreementData(data);
    }
  };

  // CRITICAL FIX: Handle form submission with reliable contract data
  const handleSubmit = (values) => {
    // Format the payload according to the required structure
    const formattedPayload = {
      name: values.name,
      email: values.email,
      phone_number: formatPhoneNumberWithOne(values.phone_number),
      nmls_number: values.nmls_number,
      roles: values.roles,
      default_role: values.default_role,
      is_active: values.is_active,
      ...(values.profile_photo ? { profile_photo: values.profile_photo } : {}),
    };

    // CRITICAL FIX: Always include pdf_text regardless of whether it changed
    formattedPayload.pdf_text = contractAgreementData;
    

    // Add passwords to payload if editing and passwords exist
    if (editingUser && initialValues?.passwords) {
      // Format passwords from our state
      const formattedPasswords = initialValues?.passwords?.map(
        (passwordItem) => {
          const passwordData = passwordFields[passwordItem.id] || {};
          return {
            id: passwordItem.id,
            user_name:
              passwordData.user_name === "" ? null : passwordData.user_name,
            password:
              passwordData.password === "" ? null : passwordData.password,
          };
        }
      );
      formattedPayload.passwords = formattedPasswords;
    }

    if (editingUser) {
      // Update existing user
      setTimeout(() => {
        dispatch(
          updateUserAction({
            userId: editingUser.id,
            userData: {
              id: editingUser.id,
              ...formattedPayload,
            },
          })
        )
          .then((result) => {
            if (result.payload?.meta?.success) {
              if (onFinish) {
                onFinish(values);
              }
            } else {
              const errorMessage =
                result.payload?.meta?.message ||
                "Failed to update user. Please try again.";
              console.error("Update user error:", errorMessage);
            }
          })
          .catch((error) => {
            console.error("Update user exception:", error);
          });
      }, 1500);
    } else {
      // Create new user
      dispatch(createUserAction(formattedPayload))
        .then((result) => {
          if (result.payload?.meta?.success) {
            if (onFinish) {
              onFinish(values);
            }
          } else {
            const errorMessage =
              result.payload?.meta?.message ||
              "Failed to create user. Please try again.";
            console.error("Create user error:", errorMessage);
          }
        })
        .catch((error) => {
          console.error("Create user exception:", error);
        });
    }
  };

  // Handle role selection change
  const handleRolesChange = (values) => {
    setSelectedRoles(values);

    // If default role is not in the selected roles, set it to the first role
    const currentDefault = form.getFieldValue("default_role");
    if (!values.includes(currentDefault) && values.length > 0) {
      form.setFieldsValue({ default_role: values[0] });
    } else if (values.length === 0) {
      form.setFieldsValue({ default_role: undefined });
    }
  };

  // Reset form when modal is closed
  const handleCancel = () => {
    form.resetFields();
    setSelectedRoles([]);
    setPasswordFields({});
    setContractAgreementData("");
    setOriginalContractData("");
    onClose();
  };

  // Generate options for default role dropdown based on selected roles
  const getDefaultRoleOptions = () => {
    return selectedRoles.map((role) => {
      const roleOption = roleOptions.find((option) => option.value === role);
      return {
        value: role,
        label: roleOption ? roleOption.label : role,
      };
    });
  };

  // Render contract agreement section
  const renderContractAgreement = () => {
    return (
      <div className="mb-6">
        <Divider orientation="left" className="my-2 md:my-4">
          <Text className="text-grayText">Contract Agreement</Text>
        </Divider>
        <div
          className={`contract-agreement-wrapper ${
            isMobile ? "max-h-96 " : ""
          }`}
        >
          <ContractAgreementEdit
            FacilityName={"Facility Name"}
            InspectionCompleteDate={"01/01/2025"}
            InspectionEventType={"Standard"}
            Employee={"Employee Name"}
            persentage={"80%"}
            onChange={handleContractDataChange}
            contractAgreementSign={
              initialValues?.user_detail?.contract_agreement_sign
            }
            contractTemplatePath={
              initialValues?.user_detail?.contract_agreement_sign
                ? `${IMAGE_BASE_URL}${initialValues?.user_detail?.contract_agreement_sign}`
                : ""
            }
            contractTemplateText={
              initialValues?.user_detail?.contract_template_text
            }
          />
        </div>
      </div>
    );
  };

  return (
    <Modal
      title={
        <Title level={4} className="m-0">
          {editingUser ? "Edit User" : "Create New User"}
        </Title>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={isMobile ? "95%" : 1700} // Responsive width
      destroyOnClose
      maskClosable={false}
      centered
      className="user-form-modal modalWrapperBox"
      closeIcon={
        <Button
          shape="circle"
          icon={<i className="icon-close before:!m-0 text-sm" />}
        />
      }
    >
      {/* Show form immediately for new users, or when initialValues is loaded for editing */}
      {!editingUser || initialValues ? (
        <div className="h-full">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={
              initialValues || {
                is_active: true,
              }
            }
            className="w-full"
            size="large"
            requiredMark={false}
          >
            {/* Rest of the form content remains the same */}
            {/* ... */}
            <Row
              gutter={[24, 0]}
              className="wrapperFormContent"
              style={{
                maxHeight: isMobile ? "70vh" : "60vh",
                overflow: "auto",
              }}
            >
              {/* Form content - Full width on mobile, left side on desktop */}
              <Col
                xs={24}
                lg={14}
                className={isMobile ? "" : "pr-4"}
                style={{ maxHeight: isMobile ? "auto" : "60vh" }}
              >
                <Row gutter={[24, 16]} className="flex flex-wrap">
                  <Col span={24}>
                    <Divider orientation="left" className="my-2 md:my-4">
                      <Text className="text-grayText">Basic Information</Text>
                    </Divider>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label={<Text type="secondary">Full Name</Text>}
                      name="name"
                      rules={[
                        {
                          required: true,
                          message: "Please enter your full name!",
                        },
                        {
                          whitespace: true,
                          message: "Role Name Cannot Contain Only Whitespace!",
                        },
                        {
                          min: 2,
                          message: "Name must be at least 2 characters!",
                        },
                        {
                          max: 150,
                          message: "Name cannot exceed 150 characters!",
                        },
                      ]}
                    >
                      <Input
                        size="large"
                        placeholder="Enter Full Name"
                        autoComplete="off"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label={<Text type="secondary">Email</Text>}
                      name="email"
                      rules={[
                        {
                          required: true,
                          message: "Please enter your email!",
                        },
                        {
                          type: "email",
                          message: "Please enter correct email!",
                        },
                      ]}
                    >
                      <Input
                        size="large"
                        placeholder="Enter Email"
                        autoComplete="off"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label={<Text type="secondary">Contact Number</Text>}
                      name="phone_number"
                      rules={[
                        {
                          validator: validatePhoneNumber,
                        },
                      ]}
                      normalize={normalizePhoneNumber}
                    >
                      <Input
                        size="large"
                        placeholder="215 456-7890"
                        autoComplete="tel"
                        maxLength={12}
                        prefix={
                          <div className="pr-3 border-r border-liteGray mr-3 flex items-center justify-center">
                            <img src={USFlag} alt="" className="mr-3" />
                            <Text>+1</Text>
                          </div>
                        }
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label={<Text type="secondary">NMLS Number</Text>}
                      name="nmls_number"
                      rules={[
                        {
                          required: true,
                          message: "Please enter your NMLS number!",
                        },
                      ]}
                      normalize={normalizeNMLSNumber}
                    >
                      <Input
                        size="large"
                        placeholder="Enter NMLS"
                        autoComplete="off"
                      />
                    </Form.Item>
                  </Col>

                  <Col span={24}>
                    <Divider orientation="left" className="my-2 md:my-4">
                      <Text className="text-grayText">Role Information</Text>
                    </Divider>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      name="roles"
                      label={
                        <div className="flex items-center">
                          <Text type="secondary">Assigned Roles</Text>
                        </div>
                      }
                      rules={[
                        {
                          required: true,
                          message: "Please select at least one role!",
                        },
                      ]}
                    >
                      {allRolesLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Spin size="small" />
                          <span className="ml-2">Loading roles...</span>
                        </div>
                      ) : (
                        <Select
                          mode="multiple"
                          size="large"
                          placeholder="Select Roles"
                          className="w-full rounded-lg"
                          options={roleOptions}
                          loading={allRolesLoading}
                          onChange={handleRolesChange}
                          notFoundContent={
                            <Empty
                              description="No Role Found"
                              imageStyle={{ height: "60px" }}
                            />
                          }
                          tagRender={(props) => {
                            const { label, value, closable, onClose } = props;
                            return (
                              <Tag
                                closable={closable}
                                onClose={onClose}
                                className="mr-1 mb-1 rounded-md bg-gray text-white border-0"
                              >
                                {label}
                              </Tag>
                            );
                          }}
                        />
                      )}
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      name="default_role"
                      label={
                        <div className="flex items-center">
                          <Text type="secondary">Default Role</Text>
                        </div>
                      }
                      rules={[
                        {
                          required: true,
                          message: "Please select a default role!",
                        },
                      ]}
                      dependencies={["roles"]}
                    >
                      <Select
                        placeholder="Select Default Role"
                        className="w-full"
                        optionLabelProp="label"
                        loading={allRolesLoading}
                        options={getDefaultRoleOptions()}
                        disabled={selectedRoles.length === 0}
                      />
                    </Form.Item>
                  </Col>

                  {/* Password Information Section - Only show when editing and passwords exist */}
                  {editingUser && initialValues?.passwords?.length > 0 && (
                    <>
                      <Col span={24}>
                        <Divider orientation="left" className="my-2 md:my-4">
                          <Text className="text-grayText">
                            Password Information
                          </Text>
                        </Divider>
                      </Col>

                      {initialValues?.passwords?.map((passwordItem) => (
                        <React.Fragment key={passwordItem.id}>
                          <Col xs={24} md={12}>
                            <Form.Item
                              label={
                                <Text type="secondary">
                                  {passwordItem.name} - Username
                                </Text>
                              }
                            >
                              <Input
                                size="large"
                                placeholder="Enter Username"
                                autoComplete="off"
                                value={
                                  passwordFields[passwordItem.id]?.user_name ||
                                  ""
                                }
                                onChange={(e) => {
                                  const noWhitespaceValue =
                                    e.target.value.replace(/\s/g, "");

                                  handlePasswordFieldChange(
                                    passwordItem.id,
                                    "user_name",
                                    noWhitespaceValue
                                  );
                                }}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item
                              label={
                                <Text type="secondary">
                                  {passwordItem.name} - Password
                                </Text>
                              }
                            >
                              <Input.Password
                                size="large"
                                placeholder="Enter Password"
                                autoComplete="new-password"
                                value={
                                  passwordFields[passwordItem.id]?.password ||
                                  ""
                                }
                                onChange={(e) => {
                                  const noWhitespaceValue =
                                    e.target.value.replace(/\s/g, "");
                                  handlePasswordFieldChange(
                                    passwordItem.id,
                                    "password",
                                    noWhitespaceValue
                                  );
                                }}
                              />
                            </Form.Item>
                          </Col>
                        </React.Fragment>
                      ))}
                    </>
                  )}

                  <Col xs={24}>
                    <Form.Item
                      name="is_active"
                      label={
                        <div className="flex items-center">
                          <Text className="font-medium">Status</Text>
                        </div>
                      }
                      valuePropName="checked"
                    >
                      <Switch
                        checkedChildren="Active"
                        unCheckedChildren="Inactive"
                        className="bg-gray"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {/* Contract Agreement section moved inside form content column for mobile */}
                {isMobile && (
                  <Row>
                    <Col xs={24} className="mt-6">
                      {renderContractAgreement()}
                    </Col>
                  </Row>
                )}
              </Col>

              {/* Contract Agreement - Only show on desktop view in right column */}
              {!isMobile && (
                <Col
                  xs={24}
                  lg={10}
                  className="pl-4 border-l border-liteGray"
                  style={{ maxHeight: "60vh" }}
                >
                  {renderContractAgreement()}
                </Col>
              )}
            </Row>

            <div className="wrapperFooter mt-6 pt-4 border-t border-liteGray">
              <Row>
                <Col span={24}>
                  <div className="flex flex-col sm:flex-row justify-end gap-4">
                    <Button
                      size="large"
                      onClick={handleCancel}
                      className="rounded-lg w-full sm:w-auto order-2 sm:order-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      size="large"
                      htmlType="submit"
                      loading={isLoading}
                      className="rounded-lg shadow-md w-full sm:w-auto order-1 sm:order-2 mb-3 sm:mb-0"
                    >
                      {editingUser ? "Update User" : "Create User"}
                    </Button>
                  </div>
                </Col>
              </Row>
            </div>
          </Form>
        </div>
      ) : (
        <Loading className="py-64" />
      )}
    </Modal>
  );
};

export default UserManagementModal;
