import React, { useEffect, useState } from "react";
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
  Select
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchLoanType } from "../../services/Store/ContractProcessor/actions";

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const VendorAddRating = ({
  isVisible,
  onCancel,
  companyName = "Elite Mortgage Solutions",
  onSubmit,
  ratedUserId, // Rated user ID from parent component
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const dispatch = useDispatch();
  const { loanType, loanTypeLoading } = useSelector((state) => state.contractProcessor);

  // Custom validation function to check for whitespace-only content
  const validateNotOnlyWhitespace = (_, value) => {
    if (!value || value.trim().length === 0) {
      return Promise.reject(new Error('This field cannot be empty or contain only spaces'));
    }
    return Promise.resolve();
  };

  // Fetch loan types when component mounts
  useEffect(() => {
    dispatch(fetchLoanType());
  }, [dispatch]);

  // Set default loan type when data is loaded
  useEffect(() => {
    if (loanType?.data?.length > 0) {
      form.setFieldsValue({
        loanType: loanType.data[0].id
      });
    }
  }, [loanType?.data, form]);


  // Handle form submission
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();

      // Prepare the data for submission according to API requirements
      const payload = {
        rated_user_id: ratedUserId,
        score: values.rating || 0, // Default to 0 if no rating provided
        loan_category_id: values.loanType,
        heading: values.heading.trim(), // Trim whitespace
        comment: values.comment.trim(), // Trim whitespace
        ctc: parseInt(values.ctc), // Use parseInt for integers only
        is_anonymous: anonymous,
      };

      // Call the onSubmit callback - parent will handle API call
      if (onSubmit) {
        await onSubmit(payload);
      }

      // Reset form and close modal only if submission was successful
      form.resetFields();
      setAnonymous(false);
      onCancel();

    } catch (error) {
      console.error("Form submission error:", error);
      
      // Check if it's a validation error from form.validateFields()
      if (error?.errorFields && error.errorFields.length > 0) {
        // This is a form validation error - don't close modal, let form show errors
        return; // Don't close modal, let validation errors show
      }
      
      // Handle other types of errors (API errors, etc.)
      message.error("Something went wrong. Please try again.");
      
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Add Rating"
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
      width={900}
    >
      <Form form={form} layout="vertical" requiredMark={false} size="large">
        <Row className="mt-6">
          <Col span={24} className="flex items-center">
            <Text className="text-grayText font-semibold text-sm">
              Rate your experience
            </Text>
            <Form.Item
              name="rating"
              className="mb-0 ml-3"
            >
              <Rate
                className="text-yellow-600 text-xl"
              />
            </Form.Item>
          </Col>

          {/* New row for Loan Type and CTC */}
          <Row gutter={16} className="w-full mt-4">
            <Col span={12}>
              <Form.Item
                label={<Text type="secondary" className="text-sm">Loan Type</Text>}
                name="loanType"
                rules={[{ required: true, message: "Please select loan type" }]}
              >
                <Select
                  placeholder="Select loan type"
                  className="bg-darkGray text-white border-liteGray"
                  loading={loanTypeLoading}
                >
                  {loanType?.data?.map(item => (
                    <Option key={item?.id} value={item?.id}>{item?.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<Text type="secondary" className="text-sm">CTC</Text>}
                name="ctc"
                rules={[
                  { required: true, message: "Please enter CTC" },
                  {
                    pattern: /^\d+$/,
                    message: "Please enter a valid whole number"
                  },
                  {
                    validator: (_, value) => {
                      if (value && parseInt(value) < 1) {
                        return Promise.reject(new Error('CTC must be at least 1 day'));
                      }
                      if (value && parseInt(value) > 365) {
                        return Promise.reject(new Error('CTC cannot exceed 365 days'));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Input
                  placeholder="Days to close (e.g., 1, 30, 45)"
                  className="bg-darkGray text-white border-liteGray"
                  suffix={<span className="text-liteGray text-xs">In Days</span>}
                  type="number"
                  min="1"
                  max="365"
                />
              </Form.Item>
            </Col>
          </Row>

          <Col span={24} className="mt-3">
            <Form.Item
              label={<Text type="secondary" className="text-sm">Heading</Text>}
              name="heading"
              rules={[
                { required: true, message: "Please add a heading" },
                { max: 200, message: "Heading cannot exceed 200 characters" },
                { validator: validateNotOnlyWhitespace }
              ]}
            >
              <Input
                placeholder="Heading (max 200 characters)"
                className="bg-darkGray text-white border-liteGray"
                maxLength={200}
                showCount
              />
            </Form.Item>
          </Col>

          <Col span={24} className="p-0 m-0">
            <Form.Item
              label={<Text type="secondary" className="text-sm">Add Comment</Text>}
              name="comment"
              className="mt-2"
              rules={[
                { required: true, message: "Please add a comment" },
                { max: 500, message: "Comment cannot exceed 500 characters" },
                { validator: validateNotOnlyWhitespace }
              ]}
            >
              <TextArea
                placeholder="Add your review details here... (max 500 characters)"
                autoSize={{ minRows: 4, maxRows: 8 }}
                className="bg-darkGray text-white border-liteGray"
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Col>
        </Row>
        <hr className="text-liteGray" />

        <Row className="mt-3 flex items-center">
          <Col xs={12} className="flex items-center">
            <Text type="secondary" className="mr-3">Post as Anonymous</Text>
            <Switch
              checked={anonymous}
              onChange={setAnonymous}
              className={anonymous ? "bg-primary" : "bg-liteGray"}
            />
          </Col>
          <Col xs={12} className="flex gap-3">
            <Button
              size="large"
              onClick={onCancel}
              disabled={submitting}
              className="bg-gray text-white hover:bg-liteGray border-liteGray w-1/2"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
              loading={submitting}
              className="w-1/2 bg-orange-500 hover:bg-orange-600"
            >
              Submit
            </Button>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default VendorAddRating; 