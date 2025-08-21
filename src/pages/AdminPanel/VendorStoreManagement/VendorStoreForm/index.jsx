import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  Form,
  Input,
  Switch,
  Button,
  Row,
  Col,
  Divider,
  Spin,
  Upload,
  message,
  Select,
  Tag,
} from "antd";
import {
  PlusOutlined,
  LoadingOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import JoditEditor from "jodit-react";
import ShadowBoxContainer from "../../../../components/AuthLayout/ShadowBoxContainer";
import Loading from "../../../../components/AuthLayout/Loading";
import {
  addVendor,
  fetchVendorStoreCategories,
  updateVendorAction,
  fetchVendorById,
} from "../../../../services/Store/VendorAdmin/action";

const { Text, Title } = Typography;

const VendorManagementForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { vendorId } = useParams(); // Get vendorId from URL if editing
  const [form] = Form.useForm();
  const [initialValues, setInitialValues] = useState();
  const [logoFileList, setLogoFileList] = useState([]);
  const [logoUploading, setLogoUploading] = useState(false);
  const [status, setStatus] = useState(false);

  // JoditEditor state and ref for description
  const [descriptionContent, setDescriptionContent] = useState("");
  const descriptionEditorRef = useRef(null);
  const isAdminMode = location.pathname.includes("/admin/");

  // Category search states
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categorySearchValue, setCategorySearchValue] = useState("");
  const categorySearchTimeoutRef = useRef(null);

  // Get loading states from Redux store
  const {
    createVendorLoading,
    updateVendorLoading,
    vendorCategoriesLoading,
    singleVendorLoading,
  } = useSelector((state) => state?.vendorStoreCategories || {});
  const { vendorCategories, singleVendor } = useSelector(
    (state) => state?.vendorStoreCategories || {}
  );
  // console.log("vendorId", vendorId);
  // Determine if we're in editing mode
  const isEditing = !!vendorId;

  // Determine if we're in loading state based on the operation
  const isLoading = isEditing ? updateVendorLoading : createVendorLoading;

  // JoditEditor configuration
  const editorConfig = {
    readonly: false,
    toolbar: true,
    spellcheck: true,
    language: "en",
    toolbarButtonSize: "medium",
    toolbarAdaptive: false,
    showCharsCounter: true,
    showWordsCounter: true,
    showXPathInStatusbar: false,
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    buttons: [
      "bold",
      "strikethrough",
      "underline",
      "italic",
      "|",
      "superscript",
      "subscript",
      "|",
      "align",
      "|",
      "ul",
      "ol",
      "outdent",
      "indent",
      "|",
      "font",
      "fontsize",
      "brush",
      "paragraph",
      "|",
      "link",
      "table",
      "|",
      "hr",
      "eraser",
      "copyformat",
      "|",
      "fullsize",
      "selectall",
      "|",
      "source",
      "preview",
    ],
    uploader: {
      insertImageAsBase64URI: true,
    },
    width: "100%",
    height: 300,
    placeholder: "Enter vendor description...",
  };

  // Handle description editor changes
  const handleDescriptionChange = (content) => {
    setDescriptionContent(content);
    // Update form field value
    form.setFieldsValue({ description: content });
  };
  useEffect(() => {
    // Fetch all categories initially (without search parameter to get all)
    if (!isEditing) {
      dispatch(fetchVendorStoreCategories());
    }
  }, [dispatch, isEditing]);
  // Update category options when vendor store categories data changes
  useEffect(() => {
    // console.log("vendorCategories", vendorCategories);
    if (
      vendorCategories?.data?.categories &&
      Array.isArray(vendorCategories?.data?.categories)
    ) {
      const newCategoryOptions = vendorCategories.data.categories.map(
        (category) => ({
          id: category?.id,
          name: category?.name || "Unnamed Category",
        })
      );
      // console.log("here");
      // Always preserve previously selected categories by merging them
      setCategoryOptions((prevOptions) => {
        const allCategories = [...selectedCategories, ...newCategoryOptions];
        // Remove duplicates based on ID
        const uniqueCategories = allCategories.filter(
          (category, index, array) =>
            array.findIndex((c) => c.id === category.id) === index
        );
        // console.log("uniqueCategories", uniqueCategories);
        return uniqueCategories;
      });
    }
  }, [vendorCategories, selectedCategories]);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (categorySearchTimeoutRef.current) {
        clearTimeout(categorySearchTimeoutRef.current);
      }
    };
  }, []);

  // Fetch vendor data for editing
  useEffect(() => {
    // console.log("isEditing", isEditing);
    if (isEditing) {
      dispatch(fetchVendorById(vendorId)).then((res) => {
        if (res?.payload?.meta?.status === 200) {
          const vendorData = res?.payload?.data;
          // console.log("vendorData", vendorData);
          setInitialValues(vendorData);
          setStatus(vendorData?.is_active ? true : false);

          // Set description content for JoditEditor
          setDescriptionContent(vendorData?.description || "");

          // Set selected categories if they exist
          if (vendorData?.categories && Array.isArray(vendorData.categories)) {
            const categoryIds = vendorData.categories.map((cat) => cat.id);
            const categoryObjects = vendorData.categories.map((cat) => ({
              id: cat.id,
              name: cat.name,
            }));

            setSelectedCategories(categoryObjects);
            setCategoryOptions(categoryObjects);
          }

          // Also fetch all categories for editing mode
          dispatch(fetchVendorStoreCategories({}));
        }
      });
    } else {
      // Reset form for new vendors
      form.resetFields();
      form.setFieldsValue({
        is_preferred: false,
      });
      setSelectedCategories([]);
      setDescriptionContent(""); // Reset description content
    }
  }, [dispatch, isEditing, vendorId, form]);

  // Update form when initialValues change
  useEffect(() => {
    if (initialValues) {
      // Format the form values
      const formValues = {
        ...initialValues,
        // Convert categories array to array of IDs for the form
        categories: initialValues.categories?.map((cat) => cat.id) || [],
      };

      form.setFieldsValue(formValues);

      // Set logo file list if editing and logo exists
      if (initialValues.logo_path) {
        setLogoFileList([
          {
            uid: "-1",
            name: "logo.png",
            status: "done",
            url: `${import.meta.env.VITE_IMAGE_BASE_URL}/${initialValues.logo_path
              }`,
          },
        ]);
      }
    }
  }, [initialValues, form]);
  const truncateName = (name) => {
    if (!name) return "";
    if (name.length <= 7) return name;
    return name.substring(0, 7) + "...";
  };
  // Handle logo upload
  const handleLogoChange = (info) => {
    // console.log("Upload info:", info);

    // Filter out invalid files
    const validFiles = info.fileList.filter((file) => {
      if (file.status === "error") return false;

      // Additional check for file type on the actual file object
      if (file.originFileObj) {
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
          "image/svg+xml",
          "image/bmp",
        ];

        if (!allowedTypes.includes(file.originFileObj.type)) {
          message.error(`${file.name} is not a valid image file!`);
          return false;
        }
      }

      return true;
    });

    setLogoFileList(validFiles);

    if (info.file.status === "uploading") {
      setLogoUploading(true);
      return;
    }
    if (info.file.status === "done") {
      setLogoUploading(false);
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === "error") {
      setLogoUploading(false);
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  // Custom upload function (replace with actual upload logic)
  const customUpload = ({ file, onSuccess, onError }) => {
    // Double-check file type before processing
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/bmp",
    ];

    if (!allowedTypes.includes(file.type)) {
      onError(new Error("Invalid file type"));
      message.error("Only image files are allowed!");
      return;
    }

    // Mock upload - replace with actual file upload logic
    setTimeout(() => {
      onSuccess("ok");
    }, 1000);
  };

  // Before upload validation
  const beforeUpload = (file) => {
    // console.log("File type:", file.type);
    // console.log("File name:", file.name);

    // Check file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/bmp",
    ];

    const isValidImageType = allowedTypes.includes(file.type);

    // Also check file extension as fallback
    const fileName = file.name.toLowerCase();
    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".svg",
      ".bmp",
    ];
    const hasValidExtension = allowedExtensions.some((ext) =>
      fileName.endsWith(ext)
    );

    if (!isValidImageType || !hasValidExtension) {
      message.error(
        "Only image files (JPG, PNG, GIF, WEBP, SVG, BMP) are allowed!"
      );
      return Upload.LIST_IGNORE; // This prevents the file from being added to the list
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Image must be smaller than 2MB!");
      return Upload.LIST_IGNORE;
    }

    return true;
  };
  // Helper functions for dynamic navigation
  const getDashboardLink = () => {
    return isAdminMode ? "/admin" : "/dashboard";
  };

  const getVendorStoreManagementLink = () => {
    return isAdminMode
      ? "/admin/vendor-store-management"
      : "/vendor-store-management";
  };
  // Handle category search with debouncing
  const handleCategorySearch = (value) => {
    // Clear any existing timeout
    if (categorySearchTimeoutRef.current) {
      clearTimeout(categorySearchTimeoutRef.current);
    }

    // Set a new timeout (debounce by 500ms)
    categorySearchTimeoutRef.current = setTimeout(() => {
      const trimmedValue = value?.trim();
      setCategorySearchValue(trimmedValue);

      if (trimmedValue && trimmedValue.length >= 3) {
        // Search for specific categories
        dispatch(fetchVendorStoreCategories({ search: trimmedValue }));
      } else if (!trimmedValue || trimmedValue.length === 0) {
        // When search is cleared, fetch all categories again
        dispatch(fetchVendorStoreCategories({}));
      }
      // For 1-2 characters, we keep the current categories and don't make API call
    }, 500);
  };
  const handleCategoryDropdownOpen = () => {
    // If we don't have any categories or only have selected ones, fetch all
    if (
      categoryOptions.length === 0 ||
      (selectedCategories.length > 0 &&
        categoryOptions.length === selectedCategories.length)
    ) {
      dispatch(fetchVendorStoreCategories());
    }
  };

  // Handle category selection change
  const handleCategoryChange = (selectedValues) => {
    const selectedCategoryObjects = selectedValues
      ?.map((id) => {
        return categoryOptions.find((category) => category?.id === id);
      })
      .filter(Boolean);

    setSelectedCategories(selectedCategoryObjects);
    form.setFieldsValue({ categories: selectedValues });
  };

  const uploadButton = (
    <div>
      {logoUploading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload Logo</div>
    </div>
  );

  // Handle form submission
  const handleSubmit = (values) => {
    // Validate logo file type before submission
    if (logoFileList.length > 0 && logoFileList[0].originFileObj) {
      const file = logoFileList[0].originFileObj;
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
        "image/bmp",
      ];

      if (!allowedTypes.includes(file.type)) {
        message.error("Please upload a valid image file for the logo!");
        return;
      }
    }

    // Create FormData object
    const formData = new FormData();

    // Append form fields to FormData
    formData.append("vendor_name", values.vendor_name);
    formData.append("website", values.website || "");
    formData.append("description", descriptionContent || "");
    formData.append("is_preferred", values.is_preferred ? 1 : 0);
    formData.append("is_active", status ? 1 : 0);

    // Append selected categories
    if (values.categories && values.categories.length > 0) {
      values.categories.forEach((categoryId, index) => {
        formData.append(`categories[${index}]`, categoryId);
      });
    }

    // Add logo if uploaded and valid
    if (logoFileList.length > 0 && logoFileList[0].originFileObj) {
      formData.append("logo", logoFileList[0].originFileObj);
    }

    // Add vendor ID if editing
    if (isEditing) {
      formData.append("id", vendorId);
    }

    // Rest of the submission logic...
    if (isEditing) {
      dispatch(updateVendorAction(formData))
        .then((result) => {
          if (result.payload?.meta?.success) {
            navigate(getVendorStoreManagementLink());
          } else {
            const errorMessage =
              result.payload?.meta?.message ||
              "Failed to update vendor. Please try again.";
            console.error("Update vendor error:", errorMessage);
          }
        })
        .catch((error) => {
          console.error("Update vendor exception:", error);
        });
    } else {
      dispatch(addVendor(formData))
        .then((result) => {
          if (result.payload?.meta?.success) {
            navigate("/admin/vendor-store-management");
          } else {
            const errorMessage =
              result.payload?.meta?.message ||
              "Failed to create vendor. Please try again.";
            console.error("Create vendor error:", errorMessage);
          }
        })
        .catch((error) => {
          console.error("Create vendor exception:", error);
        });
    }
  };

  // Handle cancel - navigate back to vendors list
  const handleCancel = () => {
    navigate(getVendorStoreManagementLink());
  };
  const validateLogo = (_, value) => {
    return new Promise((resolve, reject) => {
      if (logoFileList?.length === 0) {
        reject(new Error("Please upload a vendor logo!"));
      } else {
        // Additional validation for file type
        const file = logoFileList[0];
        if (file?.originFileObj) {
          const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/svg+xml",
            "image/bmp",
          ];

          if (!allowedTypes.includes(file.originFileObj.type)) {
            reject(new Error("Please upload a valid image file!"));
            return;
          }
        }
        resolve();
      }
    });
  };

  const onChangeSwitch = (checked) => {
    // console.log("checked", checked);
    setStatus(checked);
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
              to={getVendorStoreManagementLink()}
              className="text-primary hover:text-primary flex justify-center"
            >
              <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
                Vendor Management
              </Text>
            </Link>
            <Text className="text-grayText mx-2">
              {" "}
              <i className="icon-right-arrow" />{" "}
            </Text>
            <Text className="text-white text-lg sm:text-2xl">
              {isEditing ? "Edit Vendor" : "Create Vendor"}
            </Text>
          </Title>
        </div>
      </Col>

      <Col span={24} className="h-full mb-4">
        <ShadowBoxContainer height="80vh">
          {!isEditing || (initialValues && !singleVendorLoading) ? (
            <div className="h-full p-6">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={
                  initialValues || {
                    is_preferred: false,
                  }
                }
                className="w-full"
                size="large"
                requiredMark={false}
              >
                <Row gutter={[24, 0]} className="wrapperFormContent">
                  <Col xs={24} className="">
                    <Row gutter={[24, 16]} className="flex flex-wrap">
                      <Col span={24}>
                        <Divider orientation="left" >
                          <Text className="text-grayText">
                            Basic Information
                          </Text>
                        </Divider>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item
                          label={<Text type="secondary">Vendor Name</Text>}
                          name="vendor_name"
                          rules={[
                            {
                              required: true,
                              message: "Please enter vendor name!",
                            },
                            {
                              whitespace: true,
                              message:
                                "Vendor Name Cannot Contain Only Whitespace!",
                            },
                            {
                              min: 2,
                              message:
                                "Vendor name must be at least 2 characters!",
                            },
                            {
                              max: 50,
                              message:
                                "Vendor name cannot exceed 150 characters!",
                            },
                          ]}
                        >
                          <Input
                            placeholder="Enter Vendor Name"
                            autoComplete="off"
                            maxLength={50}
                            showCount
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item
                          label={<Text type="secondary">Website</Text>}
                          name="website"
                          rules={[
                            {
                              type: "url",
                              message: "Please enter a valid URL!",
                            },
                          ]}
                        >
                          <Input
                            placeholder="https://example.com"
                            autoComplete="off"
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24}>
                        <Form.Item
                          label={<Text type="secondary">Description</Text>}
                          name="description"
                        >
                          <div className="jodit-editor-wrapper">
                            <style>
                              {`
                                .jodit-editor-wrapper .jodit-container {
                                  border-radius: 6px;
                                  border: 1px solid #d9d9d9;
                                }
                                .jodit-editor-wrapper .jodit-toolbar__box {
                                  border-top-left-radius: 6px;
                                  border-top-right-radius: 6px;
                                  background-color: #fafafa;
                                }
                                .jodit-editor-wrapper .jodit-wysiwyg {
                                  color: #000000 !important;
                                  background-color: white;
                                }
                                .jodit-editor-wrapper .jodit-workplace {
                                  color: #000000 !important;
                                  background-color: white;
                                }
                                .jodit-editor-wrapper .jodit-container:not(.jodit_inline) .jodit-wysiwyg {
                                  color: #000000 !important;
                                }
                              `}
                            </style>
                            <JoditEditor
                              ref={descriptionEditorRef}
                              value={descriptionContent}
                              config={editorConfig}
                              onBlur={handleDescriptionChange}
                            />
                          </div>
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item
                          label={<Text type="secondary">Vendor Logo</Text>}
                          name="logo"
                          rules={[{ required: true, validator: validateLogo }]}
                        >
                          <Upload
                            name="logo"
                            listType="picture-card"
                            className="avatar-uploader"
                            showUploadList={true}
                            fileList={logoFileList}
                            customRequest={customUpload}
                            beforeUpload={beforeUpload}
                            onChange={handleLogoChange}
                            maxCount={1}
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml,image/bmp"
                          >
                            {logoFileList?.length >= 1 ? null : uploadButton}
                          </Upload>
                        </Form.Item>
                      </Col>

                      <Col span={24}>
                        <Divider orientation="left" >
                          <Text className="text-grayText">
                            Status Information
                          </Text>
                        </Divider>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item
                          name="is_preferred"
                          label={
                            <div className="flex items-center">
                              <Text className="font-medium" type="secondary">
                                Preferred Vendor
                              </Text>
                            </div>
                          }
                          valuePropName="checked"
                        >
                          <Switch
                            checkedChildren="Preferred"
                            unCheckedChildren="Standard"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="is_active"
                          label={
                            <div className="flex items-center">
                              <Text className="font-medium" type="secondary">
                                Status
                              </Text>
                            </div>
                          }
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

                      {/* Categories Section */}
                      <Col span={24}>
                        <Divider orientation="left" >
                          <Text className="text-grayText">Categories</Text>
                        </Divider>
                      </Col>
                      <Col xs={24}>
                        <Form.Item
                          label={
                            <Text type="secondary">Select Categories</Text>
                          }
                          name="categories"
                          rules={[
                            {
                              required: true,
                              message: "Please select at least one category!",
                            },
                          ]}
                        >
                          <Select
                            mode="multiple"
                            placeholder="Search categories... (min. 3 characters for search)"
                            suffixIcon={<SearchOutlined />}
                            style={{ width: "100%" }}
                            onChange={handleCategoryChange}
                            onSearch={handleCategorySearch}
                            onDropdownVisibleChange={(open) => {
                              if (open) {
                                handleCategoryDropdownOpen();
                              }
                            }}
                            optionFilterProp="children"
                            filterOption={false} // Disable client-side filtering since we're doing server-side search
                            options={categoryOptions?.map((category) => ({
                              value: category?.id,
                              label: category?.name || "Unnamed Category",
                            }))}
                            showSearch
                            className="bg-[#171717] border-[#373737] text-white"
                            size="large"
                            maxTagCount={8}
                            loading={vendorCategoriesLoading}
                            notFoundContent={
                              vendorCategoriesLoading
                                ? "Loading..."
                                : categorySearchValue &&
                                  categorySearchValue?.trim().length > 0 &&
                                  categorySearchValue?.trim().length < 3
                                  ? "Please enter at least 3 characters to search"
                                  : categoryOptions?.length === 0
                                    ? "No categories found"
                                    : null
                            }
                            tagRender={(props) => {
                              const { value, closable, onClose } = props;
                              const category =
                                categoryOptions?.find((c) => c?.id === value) ||
                                selectedCategories?.find(
                                  (c) => c?.id === value
                                );
                              // console.log("category", category);
                              return (
                                <Tag
                                  closable={closable}
                                  onClose={onClose}
                                  style={{ marginRight: 3, marginBottom: 3 }}
                                  className="bg-primaryOpacity text-primary border-none"
                                >
                                  {category
                                    ? truncateName(category.name)
                                    : `+${selectedCategories.length - 4}`}
                                  {/* {category?.name?.length > 15
                                    ? category.name.substring(0, 15) + "..."
                                    : `+${category?.length - 10}`} */}
                                </Tag>
                              );
                            }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Col>
                </Row>

                <div className="wrapperFooter mt-6 py-4 border-t border-liteGray">
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
                          {isEditing ? "Update Vendor" : "Create Vendor"}
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

export default VendorManagementForm;
