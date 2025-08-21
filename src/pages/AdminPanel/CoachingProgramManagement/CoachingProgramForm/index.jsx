import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  Form,
  Input,
  Button,
  Row,
  Col,
  Divider,
  Spin,
  Upload,
  message,
  Switch,
} from "antd";
import { PlusOutlined, LoadingOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import JoditEditor from "jodit-react";
import {
  addCoachingProgram,
  fetchCoachingProgramById,
  updateCoachingProgramAction,
} from "../../../../services/Store/CoachingProgram/action";
import ShadowBoxContainer from "../../../../components/AuthLayout/ShadowBoxContainer";
import Loading from "../../../../components/AuthLayout/Loading";

const { Text, Title } = Typography;

const CoachingProgramForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { CProgramid } = useParams(); // Get CProgramid from URL if editing
  const [form] = Form.useForm();

  // Check if we're in admin mode based on current path
  const isAdminMode = location.pathname.includes("/admin/");

  const [initialValues, setInitialValues] = useState();
  const [thumbnailFileList, setThumbnailFileList] = useState([]);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  // JoditEditor state and ref for detail page only
  const [detailPageContent, setDetailPageContent] = useState("");
  const detailPageEditorRef = useRef(null);
  const [status, setStatus] = useState(false);

  // Get loading states from Redux store
  const {
    createCoachingProgramLoading,
    singleCoachingProgramLoading,
    updateCoachingProgramLoading,
  } = useSelector((state) => state?.coachingPrograms || {});
  const { singleCoachingProgram } = useSelector(
    (state) => state?.coachingPrograms || {}
  );

  // Determine if we're in editing mode
  const isEditing = !!CProgramid;

  // Determine if we're in loading state based on the operation
  const isLoading = isEditing
    ? updateCoachingProgramLoading
    : createCoachingProgramLoading;

  // Helper functions for dynamic navigation
  const getDashboardLink = () => {
    return isAdminMode ? "/admin" : "/dashboard";
  };

  const getCoachingProgramManagementLink = () => {
    return isAdminMode
      ? "/admin/coaching-program-management"
      : "/coaching-program-management";
  };

  // JoditEditor configuration for detail page
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
  };

  // Handle detail page editor changes
  const handleDetailPageChange = (content) => {
    setDetailPageContent(content);
    form.setFieldsValue({ detail_page: content });
  };

  // Initialize form for new coaching program
  useEffect(() => {
    // console.log("Component mounted, isEditing:", isEditing);
    if (!isEditing) {
      form.resetFields();
      setDetailPageContent("");
    }
  }, [isEditing, form]);

  // Fetch coaching program data for editing
  useEffect(() => {
    // console.log("isEditing:", isEditing);
    if (isEditing) {
      dispatch(fetchCoachingProgramById(CProgramid)).then((res) => {
        if (res?.payload?.meta?.success === true) {
          const coachingProgramData = res?.payload?.data?.coaching_program;
          setInitialValues(coachingProgramData);

          // Set detail page content for JoditEditor
          setDetailPageContent(coachingProgramData?.detail_page || "");
        }
      });
    }
  }, [dispatch, isEditing, CProgramid]);

  // Update form when initialValues change
  useEffect(() => {
    if (initialValues) {
      // Set form values
      form.setFieldsValue(initialValues);

      // Set thumbnail file list if editing and thumbnail exists
      if (initialValues.thumbnail_img) {
        setThumbnailFileList([
          {
            uid: "-1",
            name: "thumbnail.png",
            status: "done",
            url: `${import.meta.env.VITE_IMAGE_BASE_URL}/${
              initialValues.thumbnail_img
            }`,
          },
        ]);
      }
    }
  }, [initialValues, form]);

  // Handle thumbnail upload
  const handleThumbnailChange = (info) => {
    setThumbnailFileList(info.fileList);

    if (info.file.status === "uploading") {
      setThumbnailUploading(true);
      return;
    }
    if (info.file.status === "done") {
      setThumbnailUploading(false);
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === "error") {
      setThumbnailUploading(false);
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  // Custom upload function (replace with actual upload logic)
  const customUpload = ({ file, onSuccess, onError }) => {
    // Mock upload - replace with actual file upload logic
    setTimeout(() => {
      onSuccess("ok");
    }, 1000);
  };

  // Before upload validation
  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG file!");
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Image must smaller than 2MB!");
      return false;
    }
    return true;
  };

  const uploadButton = (
    <div>
      {thumbnailUploading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload Thumbnail</div>
    </div>
  );

  // Handle form submission
  const handleSubmit = (values) => {
    // console.log("=== HANDLESUBMIT CALLED ===");
    // console.log("Form submitted with values:", values);
    // console.log("Detail Page content:", detailPageContent);
    // console.log("Thumbnail file list:", thumbnailFileList);

    // Create FormData to handle both regular data and file upload
    const formData = new FormData();

    // Add regular form fields
    formData.append("name", values.name);
    formData.append("academy_name", values.academy_name);
    formData.append("website_url", values.website_url || "");
    formData.append("about_us", values.about_us || "");
    formData.append("email", values.email);
    formData.append("instagram_url", values.instagram_url || "");
    formData.append("youtube_url", values.youtube_url || "");
    formData.append("linkedin_url", values.linkedin_url || "");
    formData.append("is_active", status ? 1 : 0);
    formData.append("x_url", values.x_url || "");
    formData.append("detail_page", detailPageContent || "");

    // Add thumbnail file if exists
    if (thumbnailFileList.length > 0) {
      const thumbnailFile = thumbnailFileList[0];

      if (thumbnailFile.originFileObj) {
        // New file selected (for both create and update)
        formData.append("thumbnail_img", thumbnailFile.originFileObj);
        // console.log(
        //   "Adding new thumbnail file:",
        //   thumbnailFile.originFileObj.name
        // );
      } else if (isEditing && thumbnailFile.url) {
        // Existing file in edit mode - send the current path/URL
        formData.append("existing_thumbnail", thumbnailFile.url);
        // console.log("Keeping existing thumbnail:", thumbnailFile.url);
      }
    } else if (isEditing) {
      // No thumbnail selected in edit mode - keep existing or remove
      formData.append("remove_thumbnail", "false"); // or 'true' if you want to remove it
    }

    // Add ID for update
    if (isEditing) {
      formData.append("id", CProgramid);
    }


    if (isEditing) {
      // Update existing coaching program
      dispatch(updateCoachingProgramAction(formData))
        .then((result) => {
          // console.log("Update API Response:", result);
          if (result.payload?.meta?.success) {
            navigate(getCoachingProgramManagementLink());
          } else {
            const errorMessage =
              result.payload?.meta?.message ||
              "Failed to update coaching program. Please try again.";
            console.error("Update coaching program error:", errorMessage);
          }
        })
        .catch((error) => {
          console.error("Update coaching program exception:", error);
        });
    } else {
      // Create new coaching program
      dispatch(addCoachingProgram(formData))
        .then((result) => {
          // console.log("Create API Response:", result);
          if (result.payload?.meta?.success) {
            navigate(getCoachingProgramManagementLink());
          } else {
            const errorMessage =
              result.payload?.meta?.message ||
              "Failed to create coaching program. Please try again.";
            console.error("Create coaching program error:", errorMessage);
          }
        })
        .catch((error) => {
          console.error("Create coaching program exception:", error);
        });
    }
  };

  // Handle cancel - navigate back to coaching programs list
  const handleCancel = () => {
    navigate(getCoachingProgramManagementLink());
  };

  const validateThumbnail = (_, value) => {
    return new Promise((resolve, reject) => {
      if (thumbnailFileList.length === 0) {
        reject(new Error("Please upload a program thumbnail!"));
      } else {
        resolve();
      }
    });
  };

  const onChangeSwitch = (checked) => {
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
              to={getCoachingProgramManagementLink()}
              className="text-primary hover:text-primary flex justify-center"
            >
              <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
                Coaching Programs
              </Text>
            </Link>
            <Text className="text-grayText mx-2">
              {" "}
              <i className="icon-right-arrow" />{" "}
            </Text>
            <Text className="text-white text-lg sm:text-2xl">
              {isEditing ? "Edit Coaching Program" : "Create Coaching Program"}
            </Text>
          </Title>
        </div>
      </Col>

      <Col span={24} className="h-full mb-4">
        <ShadowBoxContainer height="80vh">
          {!isEditing || (initialValues && !singleCoachingProgramLoading) ? (
            <div className="h-full p-6">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                onFinishFailed={(errorInfo) => {
                  // console.log("Form validation failed:", errorInfo);
                  // console.log("Failed fields:", errorInfo.errorFields);
                  // message.error("Please check the form for errors");
                }}
                className="w-full"
                size="large"
                requiredMark={false}
              >
                <Row gutter={[24, 0]} className="wrapperFormContent">
                  <Col xs={24} className="">
                    <Row gutter={[24, 16]} className="flex flex-wrap">
                      <Col span={24}>
                        <Divider orientation="left" className="my-2 md:my-4">
                          <Text className="text-grayText">
                            Basic Information
                          </Text>
                        </Divider>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item
                          label={<Text type="secondary">Program Name</Text>}
                          name="name"
                          rules={[
                            {
                              required: true,
                              message: "Please enter program name!",
                            },
                            {
                              whitespace: true,
                              message:
                                "Program Name Cannot Contain Only Whitespace!",
                            },
                            {
                              min: 2,
                              message:
                                "Program name must be at least 2 characters!",
                            },
                            {
                              max: 150,
                              message:
                                "Program name cannot exceed 150 characters!",
                            },
                          ]}
                        >
                          <Input
                            placeholder="Enter Program Name"
                            autoComplete="off"
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item
                          label={<Text type="secondary">Academy Name</Text>}
                          name="academy_name"
                          rules={[
                            {
                              required: true,
                              message: "Please enter academy name!",
                            },
                            {
                              whitespace: true,
                              message:
                                "Academy Name Cannot Contain Only Whitespace!",
                            },
                            {
                              min: 2,
                              message:
                                "Academy name must be at least 2 characters!",
                            },
                            {
                              max: 150,
                              message:
                                "Academy name cannot exceed 150 characters!",
                            },
                          ]}
                        >
                          <Input
                            placeholder="Enter Academy Name"
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
                              message: "Please enter email address!",
                            },
                            {
                              type: "email",
                              message: "Please enter a valid email address!",
                            },
                          ]}
                        >
                          <Input
                            placeholder="Enter Email Address"
                            autoComplete="off"
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item
                          label={<Text type="secondary">Website URL</Text>}
                          name="website_url"
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

                      <Col xs={24} md={12}>
                        <Form.Item
                          label={
                            <Text type="secondary">Program Thumbnail</Text>
                          }
                          name="thumbnail_img"
                          rules={[
                            {
                              required: true,
                              validator: validateThumbnail,
                            },
                          ]}
                        >
                          <Upload
                            name="thumbnail"
                            listType="picture-card"
                            className="avatar-uploader"
                            showUploadList={true}
                            fileList={thumbnailFileList}
                            customRequest={customUpload}
                            beforeUpload={beforeUpload}
                            onChange={handleThumbnailChange}
                            maxCount={1}
                          >
                            {thumbnailFileList?.length >= 1
                              ? null
                              : uploadButton}
                          </Upload>
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

                      <Col xs={24}>
                        <Form.Item
                          label={<Text type="secondary">About Us</Text>}
                          name="about_us"
                          rules={[
                            {
                              required: true,
                              message: "Please enter about us information!",
                            },
                            {
                              whitespace: true,
                              message:
                                "About Us cannot contain only whitespace!",
                            },
                            {
                              min: 10,
                              message:
                                "About Us must be at least 10 characters!",
                            },
                          ]}
                        >
                          <Input.TextArea
                            placeholder="Enter about us information..."
                            rows={6}
                            showCount
                            maxLength={2000}
                          />
                        </Form.Item>
                      </Col>

                      <Col span={24}>
                        <Divider orientation="left" className="my-2 md:my-4">
                          <Text className="text-grayText">
                            Social Media Links
                          </Text>
                        </Divider>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item
                          label={<Text type="secondary">Instagram URL</Text>}
                          name="instagram_url"
                          rules={[
                            {
                              type: "url",
                              message: "Please enter a valid URL!",
                            },
                          ]}
                        >
                          <Input
                            placeholder="https://instagram.com/username"
                            autoComplete="off"
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item
                          label={<Text type="secondary">YouTube URL</Text>}
                          name="youtube_url"
                          rules={[
                            {
                              type: "url",
                              message: "Please enter a valid URL!",
                            },
                          ]}
                        >
                          <Input
                            placeholder="https://youtube.com/channel"
                            autoComplete="off"
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item
                          label={<Text type="secondary">LinkedIn URL</Text>}
                          name="linkedin_url"
                          rules={[
                            {
                              type: "url",
                              message: "Please enter a valid URL!",
                            },
                          ]}
                        >
                          <Input
                            placeholder="https://linkedin.com/company/name"
                            autoComplete="off"
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item
                          label={<Text type="secondary">X (Twitter) URL</Text>}
                          name="x_url"
                          rules={[
                            {
                              type: "url",
                              message: "Please enter a valid URL!",
                            },
                          ]}
                        >
                          <Input
                            placeholder="https://x.com/username"
                            autoComplete="off"
                          />
                        </Form.Item>
                      </Col>

                      <Col span={24}>
                        <Divider orientation="left" className="my-2 md:my-4">
                          <Text className="text-grayText">
                            Detail Page Content
                          </Text>
                        </Divider>
                      </Col>

                      <Col xs={24}>
                        <Form.Item
                          label={<Text type="secondary">Content</Text>}
                          name="detail_page"
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
                                background-color: #ffffff !important;
                              }
                              .jodit-editor-wrapper .jodit-workplace {
                                color: #000000 !important;
                                background-color: #ffffff !important;
                              }
                              .jodit-editor-wrapper .jodit-container:not(.jodit_inline) .jodit-wysiwyg {
                                color: #000000 !important;
                                background-color: #ffffff !important;
                              }
                              .jodit-editor-wrapper .jodit-wysiwyg * {
                                color: #000000 !important;
                              }
                              .jodit-editor-wrapper .jodit-wysiwyg p {
                                color: #000000 !important;
                                margin: 0 0 10px 0;
                              }
                              .jodit-editor-wrapper .jodit-wysiwyg div {
                                color: #000000 !important;
                              }
                              .jodit-editor-wrapper .jodit-wysiwyg h1,
                              .jodit-editor-wrapper .jodit-wysiwyg h2,
                              .jodit-editor-wrapper .jodit-wysiwyg h3,
                              .jodit-editor-wrapper .jodit-wysiwyg h4,
                              .jodit-editor-wrapper .jodit-wysiwyg h5,
                              .jodit-editor-wrapper .jodit-wysiwyg h6 {
                                color: #000000 !important;
                              }
                              .jodit-editor-wrapper .jodit-wysiwyg span {
                                color: inherit !important;
                              }
                              .jodit-editor-wrapper iframe {
                                background-color: #ffffff !important;
                              }
                            `}
                            </style>
                            <JoditEditor
                              ref={detailPageEditorRef}
                              value={detailPageContent}
                              config={{
                                ...editorConfig,
                                placeholder: "Enter detail page content...",
                              }}
                              onBlur={handleDetailPageChange}
                            />
                          </div>
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
                          onClick={() => {
                            // console.log("Submit button clicked");
                            // console.log("Form instance:", form);
                            // console.log(
                            //   "Current form values:",
                            //   form.getFieldsValue()
                            // );
                          }}
                          className="rounded-lg shadow-md w-full sm:w-auto order-1 sm:order-2 mb-3 sm:mb-0"
                        >
                          {isEditing
                            ? "Update Coaching Program"
                            : "Create Coaching Program"}
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

export default CoachingProgramForm;