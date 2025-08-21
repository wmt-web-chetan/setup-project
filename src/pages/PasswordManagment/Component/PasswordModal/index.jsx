import React, { useState, useEffect } from "react";
import { Typography, Form, Input, Button, Row, Col, Modal } from "antd";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  addPassword,
  updatePasswordAction,
} from "../../../../services/Store/PasswordManagement/actions";

const { Text, Title } = Typography;

const PasswordModal = ({
  visible,
  onClose,
  editingPassword = null,
  onFinish,
}) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Add local loading state that we'll manage directly
  const [localLoading, setLocalLoading] = useState(false);

  // Get data from Redux store
  const { userForEdit } = useSelector((state) => state?.usersmanagement);

  // Handle window resize for responsive view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize form with editing data if available
  useEffect(() => {
    if (visible) {
      if (editingPassword) {
        // If editing, set form values from the editing password
        form.setFieldsValue({
          name: editingPassword.name || "",
          user_name: editingPassword.user_name || "",
          password: editingPassword.password || "",
          url: editingPassword.url || "",
        });
      } else {
        // If creating new, reset form
        form.resetFields();
      }
      // Reset loading state when modal opens
      setLocalLoading(false);
    }
  }, [editingPassword, form, visible]);

  // Handle form submission
  const handleSubmit = (values) => {
    // Set local loading state
    setLocalLoading(true);

    const formattedPayload = {
      name: values.name,
      user_name: values.user_name || "",
      password: values.password || "",
      url: values.url || "",
      user_id: userForEdit?.user?.id,
    };

    if (editingPassword) {
      // Update existing password
      dispatch(
        updatePasswordAction({
          id: editingPassword.id,
          ...formattedPayload,
        })
      )
        .then((result) => {
          // Reset loading state regardless of result
          setLocalLoading(false);
          console.log("Password update result:", result);

          if (result.payload?.meta?.success) {
            if (onFinish) onFinish();
            handleCancel();
          }
        })
        .catch((error) => {
          // Make sure to reset loading on error too
          console.error("Password update error:", error);
          setLocalLoading(false);
        });
    } else {
      // Create new password
      dispatch(addPassword(formattedPayload))
        .then((result) => {
          // Reset loading state regardless of result
          setLocalLoading(false);
          console.log("Password creation result:", result);

          if (result.payload?.meta?.success) {
            if (onFinish) onFinish();
            handleCancel();
          }
        })
        .catch((error) => {
          // Make sure to reset loading on error too
          console.error("Password creation error:", error);
          setLocalLoading(false);
        });
    }
  };

  // Reset form when modal is closed
  const handleCancel = () => {
    form.resetFields();
    setPasswordVisible(false);
    setLocalLoading(false); // Reset loading state on cancel
    onClose();
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  return (
    <Modal
      title={
        <Title level={4} className="m-0 ">
          {editingPassword ? "Edit Password" : "Create New Password"}
        </Title>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={isMobile ? "95%" : 680}
      destroyOnClose
      maskClosable={false}
      centered
      className="password-form-modal modalWrapperBox"
      closeIcon={
        <Button
          shape="circle"
          icon={<i className="icon-close before:!m-0 text-sm " />}
        />
      }
    >
      <div className="h-full">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="w-full"
          size="large"
          requiredMark={false}
        >
          <Row gutter={[12, 12]}>
            <Col span={24} className="mt-5">
              <Form.Item
                label={
                  <Text type="secondary">
                    Name
                  </Text>
                }
                name="name"
                rules={[
                  {
                    required: true,
                    message: "Please enter a name for this password!",
                  },
                  {
                    whitespace: true,
                    message: "Name cannot contain only whitespace!",
                  },
                  {
                    min: 2,
                    message: "Name must be at least 2 characters!",
                  },
                  {
                    max: 100,
                    message: "Name cannot exceed 100 characters!",
                  },
                ]}
              >
                <Input placeholder="Enter Name" autoComplete="off" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                label={<Text type="secondary">Username</Text>}
                name="user_name"
                rules={[
                  {
                    required: true,
                    message: "Please enter a username for this password!",
                  },
                  {
                    whitespace: true,
                    message: "Username cannot contain only whitespace!",
                  },
                  {
                    min: 2,
                    message: "Username must be at least 2 characters!",
                  },
                  {
                    max: 100,
                    message: "Username cannot exceed 100 characters!",
                  },
                ]}
              >
                <Input placeholder="Enter Username" autoComplete="off" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                label={
                  <Text type="secondary">
                    Password
                  </Text>
                }
                name="password"
                rules={[
                  {
                    required: true,
                    message: "Please enter a password!",
                  },
                  {
                    whitespace: true,
                    message: "Password cannot contain only whitespace!",
                  },
                  {
                    min: 2,
                    message: "Password must be at least 2 characters!",
                  },
                  {
                    max: 100,
                    message: "Password cannot exceed 100 characters!",
                  },
                ]}
              >
                <Input.Password
                  placeholder="Enter Password"
                  type={passwordVisible ? "text" : "password"}
                  autoComplete="new-password"
                  iconRender={(visible) =>
                    visible ? (
                      <EyeOutlined
                        onClick={togglePasswordVisibility}
                        className="text-primary cursor-pointer"
                      />
                    ) : (
                      <EyeInvisibleOutlined
                        onClick={togglePasswordVisibility}
                        className="text-grayText cursor-pointer"
                      />
                    )
                  }
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item label={<Text type="secondary">URL</Text>} name="url" rules={[
                  {
                    type:'url',
                    message: "Please enter a valid URL!",
                  },
                  {
                    whitespace: true,
                    message: "URL cannot contain only whitespace!",
                  },
                  {
                    min: 2,
                    message: "URL must be at least 2 characters!",
                  },
                  {
                    max: 100,
                    message: "URL cannot exceed 100 characters!",
                  },
                ]}>
                <Input
                  placeholder="Enter URL (e.g. login.salesforce.com)"
                  autoComplete="off"
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 mt-4 pt-6 border-t border-liteGray">
            <Button
              size="large"
              onClick={handleCancel}
              className="w-full bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={localLoading}
              className="w-full mb-3 sm:mb-0"
            >
              {editingPassword ? "Update Password" : "Create Password"}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default PasswordModal;
