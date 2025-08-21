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
  Divider,
  Spin,
  Empty,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import {
  createUserAction,
  fetchUserDetailById,
  fetchUserForEdit,
  updateUserAction,
} from "../../../services/Store/Users/action";
import { fetchAllRolesList } from "../../../services/Store/Permission/action";
import {
  formatPhoneNumberWithOne,
  normalizeNMLSNumber,
  normalizePhoneNumber,
  trimPhoneNumber,
  validatePhoneNumber,
} from "../../../utils/commonfunction";
import USFlag from "../../../assets/SVGs/US-Flag.svg";
import Loading from "../../../components/AuthLayout/Loading";
import ContractAgreementEdit from "../../../components/AuthLayout/ContractAgreementEdit";
import ShadowBoxContainer from "../../../components/AuthLayout/ShadowBoxContainer";
import { IMAGE_BASE_URL } from "../../../utils/constant";

const { Text, Title } = Typography;
const { Option } = Select;

// USA states for dropdown
const usaStates = [
  { value: "All State", label: "All State" },
  { value: "Alabama", label: "Alabama" },
  { value: "Alaska", label: "Alaska" },
  { value: "Arizona", label: "Arizona" },
  { value: "Arkansas", label: "Arkansas" },
  { value: "California", label: "California" },
  { value: "Colorado", label: "Colorado" },
  { value: "Connecticut", label: "Connecticut" },
  { value: "Delaware", label: "Delaware" },
  { value: "Florida", label: "Florida" },
  { value: "Georgia", label: "Georgia" },
  { value: "Hawaii", label: "Hawaii" },
  { value: "Idaho", label: "Idaho" },
  { value: "Illinois", label: "Illinois" },
  { value: "Indiana", label: "Indiana" },
  { value: "Iowa", label: "Iowa" },
  { value: "Kansas", label: "Kansas" },
  { value: "Kentucky", label: "Kentucky" },
  { value: "Louisiana", label: "Louisiana" },
  { value: "Maine", label: "Maine" },
  { value: "Maryland", label: "Maryland" },
  { value: "Massachusetts", label: "Massachusetts" },
  { value: "Michigan", label: "Michigan" },
  { value: "Minnesota", label: "Minnesota" },
  { value: "Mississippi", label: "Mississippi" },
  { value: "Missouri", label: "Missouri" },
  { value: "Montana", label: "Montana" },
  { value: "Nebraska", label: "Nebraska" },
  { value: "Nevada", label: "Nevada" },
  { value: "New Hampshire", label: "New Hampshire" },
  { value: "New Jersey", label: "New Jersey" },
  { value: "New Mexico", label: "New Mexico" },
  { value: "New York", label: "New York" },
  { value: "North Carolina", label: "North Carolina" },
  { value: "North Dakota", label: "North Dakota" },
  { value: "Ohio", label: "Ohio" },
  { value: "Oklahoma", label: "Oklahoma" },
  { value: "Oregon", label: "Oregon" },
  { value: "Pennsylvania", label: "Pennsylvania" },
  { value: "Rhode Island", label: "Rhode Island" },
  { value: "South Carolina", label: "South Carolina" },
  { value: "South Dakota", label: "South Dakota" },
  { value: "Tennessee", label: "Tennessee" },
  { value: "Texas", label: "Texas" },
  { value: "Utah", label: "Utah" },
  { value: "Vermont", label: "Vermont" },
  { value: "Virginia", label: "Virginia" },
  { value: "Washington", label: "Washington" },
  { value: "West Virginia", label: "West Virginia" },
  { value: "Wisconsin", label: "Wisconsin" },
  { value: "Wyoming", label: "Wyoming" },
  { value: "District of Columbia", label: "District of Columbia" },
];

const UserManagementForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useParams(); // Get userId from URL if editing
  const [form] = Form.useForm();

  // Check if we're in admin mode based on current path
  const isAdminMode = location.pathname.includes("/admin/");

  const [selectedRoles, setSelectedRoles] = useState([]);
  const [initialValues, setInitialValues] = useState();
  const [contractAgreementData, setContractAgreementData] = useState("");
  const [passwordFields, setPasswordFields] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);
  const [selectedContract, setSelectedContract] = useState("1");
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");

  // Track the original contract data received from server
  const [originalContractData, setOriginalContractData] = useState("");
  const [hasContractAgreementSign, setHasContractAgreementSign] =
    useState(false);
  const [showContractAgreement, setShowContractAgreement] = useState(false);

  // Get loading states from Redux store
  const { createUserLoading, updateUserLoading } = useSelector(
    (state) => state?.usersmanagement || {}
  );
  const { allRoles, allRolesLoading } = useSelector(
    (state) => state?.permissions || {}
  );

  console.log('selectedRoles', selectedRoles)

  // Determine if we're in editing mode
  const isEditing = !!userId;

  // Determine if we're in loading state based on the operation
  const isLoading = isEditing ? updateUserLoading : createUserLoading;

  // Helper functions for dynamic navigation
  const getDashboardLink = () => {
    return isAdminMode ? "/admin" : "/dashboard";
  };

  const getUserManagementLink = () => {
    return isAdminMode ? "/admin/user-management" : "/user-management";
  };

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
  // Convert API roles to options format for Select component
  const roleOptions = allRoles?.data?.roles
    ? allRoles.data.roles.map((role) => ({
      label: role.full_name || role.name,
      value: role.name,
    }))
    : [];

  // Check if selected roles include "LO"
  const checkForLORole = (roles) => {
    if (!roles || !Array.isArray(roles)) return false;

    return roles?.some((role) => {
      // Check if role is a string or an object
      const roleName = typeof role === "object" ? role.name : role;
      return roleName.includes("LO");
    });
  };

  // Check if selected roles include "AE" or "CP"
  const checkForAEorCPRole = (roles) => {
    if (!roles || !Array.isArray(roles)) return false;

    return roles?.some((role) => {
      // Check if role is a string or an object
      const roleName = typeof role === "object" ? role.name : role;
      return roleName.includes("AE") || roleName.includes("CP") || roleName.includes("REA");
    });
  };

  // Fetch user data for editing
  useEffect(() => {
    if (isEditing) {
      dispatch(fetchUserDetailById(userId)).then((res) => {
        if (res?.payload?.meta?.status === 200) {
          const userData = res?.payload?.data?.user;
          setInitialValues(userData);
          setSelectedContract(
            res?.payload?.data?.user?.user_detail?.contract_agreement_type ||
            "1"
          );
          // Check if user has any role that includes "LO"
          if (userData.roles && checkForLORole(userData.roles)) {
            setShowContractAgreement(true);
          } else {
            setShowContractAgreement(false);
          }

          // Check if user has any role that includes "AE" or "CP"
          if (userData.roles && checkForAEorCPRole(userData.roles)) {
            setShowAdditionalFields(true);
          } else {
            setShowAdditionalFields(false);
          }

          // Check if user has contract_agreement_sign
          if (userData?.user_detail?.contract_agreement_sign) {
            setHasContractAgreementSign(true);
          } else {
            setHasContractAgreementSign(false);
          }

          // Initialize password fields state from the response
          if (userData?.passwords?.length > 0) {
            const passwordData = {};
            userData?.passwords?.forEach((pwd) => {
              passwordData[pwd.id] = {
                user_name: pwd.user_name || "",
                password: pwd.password || "",
              };
            });
            setPasswordFields(passwordData);
          }

          // Initialize contract agreement data
          if (userData?.user_detail?.contract_template_text) {
            const templateText = userData?.user_detail?.contract_template_text;
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
      setHasContractAgreementSign(false);
      setShowContractAgreement(false);
      setShowAdditionalFields(false);

      // Reset form for new users
      form.resetFields();
      form.setFieldsValue({
        is_active: true,
      });
    }
  }, [dispatch, isEditing, userId, form]);

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

        // Check if we need to show additional fields based on the roles
        setShowAdditionalFields(checkForAEorCPRole(formattedValues.roles));
      }

      // Extract AE/CP specific fields from user_detail if they exist
      if (initialValues.user_detail) {
        formattedValues.experience = initialValues.user_detail.experience || "";
        // formattedValues.state = initialValues.user_detail.state || undefined;
        formattedValues.service_name =
          initialValues.user_detail.service_name || "";
        formattedValues.description =
          initialValues.user_detail.description || "";
        formattedValues.state =
          initialValues.user_detail.state || "";
      }

      // Remove passwords from formattedValues as we'll handle them separately
      delete formattedValues.passwords;

      form.setFieldsValue(formattedValues);
    }
  }, [initialValues, form]);

  // Update selectedRoles when form values change
  useEffect(() => {
    const roles = form.getFieldValue("roles") || [];
    setSelectedRoles(roles);

    // Check if selected roles include "LO"
    setShowContractAgreement(checkForLORole(roles));

    // Check if selected roles include "AE" or "CP"
    setShowAdditionalFields(checkForAEorCPRole(roles));
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

  // Handle contract agreement data change
  const handleContractDataChange = (data) => {
    if (data) {
      // Always update the contract data state
      setContractAgreementData(data);
    }
  };

  const handleChangeContract = (value) => {
    setSelectedContract(value);
  };

  // Handle form submission
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
      contract_agreement_type: selectedContract,
      ...(values.profile_photo ? { profile_photo: values.profile_photo } : {}),
    };

    // Add AE/CP specific fields if they're visible
    if (showAdditionalFields) {
      formattedPayload.user_detail = {
        ...(isEditing && initialValues?.user_detail
          ? initialValues.user_detail
          : {}),
        experience: values.experience,
        state: values.state,
        service_name: values.service_name,
        description: values.description,
      };
    }

    // Only include pdf_text if showing contract agreement and user doesn't have a contract_agreement_sign or we're creating a new user
    if (showContractAgreement && (!hasContractAgreementSign || !isEditing)) {
      formattedPayload.pdf_text = contractAgreementData;
    } else {
      formattedPayload.pdf_text = null;
    }

    // Add passwords to payload if editing and passwords exist
    if (isEditing && initialValues?.passwords) {
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

    if (isEditing) {
      // Update existing user
      dispatch(
        updateUserAction({
          userId: userId,
          userData: {
            id: userId,
            ...formattedPayload,
          },
        })
      )
        .then((result) => {
          if (result.payload?.meta?.success) {
            // Navigate back to user list on success
            navigate(getUserManagementLink());
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
    } else {
      // Create new user
      dispatch(createUserAction(formattedPayload))
        .then((result) => {
          if (result.payload?.meta?.success) {
            // Navigate back to user list on success
            navigate(getUserManagementLink());
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
    // console.log("value", values);
    // Check if selected roles include "LO"
    setShowContractAgreement(checkForLORole(values));

    // Check if selected roles include "AE" or "CP"
    setShowAdditionalFields(checkForAEorCPRole(values));

    // If default role is not in the selected roles, set it to the first role
    const currentDefault = form.getFieldValue("default_role");
    if (!values.includes(currentDefault) && values.length > 0) {
      form.setFieldsValue({ default_role: values[0] });
    } else if (values.length === 0) {
      form.setFieldsValue({ default_role: undefined });
    }
  };

  // Handle cancel - navigate back to users list
  const handleCancel = () => {
    navigate(getUserManagementLink());
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
    if (!showContractAgreement) return null;

    return (
      <div className="mb-6">
        <Divider orientation="left">
          <Text className="text-grayText">Contract Agreement</Text>
        </Divider>
        {!initialValues?.user_detail?.contract_agreement_sign ? (
          <Select
            defaultValue="1"
            onChange={handleChangeContract}
            options={[
              { value: "1", label: "1099 Version_Loan Originator Engagment Agreement" },
              { value: "2", label: "W2 Version_Loan Originator Engagment Agreement" },
              { value: "3", label: "SHL - W2 Version_Loan Originator Engagment Agreement" },
              { value: "4", label: "SHL - 1099 Version_Loan Originator Engagment Agreement" },
              
            ]}
            className="mb-5 w-full"
            value={selectedContract}
          />
        ) : null}

        <div
          className={`contract-agreement-wrapper ${isMobile ? " " : ""
            }`}
        >
          <ContractAgreementEdit
            FacilityName={"Facility Name"}
            InspectionCompleteDate={"01/01/2025"}
            InspectionEventType={"Standard"}
            Employee={"Employee Name"}
            persentage={"80%"}
            selectedContract={selectedContract}
            onChange={handleContractDataChange}
            contractAgreementSign={
              initialValues?.user_detail?.contract_agreement_sign
            }
            contractTemplatePath={
              initialValues?.user_detail?.contract_agreement_sign
                ? `${import.meta.env.VITE_IMAGE_BASE_URL}/${initialValues?.user_detail?.contract_agreement_sign
                }`
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
            <Link
              to={getUserManagementLink()}
              className="text-primary hover:text-primary flex justify-center"
            >
              <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
                User Management
              </Text>
            </Link>
            <Text className="text-grayText mx-2">
              {" "}
              <i className="icon-right-arrow" />{" "}
            </Text>
            <Text className="text-white text-lg sm:text-2xl">
              {isEditing ? "Edit User" : "Create User"}
            </Text>
          </Title>
        </div>
      </Col>

      <Col span={24} className="h-full mb-4">
        <ShadowBoxContainer height={containerHeight}>
          {!isEditing || initialValues ? (
            <div className="h-full p-4">
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
                <Row gutter={[24, 0]} className="wrapperFormContent">
                  {/* Form content - Full width on mobile, two columns on desktop */}
                  <Col
                    xs={24}
                    lg={showContractAgreement ? 14 : 24}
                    className={isMobile ? "" : "pr-4"}
                  >
                    <Row gutter={[24, 16]} className="flex flex-wrap">
                      <Col span={24}>
                        <Divider orientation="left">
                          <Text className="text-grayText">
                            Basic Information
                          </Text>
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
                              message:
                                "Role Name Cannot Contain Only Whitespace!",
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
                          <Input placeholder="Enter Email" autoComplete="off" />
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
                          <Input placeholder="Enter NMLS" autoComplete="off" />
                        </Form.Item>
                      </Col>

                      <Col span={24}>
                        <Divider orientation="left">
                          <Text className="text-grayText">
                            Role Information
                          </Text>
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
                                const { label, value, closable, onClose } =
                                  props;
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

                      {/* Additional Fields for AE or CP roles */}
                      {(selectedRoles?.includes("CP") || selectedRoles?.includes("AE") || selectedRoles?.includes("REA")) && (
                        <>
                          <Col span={24}>
                            <Divider orientation="left">
                              <Text className="text-grayText">
                                Additional Information
                              </Text>
                            </Divider>
                          </Col>

                          <Col xs={24} md={12}>
                            <Form.Item
                              label={<Text type="secondary">Experience</Text>}
                              name="experience"
                              rules={[
                                {
                                  required: true,
                                  message: "Please enter your experience!",
                                },
                              ]}
                            >
                              <Input
                                placeholder="Enter Experience"
                                autoComplete="off"
                                type="number"
                              />
                            </Form.Item>
                          </Col>

                          {
                            selectedRoles?.includes("CP") ? <Col xs={24} md={12}>
                              <Form.Item
                                label={<Text type="secondary">State</Text>}
                                name="state"
                                rules={[
                                  {
                                    required: true,
                                    message: "Please select a state!",
                                  },
                                ]}
                              >
                                <Select
                                  placeholder="Select State"
                                  className="w-full"
                                  options={usaStates}
                                  showSearch
                                  optionFilterProp="children"
                                  filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                  }
                                />
                              </Form.Item>
                            </Col>
                              : null
                          }


                          <Col xs={24} md={12}>
                            <Form.Item
                              label={<Text type="secondary">Company Name</Text>}
                              name="service_name"
                              rules={[
                                {
                                  required: true,
                                  message: "Please enter the company name!",
                                },
                                {
                                  max: 50,
                                  message:
                                    "Company name cannot Exceed 255 Characters",
                                },
                                {
                                  whitespace: true,
                                  message:
                                    "Company Name Cannot Contain Only Whitespace!",
                                },
                              ]}
                            >
                              <Input
                                placeholder="Enter Company Name"
                                autoComplete="off"
                                showCount
                                maxLength={50}
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={12}>
                            <Form.Item
                              label={<Text type="secondary">Description</Text>}
                              name="description"
                              rules={[
                                {
                                  required: true,
                                  message: "Please enter a description!",
                                },
                                {
                                  max: 1000,
                                  message:
                                    "Description cannot Exceed 1000 Characters",
                                },
                                {
                                  whitespace: true,
                                  message:
                                    "Description Cannot Contain Only Whitespace!",
                                },
                              ]}
                            >
                              <Input.TextArea
                                placeholder="Enter Description"
                                autoComplete="off"
                                rows={4}
                                maxLength={1000}
                                showCount
                              />
                            </Form.Item>
                          </Col>
                        </>
                      )}

                      {/* Password Information Section - Only show when editing and passwords exist */}
                      {isEditing &&
                        initialValues?.passwords?.length > 0 &&
                        checkForLORole(selectedRoles) && (
                          <>
                            <Col span={24}>
                              <Divider orientation="left">
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
                                      placeholder="Enter Username"
                                      autoComplete="off"
                                      value={
                                        passwordFields[passwordItem.id]
                                          ?.user_name || ""
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
                                      placeholder="Enter Password"
                                      autoComplete="new-password"
                                      value={
                                        passwordFields[passwordItem.id]
                                          ?.password || ""
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
                              <Text className="font-medium" type="secondary">Status</Text>
                            </div>
                          }
                          valuePropName="checked"
                        >
                          <Switch
                            checkedChildren="Active"
                            unCheckedChildren="Inactive"
                          // className="bg-gray"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    {/* Contract Agreement section moved inside form content column for mobile */}
                    {isMobile && showContractAgreement && (
                      <Row>
                        <Col xs={24} className="mt-6">
                          {renderContractAgreement()}
                        </Col>
                      </Row>
                    )}
                  </Col>

                  {/* Contract Agreement - Only show on desktop view in right column when role includes LO */}
                  {!isMobile && showContractAgreement && (
                    <Col
                      xs={24}
                      lg={10}
                      className="pl-4 border-l border-liteGray"
                    >
                      {renderContractAgreement()}
                    </Col>
                  )}
                </Row>

                <div className=" mt-6 py-4 border-t border-liteGray">
                  <Row>
                    <Col span={24}>
                      <div className="flex flex-col sm:flex-row justify-end gap-4">
                        <Button
                          onClick={handleCancel}
                          className="rounded-lg w-full sm:w-auto order-2 sm:order-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={isLoading}
                          className="rounded-lg shadow-md w-full sm:w-auto order-1 sm:order-2 mb-3 sm:mb-0"
                        >
                          {isEditing ? "Update User" : "Create User"}
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
        </ShadowBoxContainer>
      </Col>
    </Row>
  );
};

export default UserManagementForm;
