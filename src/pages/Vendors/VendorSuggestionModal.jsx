import React, { useState } from "react";
import {
  Modal,
  Button,
  Row,
  Col,
  Typography,
  Form,
  Input,
  Rate,
  Switch,
  message,
} from "antd";
import { useDispatch } from "react-redux";
import { addVendorSuggestion } from "../../services/Store/VendorAdmin/action";

const { Text, Title } = Typography;
const { TextArea } = Input;

const VendorSuggestionModal = ({ isVisible, onCancel, onSubmit }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch()

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();

      // Prepare the payload for addVendorSuggestion
      const payload = {
        vendor_name: values.heading?.trim(),
        description: values.comment?.trim(),
      };

      // Call the addVendorSuggestion action
      dispatch(addVendorSuggestion(payload))
        .then((response) => {
          // Handle success
          // message.success("Vendor suggestion submitted successfully!");
          
          // Reset form and close modal
          form.resetFields();
          onCancel();
          
          // Call the onSubmit callback if provided
          if (onSubmit) {
            onSubmit(response);
          }
        })
        .catch((error) => {
          // Handle error
          console.error("Vendor suggestion submission error:", error);
          message.error("Failed to submit vendor suggestion. Please try again.");
        })
        .finally(() => {
          setSubmitting(false);
        });
    } catch (error) {
      console.error("Form validation error:", error);
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Vendor Suggestion"
      centered
      destroyOnClose
      open={isVisible}
      className=" px-3"
      onCancel={!submitting ? onCancel : undefined}
      footer={false}
      maskClosable={!submitting}
      closeIcon={
        <Button
          shape="circle"
          icon={<i className="icon-close before:!m-0 text-sm" />}
          disabled={submitting}
        />
      }
      width={700}
    >
      <Form form={form} layout="vertical" requiredMark={false} size="large">
        <Row className="mt-6">
          <Col span={24} className="mt-3">
            <Form.Item
              label={<Text type="secondary text-sm">Vendor Name</Text>}
              name="heading"
              rules={[
                { required: true, message: "Please add a vendor name!" },
                { max: 50, message: "Vendor name cannot exceed 50 characters!" },
                {
                  validator: (_, value) => {
                    if (!value || value.trim() === '') {
                      return Promise.reject(new Error('Vendor name cannot be empty or contain only whitespace!'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <Input
                placeholder="Vendor Name"
                className="bg-darkGray text-white border-liteGray"
                maxLength={50}
                showCount
              />
            </Form.Item>
          </Col>

          <Col span={24} className="p-0 m-0">
            <Form.Item
              label={<Text type="secondary text-sm">Description</Text>}
              name="comment"
              className="mt-2"
              rules={[
                { required: true, message: "Please add a description!" },
                { max: 250, message: "Description cannot exceed 250 characters!" },
                {
                  validator: (_, value) => {
                    if (!value || value.trim() === '') {
                      return Promise.reject(new Error('Description cannot be empty or contain only whitespace!'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <TextArea
                placeholder="Description"
                autoSize={{ minRows: 4, maxRows: 8 }}
                className="bg-darkGray text-white border-liteGray"
                maxLength={250}
                showCount
                // defaultValue="Elite Mortgage Solutions has been an absolute game-changer for our business. Their team is professional, efficient, and always ahead of deadlines. Communication is seamless, and they handle complex mortgage processing with ease. Highly recommend their services!"
              />
            </Form.Item>
          </Col>
        </Row>
        <hr className="text-liteGray" />
        
        <Row className="mt-4 flex items-center " gutter={[12]}>
          <Col xs={12}>
            <Button
              size="large"
              onClick={onCancel}
              disabled={submitting}
              className="bg-gray text-white hover:bg-liteGray border-liteGray w-full "
            >
              Cancel
            </Button>
          </Col>
          <Col xs={12}>
            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
              loading={submitting}
              className="w-full"
            >
              Send
            </Button>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default VendorSuggestionModal;