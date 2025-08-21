import { useRef, useState, useEffect } from "react";
import {
  Typography,
  Button,
  Input,
  Form,
  Row,
  Col,
  notification,
  Spin,
} from "antd";
import SignaturePad from "react-signature-canvas";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { submitOnboardingStep2Action } from "../../../../../services/Store/OnBoarding/action";
import { getStorage, setStorage } from "../../../../../utils/commonfunction";
import { IMAGE_BASE_URL } from "../../../../../utils/constant";

const { Text, Title } = Typography;

const ContractAgreement = ({
  onNext,
  setCurrentStep,
  setOnboardingProcess,
}) => {
  // Redux dispatch and navigation
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { userForEdit } = useSelector((state) => state?.usersmanagement);

  // User data state
  const [userData, setUserData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfLoading, setPdfLoading] = useState(true);

  // Form instance
  const [form] = Form.useForm();

  // Get user data from cookies or local storage
  useEffect(() => {
    // Get user data from wherever it's stored (cookies, localStorage, etc.)
    const userDataFromStorage = getStorage("user", true);

    setUserData(userDataFromStorage);
    // console.log("pdfurluserforedit", userForEdit);
    // Set PDF URL from user data if available
    if (userForEdit?.onboarding?.onboarding_details?.pdf_cdn) {
      const cdnUrl = `${IMAGE_BASE_URL}/${userForEdit.onboarding.onboarding_details.pdf_cdn}`;
      // console.log("Setting PDF URL from storage:", cdnUrl);
      setPdfUrl(cdnUrl);
    }

    // Set onboarding process value
    if (userDataFromStorage?.onboarding?.onboarding_process) {
      // console.log(
      //   "Onboarding process from storage:",
      //   userDataFromStorage?.onboarding?.onboarding_process
      // );
    }

    // Pre-fill form with user data if available
    if (userDataFromStorage?.user) {
      form.setFieldsValue({
        nmls_number: userDataFromStorage.user.nmls_number,
        phone_number: userDataFromStorage.user.phone_number,
      });
    }
  }, [form, userForEdit]);

  // Signature pad state and refs
  const sigCanvas = useRef({});
  const [signature, setSignature] = useState("");
  const [isSigned, setIsSigned] = useState(false);

  // Form submission handler
  const handleSubmit = async (values) => {
    if (isSigned) {
      setSubmitting(true);
      try {
        // Get signature data URL and convert white to black
        const whiteSignatureDataURL = sigCanvas.current.toDataURL();
        const blackSignature = await convertWhiteToBlackSignature(
          whiteSignatureDataURL
        );

        // Make sure we have user data
        if (!userData || !userData.user) {
          throw new Error("User data not available");
        }

        // Prepare payload with form values and BLACK signature
        const payload = {
          user_id: userData.user.id,
          nmls_number: values.nmls_number,
          phone_number: values.phone_number,
          contract_agreement_sign: blackSignature, // Using the black version
        };

        // Dispatch the action to submit the form data
        dispatch(submitOnboardingStep2Action(payload))
          .then((res) => {
            // console.log("res contract sign", res);

            if (res?.payload?.meta?.status === 200) {
              // IMPORTANT FIX: Update user data and PDF URL immediately
              if (res?.payload?.data) {
                // Update local storage
                setStorage("user", res?.payload?.data);

                // Update state with latest user data
                // setUserData(res?.payload?.data);

                // CRITICAL FIX: Update PDF URL immediately if available
                if (
                  res?.payload?.data?.onboarding?.onboarding_details?.pdf_cdn
                ) {
                  const newPdfUrl = `${IMAGE_BASE_URL}/${res.payload.data.onboarding.onboarding_details.pdf_cdn}`;
                  // console.log("Updating PDF URL after submission:", newPdfUrl);
                  setPdfUrl(newPdfUrl);
                  // console.log("here1");
                  // Force reload of PDF by temporarily clearing and resetting
                  setPdfLoading(true);
                }

                // Update onboarding step and process
                if (
                  setCurrentStep &&
                  res?.payload?.data?.user_detail?.onboarding_step
                ) {
                  // console.log(
                  //   "Setting current step:",
                  //   Number(res?.payload?.data?.user_detail?.onboarding_step)
                  // );
                  setCurrentStep(
                    Number(res?.payload?.data?.user_detail?.onboarding_step)
                  );
                }

                if (
                  setOnboardingProcess &&
                  res?.payload?.data?.user_detail?.onboarding_process
                ) {
                  // console.log(
                  //   "Setting onboarding process:",
                  //   Number(res?.payload?.data?.user_detail?.onboarding_process)
                  // );
                  setOnboardingProcess(
                    Number(res?.payload?.data?.user_detail?.onboarding_process)
                  );
                }

                // Call onNext with updated data if provided
                if (
                  onNext &&
                  res?.payload?.data?.user_detail?.onboarding_process
                ) {
                  onNext(
                    Number(res?.payload?.data?.user_detail?.onboarding_process)
                  );
                }

                // // Show success notification
                // notification.success({
                //   message: "Success",
                //   description: "Contract agreement signed successfully",
                //   duration: 3,
                // });
              }
            } else {
              notification.error({
                message: "Error",
                description:
                  res?.payload?.meta?.message ||
                  "Failed to submit contract agreement",
                duration: 3,
              });
            }
          })
          .catch((error) => {
            console.error("Error submitting contract agreement:", error);
            notification.error({
              message: "Error",
              description: "An unexpected error occurred",
              duration: 3,
            });
          })
          .finally(() => {
            setSubmitting(false);
          });
      } catch (error) {
        console.error("Error preparing contract agreement submission:", error);
        notification.error({
          message: "Error",
          description:
            "An unexpected error occurred while preparing submission",
          duration: 3,
        });
        setSubmitting(false);
      }
    } else {
      notification.warning({
        message: "Signature Required",
        description: "Please sign the agreement before submitting",
        duration: 3,
      });
    }
  };

  // Clear the signature pad
  const clear = () => {
    sigCanvas.current.clear();
    setIsSigned(false);
    setSignature("");
  };

  const convertWhiteToBlackSignature = (dataURL) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");

        // Draw the original white signature
        ctx.drawImage(img, 0, 0);

        // Get pixel data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Convert white (RGB=255,255,255) to black (RGB=0,0,0)
        for (let i = 0; i < data.length; i += 4) {
          // Check if pixel is not fully transparent
          if (data[i + 3] > 0) {
            // Set to black (R,G,B = 0)
            data[i] = 0; // R
            data[i + 1] = 0; // G
            data[i + 2] = 0; // B
            // Keep original alpha (transparency)
          }
        }

        // Apply modified data
        ctx.putImageData(imageData, 0, 0);

        // Return transparent PNG (not JPEG)
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = dataURL;
    });
  };

  // Check if signature pad has been used
  const handleSignatureEnd = () => {
    if (!sigCanvas.current.isEmpty()) {
      setIsSigned(true);
      setSignature(sigCanvas.current.toDataURL());
    } else {
      setIsSigned(false);
    }
  };

  // Handle PDF loading events
  const handlePdfLoad = () => {
    // console.log("here2");
    setPdfLoading(false);
  };

  // Handle iframe error (add this to detect PDF loading issues)
  const handlePdfError = () => {
    console.error("PDF iframe failed to load properly");
    // console.log("here3");
    setPdfLoading(false);
    // Optionally show an error message to the user
  };

  // If pdfUrl changes, reset loading state to true
  useEffect(() => {
    // console.log("before here4");
    if (pdfUrl) {
      // console.log("PDF URL changed, resetting loading state");
      // console.log("here4");
      setPdfLoading(true);
    }
  }, [pdfUrl]);

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      onFinish={handleSubmit}
      initialValues={{
        nmls_number: "",
        phone_number: "",
      }}
    >
      <Row gutter={[24, 24]} className="h-full">
        {/* Contract document - PDF viewer using iframe */}
        <Col xs={24} lg={14} className="mb-4 lg:mb-0">
          <div className="bg-gray rounded-3xl shadow-sm h-full relative">
            {pdfLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray z-10 rounded-3xl">
                <Spin size="large" tip="Loading PDF Document..." />
              </div>
            )}
            {pdfUrl ? (
              <iframe
                title="Contract Agreement PDF"
                src={pdfUrl}
                width="100%"
                className="w-full h-[500px] lg:h-full border-0 bg-white rounded-3xl"
                onLoad={handlePdfLoad}
                onError={handlePdfError}
                style={{
                  position: pdfLoading ? "absolute" : "relative",
                  opacity: pdfLoading ? 0 : 1,
                }}
              >
                <Text className="text-white">
                  Your browser does not support iframes. Please download the PDF
                  to view it.
                </Text>
              </iframe>
            ) : (
              <div className="w-full h-[500px] lg:h-full flex items-center justify-center">
                <Text className="text-white">No PDF document available</Text>
              </div>
            )}
          </div>
        </Col>

        {/* Signature section */}
        <Col xs={24} lg={10}>
          <div className="bg-gray rounded-3xl p-6 h-full">
            <div className="flex flex-col space-y-6">
              {/* <Form.Item
                name="nmls_number"
                label={<Text className="text-grayText">NMLS Number</Text>}
              >
                <Input size="large" className="border-liteGray text-white" />
              </Form.Item>

              <Form.Item
                name="phone_number"
                label={<Text className="text-grayText">Contact Phone</Text>}
              >
                <Input size="large" className="border-liteGray text-white" />
              </Form.Item> */}

              <div className="w-full mt-2">
                <Title level={4}>Digital Signature</Title>
                <Text className="text-grayText block text-lg">
                  Sign below to agree to the contract terms. Your signature
                  confirms acceptance and is legally binding.
                </Text>
              </div>

              <div className="w-full">
                <div className="flex justify-between items-center">
                  <Text className="text-grayText">Draw your signature</Text>
                  <Button
                    type="text"
                    className="text-primary hover:text-white p-0"
                    onClick={clear}
                  >
                    Clear
                  </Button>
                </div>

                {/* Signature Pad Container */}
                <div className="mt-2 rounded-md overflow-hidden">
                  <SignaturePad
                    ref={sigCanvas}
                    canvasProps={{
                      className:
                        "w-full h-56 md:h-64 border border-solid border-liteGray rounded-lg bg-liteGray",
                      style: { borderRadius: "8px" },
                    }}
                    penColor="#FFFFFF" // White pen (visible on dark UI)
                    minWidth={2.5} // Thicker strokes
                    maxWidth={3.5} // Maximum thickness
                    velocityFilterWeight={0.7} // Smoother strokes
                    onEnd={handleSignatureEnd}
                  />
                </div>
              </div>

              <Form.Item className="mt-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  disabled={!isSigned || submitting}
                  loading={submitting}
                >
                  {submitting ? "Processing..." : "Confirm"}
                </Button>
              </Form.Item>
            </div>
          </div>
        </Col>
      </Row>
    </Form>
  );
};

export default ContractAgreement;
