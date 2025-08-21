import React, { useState, useRef, useEffect } from "react";
import {
  Avatar,
  Button,
  Col,
  Form,
  Input,
  Row,
  Typography,
  message,
  Spin,
  notification,
  Select,
} from "antd";
import { EditOutlined, UserOutlined } from "@ant-design/icons";
import {
  normalizePhoneNumber,
  trimPhoneNumber,
  validatePhoneNumber,
  normalizeNMLSNumber,
  formatPhoneNumberWithOne,
  getStorage,
} from "../../../utils/commonfunction";
import USFlag from "../../../assets/SVGs/US-Flag.svg";
import { Alert } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  changePhoneNumberAction,
  updateProfileAction,
} from "../../../services/Store/Users/action";
import { resetUpdateProfileState } from "../../../services/Store/Users/slice";
import { fetchOTP, fetchResendOTP } from "../../../services/Store/Auth/action";
import ImageCropModal from "./ImageCropModal"; // Import the new component
import './Profile.scss';

const { Title, Text } = Typography;
const imageFullPath = import.meta.env.VITE_IMAGE_BASE_URL;

const Profile = ({ containerHeight }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();
  const { userForEdit, userForEditLoading, updateProfileLoading } = useSelector(
    (state) => state?.usersmanagement
  );
  const { otpLoading } = useSelector((state) => state?.auth);

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

  // Phone Number OTP related states
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState("");
  const [phoneNumberChanged, setPhoneNumberChanged] = useState(false);
  const [showPhoneOTPField, setShowPhoneOTPField] = useState(false);
  const [phoneOtpVerified, setPhoneOtpVerified] = useState(false);
  const [phoneOtpValue, setPhoneOtpValue] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);

  // Email OTP related states
  const [originalEmail, setOriginalEmail] = useState("");
  const [emailChanged, setEmailChanged] = useState(false);
  const [showEmailOTPField, setShowEmailOTPField] = useState(false);
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  const [emailOtpValue, setEmailOtpValue] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);

  // Image crop modal states
  const [showImageCropModal, setShowImageCropModal] = useState(false);
  const [croppedImageFile, setCroppedImageFile] = useState(null);
  const userLoginRole = getStorage("userLoginRole", true);

  console.log("userForEdit", userForEdit);

  // Helper function to consistently construct profile image URL
  const getProfileImageUrl = () => {
    if (userForEdit?.user?.profile_photo_path) {
      // Ensure there's exactly one slash between base URL and path
      const path = userForEdit?.user?.profile_photo_path?.startsWith("/")
        ? userForEdit?.user?.profile_photo_path
        : `/${userForEdit?.user?.profile_photo_path}`;
      return `${imageFullPath}${path}`;
    }
    return null; // Return null instead of default image URL
  };

  const [avatar, setAvatar] = useState(getProfileImageUrl());
  const [selectedFile, setSelectedFile] = useState(null);
  console.log(avatar, "avatar");
  console.log("userLoginRole", userLoginRole);

  // Update form fields when userForEdit changes
  useEffect(() => {
    if (userForEdit) {
      const phoneNumber =
        trimPhoneNumber(userForEdit?.user?.phone_number) || "";
      const email = userForEdit?.user?.email || "";
      form.setFieldsValue({
        role: userLoginRole?.full_name || "Loan Officer",
        fullName: userForEdit?.user?.name || "",
        email: email,
        phone_number: phoneNumber,
        nmls_number: userForEdit?.user?.nmls_number || "",
        experience: userForEdit?.user?.user_detail?.experience || "",
        state: userForEdit?.user?.user_detail?.state || "",
        service_name: userForEdit?.user?.user_detail?.service_name || "",
        description: userForEdit?.user?.user_detail?.description || "",
      });
      // Set original values for comparison
      setOriginalPhoneNumber(phoneNumber);
      setOriginalEmail(email);
      // Update avatar when userForEdit changes
      setAvatar(getProfileImageUrl());
    }
  }, [userForEdit, form]);

  // Handle phone number change
  const handlePhoneNumberChange = (e) => {
    const currentPhone = e.target.value;
    const isChanged = currentPhone !== originalPhoneNumber;

    setPhoneNumberChanged(isChanged);

    if (isChanged) {
      setShowPhoneOTPField(true);
      setPhoneOtpVerified(false);
      setPhoneOtpSent(false);
      setPhoneOtpValue("");
    } else {
      setShowPhoneOTPField(false);
      setPhoneOtpVerified(true);
      setPhoneOtpSent(false);
      setPhoneOtpValue("");
    }
  };

  // Handle email change
  const handleEmailChange = (e) => {
    const currentEmail = e.target.value;
    const isChanged = currentEmail !== originalEmail;

    setEmailChanged(isChanged);

    if (isChanged) {
      setShowEmailOTPField(true);
      setEmailOtpVerified(false);
      setEmailOtpSent(false);
      setEmailOtpValue("");
    } else {
      setShowEmailOTPField(false);
      setEmailOtpVerified(true);
      setEmailOtpSent(false);
      setEmailOtpValue("");
    }
  };

  // Send OTP for phone verification
  const sendPhoneOTP = async () => {
    try {
      const phoneNumber = form.getFieldValue("phone_number");
      if (!phoneNumber) {
        message.error("Please enter a valid phone number");
        return;
      }

      const response = await dispatch(
        changePhoneNumberAction({
          new_phone_number: formatPhoneNumberWithOne(phoneNumber),
          type: "MO",
        })
      ).unwrap();

      if (response?.meta?.status === 200) {
        setPhoneOtpSent(true);
      }
    } catch (error) {
      console.error("Send Phone OTP error:", error);
    }
  };

  // Send OTP for email verification
  const sendEmailOTP = async () => {
    try {
      const email = form.getFieldValue("email");
      if (!email) {
        message.error("Please enter a valid email address");
        return;
      }

      const response = await dispatch(
        changePhoneNumberAction({
          new_email: email,
          type: "EM",
        })
      ).unwrap();

      if (response?.meta?.status === 200) {
        setEmailOtpSent(true);
      }
    } catch (error) {
      console.error("Send Email OTP error:", error);
    }
  };

  // Verify Phone OTP
  const verifyPhoneOTP = async () => {
    try {
      if (!phoneOtpValue || phoneOtpValue.length !== 6) {
        message.error("Please enter a valid 6-digit OTP");
        return;
      }

      const phoneNumber = form.getFieldValue("phone_number");
      const response = await dispatch(
        changePhoneNumberAction({
          new_phone_number: formatPhoneNumberWithOne(phoneNumber),
          otp: phoneOtpValue,
          type: "MO",
        })
      ).unwrap();

      if (response?.meta?.status === 200) {
        setPhoneOtpVerified(true);
        setShowPhoneOTPField(false);
      }
    } catch (error) {
      console.error("Phone OTP verification error:", error);
      message.error("Invalid OTP. Please try again.");
      setPhoneOtpValue("");
    }
  };

  // Verify Email OTP
  const verifyEmailOTP = async () => {
    try {
      if (!emailOtpValue || emailOtpValue.length !== 6) {
        message.error("Please enter a valid 6-digit OTP");
        return;
      }

      const email = form.getFieldValue("email");
      const response = await dispatch(
        changePhoneNumberAction({
          new_email: email,
          otp: emailOtpValue,
          type: "EM",
        })
      ).unwrap();

      if (response?.meta?.status === 200) {
        setEmailOtpVerified(true);
        setShowEmailOTPField(false);
      }
    } catch (error) {
      console.error("Email OTP verification error:", error);
      message.error("Invalid OTP. Please try again.");
      setEmailOtpValue("");
    }
  };

  // Phone OTP input change handler
  const handlePhoneOTPChange = (value) => {
    setPhoneOtpValue(value);
  };

  // Email OTP input change handler
  const handleEmailOTPChange = (value) => {
    setEmailOtpValue(value);
  };

  const handleEdit = () => {
    // Reset loading state when entering edit mode
    dispatch(resetUpdateProfileState());
    setIsEditing(true);
    // Reset Phone OTP states
    setPhoneNumberChanged(false);
    setShowPhoneOTPField(false);
    setPhoneOtpVerified(true);
    setPhoneOtpSent(false);
    setPhoneOtpValue("");
    // Reset Email OTP states
    setEmailChanged(false);
    setShowEmailOTPField(false);
    setEmailOtpVerified(true);
    setEmailOtpSent(false);
    setEmailOtpValue("");
  };

  const handleCancel = () => {
    // Reset loading state when canceling
    dispatch(resetUpdateProfileState());

    // Reset to initial values (from the latest userForEdit)
    form.setFieldsValue({
      role: userLoginRole.full_name || "Loan Officer",
      fullName: userForEdit?.user?.name || "",
      email: userForEdit?.user?.email || "",
      phone_number: trimPhoneNumber(userForEdit?.user?.phone_number) || "",
      experience: userForEdit?.user?.user_detail?.experience || "",
      state: userForEdit?.user?.user_detail?.state || "",
      service_name: userForEdit?.user?.user_detail?.service_name || "",
      description: userForEdit?.user?.user_detail?.description || "",
      nmls_number: userForEdit?.user?.nmls_number || "",
    });
    setIsEditing(false);
    setSelectedFile(null);
    setCroppedImageFile(null); // Reset cropped image file
    setAvatar(getProfileImageUrl());

    // Reset Phone OTP states
    setPhoneNumberChanged(false);
    setShowPhoneOTPField(false);
    setPhoneOtpVerified(true);
    setPhoneOtpSent(false);
    setPhoneOtpValue("");
    // Reset Email OTP states
    setEmailChanged(false);
    setShowEmailOTPField(false);
    setEmailOtpVerified(true);
    setEmailOtpSent(false);
    setEmailOtpValue("");
  };

  const handleUpdate = () => {
    // Check if phone number changed and not verified
    if (phoneNumberChanged && !phoneOtpVerified) {
      message.error(
        "Please verify your phone number with OTP before updating."
      );
      return;
    }

    // Check if email changed and not verified
    if (emailChanged && !emailOtpVerified) {
      message.error(
        "Please verify your email address with OTP before updating."
      );
      return;
    }

    form
      .validateFields()
      .then((values) => {
        // Create form data to dispatch with the action
        const formData = new FormData();

        formData.append("name", values.fullName);
        formData.append("email", values.email);
        formData.append(
          "phone_number",
          formatPhoneNumberWithOne(values.phone_number)
        );
        formData.append("nmls_number", values.nmls_number);

        if (userLoginRole?.name === "CP" || userLoginRole?.name === "AE" || userLoginRole?.name === "REA") {
          formData.append("experience", values.experience);
          formData.append("state", values.state);
          formData.append("service_name", values.service_name);
          formData.append("description", values.description);
        }



        // Add profile photo if it was changed (prioritize cropped image)
        if (croppedImageFile) {
          formData.append("profile_photo", croppedImageFile);
        } else if (selectedFile) {
          formData.append("profile_photo", selectedFile);
        }

        // Dispatch the update profile action with form data
        dispatch(updateProfileAction(formData))
          .unwrap()
          .then((res) => {
            console.log(res, "respppp");
            if (res?.meta?.status == 200) {
              setIsEditing(false);
              setCroppedImageFile(null); // Reset cropped image file
              // Reset Phone OTP states after successful update
              setPhoneNumberChanged(false);
              setShowPhoneOTPField(false);
              setPhoneOtpVerified(true);
              setPhoneOtpSent(false);
              setPhoneOtpValue("");
              // Reset Email OTP states after successful update
              setEmailChanged(false);
              setShowEmailOTPField(false);
              setEmailOtpVerified(true);
              setEmailOtpSent(false);
              setEmailOtpValue("");
            }
          })
          .catch((error) => {
            console.error("Update profile error:", error);
            // Reset the loading state explicitly
            dispatch(resetUpdateProfileState());

            form.setFieldsValue({
              role: userLoginRole.full_name || "Loan Officer",
              fullName: userForEdit?.user?.name || "",
              email: userForEdit?.user?.email || "",
              phone_number:
                trimPhoneNumber(userForEdit?.user?.phone_number) || "",
              nmls_number: userForEdit?.user?.nmls_number || "",
            });
            setAvatar(getProfileImageUrl());
            setCroppedImageFile(null); // Reset cropped image file
            setIsEditing(false);
          });
      })
      .catch((error) => {
        console.error("Validation failed:", error);
        // Reset loading state if validation fails
        dispatch(resetUpdateProfileState());
      });
  };

  // Updated avatar click handler to open crop modal
  const handleAvatarClick = () => {
    if (isEditing) {
      setShowImageCropModal(true);
    }
  };

  // Handle image crop modal confirm
  const handleImageCropConfirm = (croppedFile, croppedImageUrl) => {
    setCroppedImageFile(croppedFile);
    setAvatar(croppedImageUrl);
    setShowImageCropModal(false);
    // Clear selectedFile since we're using cropped image
    setSelectedFile(null);

    // Show success message
    message.success("Profile picture updated successfully!");
  };

  // Handle image crop modal cancel
  const handleImageCropCancel = () => {
    setShowImageCropModal(false);
  };

  // Determine if update button should be disabled
  const isUpdateDisabled = (phoneNumberChanged && !phoneOtpVerified) || (emailChanged && !emailOtpVerified);

  return (
    <div>
      <div>
        <Text className="text-lg font-bold">Profile</Text>
      </div>
      <Spin spinning={userForEditLoading}>
        <Row className="bg-liteGrayV1 rounded-xl p-4 md:px-6 mt-4 overflow-y-auto">
          <div className="flex justify-between w-full mb-2">
            <div className="relative">
              {avatar ? (
                <Avatar
                  src={avatar}
                  alt="Profile picture"
                  size={80}
                  onClick={handleAvatarClick}
                  className={`${isEditing ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                />
              ) : (
                <Avatar
                  style={{ backgroundColor: "#fde3cf", color: "#f56a00" }}
                  className={`w-full h-full object-cover rounded-full !text-4xl ${isEditing ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                  size={80}
                  onClick={handleAvatarClick}
                >
                  {userForEdit?.user?.name?.[0]}
                </Avatar>
              )}
              {isEditing && (
                <div
                  className="absolute bottom-0 right-[2px] w-5 h-5 bg-primary rounded-full border-zinc-700 border-2 flex justify-center items-center cursor-pointer hover:bg-orange-600 transition-colors"
                  onClick={handleAvatarClick}
                >
                  <i className="icon-edit text-[11px]" />
                </div>
              )}
            </div>
            {!isEditing && !userForEditLoading && (
              <div>
                <Button
                  className="py-5  text-white shadow-none text-sm"
                  shape="round"
                  size="medium"
                  onClick={handleEdit}
                >
                  <i className="icon-edit before:!m-0" />
                  Edit
                </Button>
              </div>
            )}
          </div>
          <Row className="w-full mt-4" gutter={[10, 10]}>
            <Form
              form={form}
              name="profile"
              layout="vertical"
              autoComplete="off"
              requiredMark={false}
              className="w-full"
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={<Text type="secondary">My Role</Text>}
                    name="role"
                  >
                    <Input
                      placeholder="Loan Officer"
                      size="large"
                      className="w-full text-base"
                      disabled={true} // Always disabled
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={<Text type="secondary">Full Name</Text>}
                    name="fullName"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your full name",
                      },
                      {
                        whitespace: true,
                        message: "Name cannot contain only whitespace",
                      },
                      {
                        min: 2,
                        message: "Name must be at least 2 characters",
                      },
                      {
                        max: 20,
                        message: "Name cannot exceed 20 characters",
                      },
                    ]}
                  >
                    <Input
                      placeholder="Full Name"
                      size="large"
                      className="w-full text-base"
                      disabled={!isEditing}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={<Text type="secondary">Email</Text>}
                    name="email"
                    rules={[
                      { required: true, message: "Please enter your email" },
                      { type: "email", message: "Please enter a valid email" },
                    ]}
                  >
                    <Input
                      placeholder="Email"
                      size="large"
                      className="w-full text-base "
                      disabled={!isEditing}
                      onChange={handleEmailChange}
                    />
                  </Form.Item>

                  {/* Email OTP Verification Section */}
                  {showEmailOTPField && isEditing && (
                    <div className="mt-4">
                      {!emailOtpSent ? (
                        <Button
                          type="primary"
                          size="large"
                          onClick={sendEmailOTP}
                          loading={otpLoading}
                          className="mb-3"
                        >
                          Send OTP for Email Verification
                        </Button>
                      ) : (
                        <div className="w-full">
                          <div className="mb-3">
                            <Text type="secondary" className="text-sm">
                              Enter the 6-digit OTP sent to your new email
                              address
                            </Text>
                          </div>
                          <div className="flex gap-3 items-center profile-otp-setting">

                            <Input.OTP
                              length={6}
                              value={emailOtpValue}
                              onChange={handleEmailOTPChange}
                              formatter={(str) => str.replace(/\D/g, "")}
                              size="large"
                              className="!w-full "
                            />

                            <Button
                              type="primary"
                              size="large"
                              onClick={verifyEmailOTP}
                              loading={otpLoading}
                              disabled={!emailOtpValue || emailOtpValue.length !== 6}
                            >
                              Verify
                            </Button>

                          </div>
                          <div className="mt-2 !mb-5">
                            <Text
                              className="text-primary cursor-pointer text-sm "
                              onClick={sendEmailOTP}
                            >
                              Resend OTP
                            </Text>
                          </div>
                        </div>
                      )}

                      {emailOtpVerified && (
                        <div className="mt-2">
                          <Text type="success" className="text-sm">
                            ✓ Email address verified successfully
                          </Text>
                        </div>
                      )}
                    </div>
                  )}
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={<Text type="secondary">Contact Number</Text>}
                    name="phone_number"
                    rules={[
                      {
                        required: true,
                        message: null,
                      },
                      {
                        validator: validatePhoneNumber,
                      },
                    ]}
                    normalize={normalizePhoneNumber}
                  >
                    <Input
                      placeholder="Phone Number"
                      autoComplete="tel"
                      className="w-full text-base "
                      maxLength={12} // Account for format characters: 3 + 1 + 3 + 1 + 4 = 12
                      prefix={
                        <div
                          className={`pr-3 border-r ${isEditing ? "border-liteGray" : "text-gray"
                            }  mr-3 flex items-center justify-center`}
                        >
                          <img src={USFlag} alt="" className="mr-3" />
                          <Text
                            className={`${isEditing ? "" : "text-grayText"}`}
                          >
                            +1
                          </Text>
                        </div>
                      }
                      disabled={!isEditing}
                      size="large"
                      onChange={handlePhoneNumberChange}
                    />
                  </Form.Item>

                  {/* Phone OTP Verification Section */}
                  {showPhoneOTPField && isEditing && (
                    <div className="mt-4">
                      {!phoneOtpSent ? (
                        <Button
                          type="primary"
                          size="large"
                          onClick={sendPhoneOTP}
                          loading={otpLoading}
                          className="mb-3"
                        >
                          Send OTP for Contact Verification
                        </Button>
                      ) : (
                        <div>
                          <div className="mb-3">
                            <Text type="secondary" className="text-sm">
                              Enter the 6-digit OTP sent to your new phone
                              number
                            </Text>
                          </div>
                          <div className="flex gap-3 items-center profile-otp-setting">
                            <Input.OTP
                              length={6}
                              value={phoneOtpValue}
                              onChange={handlePhoneOTPChange}
                              formatter={(str) => str.replace(/\D/g, "")}
                              size="large"
                              className="flex-1"
                            />
                            <Button
                              type="primary"
                              size="large"
                              onClick={verifyPhoneOTP}
                              loading={otpLoading}
                              disabled={!phoneOtpValue || phoneOtpValue.length !== 6}
                            >
                              Verify
                            </Button>
                          </div>
                          <div className="mt-2 mb-5">
                            <Text
                              className="text-primary cursor-pointer text-sm"
                              onClick={sendPhoneOTP}
                            >
                              Resend OTP
                            </Text>
                          </div>
                        </div>
                      )}

                      {phoneOtpVerified && (
                        <div className="mt-2">
                          <Text type="success" className="text-sm">
                            ✓ Phone number verified successfully
                          </Text>
                        </div>
                      )}
                    </div>
                  )}
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={<Text type="secondary">NMLS Number</Text>}
                    name="nmls_number"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your NMLS number",
                      },
                    ]}
                    normalize={normalizeNMLSNumber}
                  >
                    <Input
                      placeholder="NMLS Number"
                      size="large"
                      className="w-full text-base "
                      disabled={!isEditing}
                    />
                  </Form.Item>
                </Col>
                {
                  userLoginRole?.name === "CP" || userLoginRole?.name === "AE" || userLoginRole?.name === "REA" ? <>

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
                          size="large"
                          disabled={!isEditing}

                        />
                      </Form.Item>
                    </Col>
                    {
                      userLoginRole?.name === "CP" ?
                        <Col xs={24} md={12}>
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
                              size="large"
                              disabled={!isEditing}
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
                              "Company name cannot contain only whitespace!",
                          },
                        ]}
                      >
                        <Input
                          placeholder="Enter Company Name"
                          autoComplete="off"
                          showCount
                          maxLength={50}
                          size="large"
                          disabled={!isEditing}
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
                              "Description cannot contain only whitespace!",
                          },
                        ]}
                      >
                        <Input.TextArea
                          placeholder="Enter Description"
                          autoComplete="off"
                          rows={4}
                          maxLength={1000}
                          showCount
                          size="large"
                          disabled={!isEditing}
                        />
                      </Form.Item>
                    </Col>
                  </> : null
                }
              </Row>
            </Form>
          </Row>

          {isEditing && (
            <>
              <hr className="h-1 w-full text-liteGray my-3" />
              <Row className="w-full mt-2" gutter={[12, 12]}>
                <Col xs={12}>
                  <Button
                    block
                    className="shadow-none py-5"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </Col>
                <Col xs={12}>
                  <Button
                    type="primary"
                    block
                    className="shadow-none py-5"
                    onClick={handleUpdate}
                    loading={updateProfileLoading}
                    disabled={isUpdateDisabled}
                  >
                    Update
                  </Button>
                </Col>
              </Row>
            </>
          )}
        </Row>
      </Spin>

      {/* Image Crop Modal */}
      <ImageCropModal
        visible={showImageCropModal}
        onCancel={handleImageCropCancel}
        onConfirm={handleImageCropConfirm}
        initialImage={null}
      />
    </div>
  );
};

export default Profile;