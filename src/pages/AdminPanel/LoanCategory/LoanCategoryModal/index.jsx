import React, { useState, useEffect } from "react";
import {
  Typography,
  Form,
  Input,
  Button,
  Row,
  Col,
  Modal,
  Divider,
  notification,
  ColorPicker,
  Space,
  Spin,
  Card,
  Switch,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  addLoanCategory,
  updateLoanCategoryAction,
} from "../../../../services/Store/LoanCategory/action";
import { PlusOutlined, CloseOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

const LoanCategoryModal = ({ visible, onClose, onFinish, editingCategory }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [subCategories, setSubCategories] = useState([]);
  const [status, setStatus] = useState(false);
  // Add a state to track the main color
  const [selectedColor, setSelectedColor] = useState(`rgb(100, 100, 200)`);
  // Add form loading state to prevent rendering issues
  const [formLoading, setFormLoading] = useState(false);

  // Get loading states from Redux store
  const { createLoanCategoryLoading, updateLoanCategoryLoading } = useSelector(
    (state) => state?.loanCategories || {}
  );


  // Determine if we're in loading state based on the operation
  const isLoading = editingCategory
    ? updateLoanCategoryLoading
    : createLoanCategoryLoading;

  useEffect(() => {
    if (visible) {
      if (editingCategory) {
        // Set form loading to true when starting to load edit data
        setFormLoading(true);
        
        // Reset the form first to clear any previous values
        form.resetFields();

        // Set the main category values
        form.setFieldsValue({
          name: editingCategory.name,
          color: editingCategory.color,
          is_active: !!editingCategory.is_active,
        });

        setStatus(!!editingCategory.is_active)

        // Set the color state as well
        setSelectedColor(editingCategory.color);

        // Set sub-categories if they exist
        if (
          editingCategory.sub_categories &&
          Array.isArray(editingCategory.sub_categories)
        ) {
          // Make sure each subcategory has properly formatted color
          const formattedSubCategories = editingCategory.sub_categories.map(
            (subCat) => ({
              ...subCat,
              color: subCat.color,
            })
          );

          setSubCategories(formattedSubCategories);

          // Now we need to set form values for each subcategory
          // This needs to happen after setSubCategories so the fields exist
          setTimeout(() => {
            formattedSubCategories.forEach((subCat, index) => {
              form.setFieldsValue({
                [`sub_category[${index}].name`]: subCat.name,
                [`sub_category[${index}].color`]: subCat.color,
              });
            });
            // Set form loading to false after all data is loaded
            setFormLoading(false);
          }, 0);
        } else {
          setSubCategories([]);
          // Set form loading to false if no subcategories
          setFormLoading(false);
        }
      } else {
        // Reset form for new category
        form.resetFields();
        setSubCategories([]);
        setSelectedColor("rgb(100, 100, 200)"); // Default color
        setStatus(false);
        // Set default form values for new category
        form.setFieldsValue({
          is_active: false,
          color: "rgb(100, 100, 200)"
        });
        setFormLoading(false);
      }
    }
  }, [editingCategory, form, visible]);

  const handleSubmit = (values) => {
    // console.log("values", values);

    // Format the payload according to the required structure
    const formattedPayload = {
      name: values.name,
      color: values.color || selectedColor,
      is_active: values.is_active ? 1 : 0,
      sub_category: subCategories.map((sub) => ({
        name: sub.name,
        color: sub.color || selectedColor,
        ...(sub.id && { id: sub.id }), // Include ID if it exists (for updates)
      })),
    };

    // Add ID for updates
    if (editingCategory?.id) {
      formattedPayload.id = editingCategory.id;
    }

    if (editingCategory) {
      // Update existing category
      dispatch(updateLoanCategoryAction(formattedPayload))
        .then((result) => {
          if (result.payload?.meta?.success) {
            if (onFinish) {
              onFinish(values);
            }
          }
        })
        .catch((error) => {
          console.error("Error updating loan category:", error);
        });
    } else {
      // Create new category
      dispatch(addLoanCategory(formattedPayload))
        .then((result) => {
          if (result.payload?.meta?.success) {
            if (onFinish) {
              onFinish(values);
            }
          }
        })
        .catch((error) => {
          console.error("Error creating loan category:", error);
        });
    }
  };

  // Reset form when modal is closed
  const handleCancel = () => {
    form.resetFields();
    setSubCategories([]);
    setSelectedColor("rgb(100, 100, 200)");
    onClose();
    setStatus(false);
    setFormLoading(false);
  };

  // Add a new empty sub-category
  const addSubCategory = () => {
    setSubCategories([
      ...subCategories,
      { name: "", color: "rgb(100, 100, 200)" },
    ]);
  };

  const onChangeSwitch = (checked) => {
    // console.log('checked', checked)
    setStatus(checked)
    // Also update the form field
    form.setFieldsValue({ is_active: checked })
  }

  // Remove a sub-category
  const removeSubCategory = (index) => {
    const updatedSubCategories = [...subCategories];
    updatedSubCategories.splice(index, 1);
    setSubCategories(updatedSubCategories);

    // Also need to reset the form fields for this subcategory
    form.setFieldsValue({
      [`sub_category[${index}].name`]: undefined,
      [`sub_category[${index}].color`]: undefined,
    });
  };

  // Update a sub-category
  const updateSubCategory = (index, field, value) => {
    const updatedSubCategories = [...subCategories];
    updatedSubCategories[index] = {
      ...updatedSubCategories[index],
      [field]: value,
    };
    setSubCategories(updatedSubCategories);

    // Also update the form field value
    if (field === "name") {
      form.setFieldsValue({
        [`sub_category[${index}].name`]: value,
      });
    } else if (field === "color") {
      form.setFieldsValue({
        [`sub_category[${index}].color`]: value,
      });
    }
  };

  return (
    <Modal
      title={
        <Title level={4} className="m-0">
          {editingCategory ? "Edit Loan Category" : "Create New Loan Category"}
        </Title>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={700}
      destroyOnClose
      maskClosable={false}
      centered
      className="loan-category-modal modalWrapperBox"
      closeIcon={
        <Button
          shape="circle"
          icon={<i className="icon-close before:!m-0 text-sm" />}
        />
      }
    >
      <div style={{ height: "100%" }}>
        {formLoading ? (
          <div className="flex justify-center items-center" style={{ minHeight: "300px" }}>
            <Spin size="large" />
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="w-full"
            size="large"
            requiredMark={false}
          >
            <div
              className="wrapperFormContent"
              style={{ maxHeight: "60vh", overflowY: "auto" }}
            >
              <Row gutter={[24, 16]}>
                <Col span={24}>
                  <Divider orientation="left">
                    <Text className="text-grayText">Category Information</Text>
                  </Divider>
                </Col>

                <Col xs={24} md={16}>
                  <Form.Item
                    label={<Text type="secondary">Category Name</Text>}
                    name="name"
                    rules={[
                      {
                        required: true,
                        message: "Please enter category name!",
                      },
                      {
                        whitespace: true,
                        message: "Category name cannot contain only whitespace!",
                      },
                      {
                        min: 2,
                        message: "Name must be at least 2 characters!",
                      },
                      {
                        max: 25,
                        message: "Name cannot exceed 25 characters!",
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      placeholder="Enter Category Name"
                      autoComplete="off"
                    />
                  </Form.Item>
                </Col>

               

                <Col xs={24} md={8}>
                  <Form.Item
                    label={<Text type="secondary">Category Color</Text>}
                    name="color"
                  >
                    <div className="flex items-center gap-2">
                      <ColorPicker
                        showText
                        format="hex"
                        value={selectedColor}
                        onChange={(colorObj, hexValue) => {
                          setSelectedColor(hexValue);
                          form.setFieldsValue({ color: hexValue });
                        }}
                        size="large"
                        disabledFormat={true}
                        disabledAlpha={true}
                      />
                    </div>
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    name="is_active"
                    label={<Text type="secondary">Status</Text>}
                    valuePropName="checked"
                  >
                    <Switch
                      size="default"
                      checkedChildren="Active"
                      unCheckedChildren="Inactive"
                      checked={status}
                      onChange={onChangeSwitch}
                    />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Divider orientation="left">
                    <Text className="text-grayText">Sub Categories</Text>
                  </Divider>
                </Col>

                {subCategories.map((subCat, index) => (
                  <Col span={24} key={index}>
                    <Card
                      className="bg-[#242424] mb-4"
                      bordered={false}
                      extra={
                        !editingCategory &&
                        <Button
                          type="text"
                          danger
                          icon={<CloseOutlined />}
                          onClick={() => removeSubCategory(index)}
                        />
                      }
                    >
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={16}>
                          <Form.Item
                            name={`sub_category[${index}].name`}
                            label={
                              <Text type="secondary">Sub Category Name</Text>
                            }
                            rules={[
                              {
                                required: true,
                                message: "Please enter sub category name!",
                              },
                              {
                                whitespace: true,
                                message:
                                  "Sub category name cannot contain only whitespace!",
                              },
                              {
                                min: 2,
                                message: "Name must be at least 2 characters!",
                              },
                              {
                                max: 25,
                                message: "Name cannot exceed 25 characters!",
                              },
                            ]}
                          >
                            <Input
                              size="large"
                              placeholder="Enter Sub Category Name"
                              value={subCat.name}
                              onChange={(e) =>
                                updateSubCategory(index, "name", e.target.value)
                              }
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                          <Form.Item
                            label={<Text type="secondary">Color</Text>}
                            name={`sub_category[${index}].color`}
                          >
                            <div className="flex items-center gap-2">
                              <ColorPicker
                                showText
                                format="hex"
                                value={subCat.color}
                                onChange={(colorObj, hexValue) => {
                                  updateSubCategory(index, "color", hexValue);
                                }}
                                disabledFormat={true}
                                disabledAlpha={true}
                              />
                            </div>
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                ))}

                <Col span={24}>
                  <Button
                    type="dashed"
                    onClick={addSubCategory}
                    block
                    icon={<PlusOutlined />}
                    className="mb-4"
                  >
                    Add Sub Category
                  </Button>
                </Col>
              </Row>
            </div>

            <div className="wrapperFooter">
              <Col span={24}>
                <div className="flex justify-end gap-4">
                  <Button
                    size="large"
                    onClick={handleCancel}
                    className="rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    htmlType="submit"
                    loading={isLoading}
                    className="rounded-lg shadow-md"
                  >
                    {editingCategory ? "Update Category" : "Create Category"}
                  </Button>
                </div>
              </Col>
            </div>
          </Form>
        )}
      </div>
    </Modal>
  );
};

export default LoanCategoryModal;