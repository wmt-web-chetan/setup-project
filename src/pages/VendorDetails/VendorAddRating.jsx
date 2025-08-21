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
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  fetchVendorDetailById,
  rateVendorAction,
} from "../../services/Store/VendorAdmin/action";

const { Text, Title } = Typography;
const { TextArea } = Input;

const VendorAddRating = ({
  isVisible,
  onCancel,
  companyName = "Elite Mortgage Solutions",
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [anonymous, setAnonymous] = useState(false);
  const params = useParams();
  const dispatch = useDispatch();

  // Get loading state from Redux
  const { rateVendorLoading } = useSelector(
    (state) => state.vendorStoreCategories
  );
  console.log("params", params);
  // Handle form submission
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Prepare the payload according to API requirements
      const payload = {
        vendor_id: params.id, // Get vendor ID from URL params
        score: values.rating,
        heading: values.heading,
        comment: values.comment,
        is_anonymous: anonymous,
      };

      console.log("Submitting rating payload:", payload);

      // Call the Redux action
      const result = await dispatch(rateVendorAction(payload));
      console.log("result", result);
      if (result?.payload?.meta?.success === true) {
        // Reset form and close modal on success
        form.resetFields();
        setAnonymous(false);
        onCancel();

        // Call the onSubmit callback if provided
        if (onSubmit) {
          await onSubmit({
            rating: values.rating,
            heading: values.heading,
            comment: values.comment,
            isAnonymous: anonymous,
            companyName,
          });
        }
        const fetchPayload = {
          id: params.id,
          category_id: params.categoryId || null, // Include category_id if available
        };
        // Refetch vendor details to update ratings
        dispatch(fetchVendorDetailById(fetchPayload))
          .then(() => {
            console.log(
              "Vendor details refreshed after rating submission11111111111111"
            );
          })
          .catch((error) => {
            console.error("Error refreshing vendor details:", error);
          });

        // message.success("Your rating has been submitted successfully");
      } else {
        // Error message will be shown by the Redux slice
        console.error(
          "Rating submission failed:",
          result?.payload?.meta?.message
        );
      }
    } catch (error) {
      console.error("Form submission error:", error);

      // Only show error message if it's a validation error
      if (error.errorFields) {
        // message.error("Please fill in all required fields");
      } else {
        // message.error("Failed to submit rating. Please try again");
      }
    }
  };

  // Handle modal cancel
  const handleCancel = () => {
    if (!rateVendorLoading) {
      form.resetFields();
      setAnonymous(false);
      onCancel();
    }
  };

  return (
    <Modal
      title="Add Rating"
      centered
      destroyOnClose
      open={isVisible}
      className=" px-3"
      onCancel={handleCancel}
      footer={false}
      maskClosable={!rateVendorLoading}
      closeIcon={
        <Button
          shape="circle"
          icon={<i className="icon-close before:!m-0 text-sm" />}
          disabled={rateVendorLoading}
        />
      }
      width={700}
    >
      <Form form={form} layout="vertical" requiredMark={false} size="large">
        <Row className="mt-6">
          <Col span={24} className="flex items-center">
            <Text className="text-grayText font-semibold text-sm">
              Rate your experience with {companyName}
            </Text>
          </Col>

          <Col span={24} className="mt-3">
            <Form.Item
              label={
                <Text type="secondary" className="text-sm">
                  Rating
                </Text>
              }
              name="rating"
              rules={[{ required: true, message: "Please provide a rating" }]}
              initialValue={5}
            >
              <Rate
                className="text-yellow-600 text-xl"
                disabled={rateVendorLoading}
              />
            </Form.Item>
          </Col>

          <Col span={24} className="mt-3">
            <Form.Item
              label={
                <Text type="secondary" className="text-sm">
                  Heading
                </Text>
              }
              name="heading"
              rules={[
                { required: true, message: "Please add a heading" },
                {
                  min: 5,
                  message: "Heading must be at least 5 characters long",
                },
                { max: 100, message: "Heading cannot exceed 100 characters" },
                {
                  whitespace: true,
                  message: "Heading Cannot Contain Only Whitespace!",
                },
              ]}
            >
              <Input
                placeholder="Enter a brief heading for your review"
                className="bg-darkGray text-white border-liteGray"
                disabled={rateVendorLoading}
                maxLength={100}
                showCount
              />
            </Form.Item>
          </Col>

          <Col span={24} className="p-0 m-0">
            <Form.Item
              label={
                <Text type="secondary" className="text-sm">
                  Add Comment
                </Text>
              }
              name="comment"
              className="mt-2"
              rules={[
                { required: true, message: "Please add a comment" },
                {
                  min: 10,
                  message: "Comment must be at least 10 characters long",
                },
                { max: 1000, message: "Comment cannot exceed 1000 characters" },
                {
                  whitespace: true,
                  message: "Comment Name Cannot Contain Only Whitespace!",
                },
              ]}
            >
              <TextArea
                placeholder="Share your detailed experience with this vendor..."
                autoSize={{ minRows: 4, maxRows: 8 }}
                className="bg-darkGray text-white border-liteGray"
                disabled={rateVendorLoading}
                maxLength={1000}
                showCount
              />
            </Form.Item>
          </Col>
        </Row>

        <hr className="text-liteGray" />

        <Row className="mt-3 flex items-center">
          <Col xs={12} className="flex items-center">
            <Text type="secondary" className="mr-3">
              Post as Anonymous
            </Text>
            <Switch
              checked={anonymous}
              onChange={setAnonymous}
              disabled={rateVendorLoading}
              className={anonymous ? "bg-primary" : "bg-liteGray"}
            />
          </Col>
          <Col xs={12} className="flex gap-3">
            <Button
              size="large"
              onClick={handleCancel}
              disabled={rateVendorLoading}
              className="bg-gray text-white hover:bg-liteGray border-liteGray w-1/2"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
              loading={rateVendorLoading}
              className="w-1/2"
            >
              Submit Rating
            </Button>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default VendorAddRating;
