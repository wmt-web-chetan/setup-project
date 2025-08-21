import { Col, Row, Spin, Typography, Alert } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

const MyContracts = () => {
  const { Text, Title } = Typography;
  const { userForEdit } = useSelector((state) => state?.usersmanagement);
  const [pdfLoading, setPdfLoading] = useState(true);
  const iframeRef = useRef(null);
  const [pdfHeight, setPdfHeight] = useState("600px");

  console.log("userForEdit in my contract", userForEdit);

  // Extract contract agreement sign from user details
  const contractAgreementSign = userForEdit?.user?.user_detail?.contract_agreement_sign;
  console.log("contractAgreementSign",contractAgreementSign)
  // Construct the full PDF URL (you may need to adjust the base URL according to your API endpoint)
  const BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL
  const pdfUrl = contractAgreementSign ? `${BASE_URL}/${contractAgreementSign}` : null;

  console.log("Contract Agreement Sign Path:", contractAgreementSign);
  console.log("Full PDF URL:", pdfUrl);

  const handlePdfLoad = () => {
    setPdfLoading(false);
  };

  const handlePdfError = () => {
    setPdfLoading(false);
    console.error("Failed to load PDF");
  };

  useEffect(() => {
    const adjustIframeHeight = () => {
      if (iframeRef.current && !pdfLoading && contractAgreementSign) {
        try {
          // Set a reasonable initial height
          setPdfHeight("800px");

          // Use window.innerHeight to make iframe take up most of the viewport height
          const viewportHeight = window.innerHeight;
          const adjustedHeight = Math.max(800, viewportHeight - 200);
          setPdfHeight(`${adjustedHeight}px`);
        } catch (error) {
          console.error("Error adjusting iframe height:", error);
        }
      }
    };

    // Adjust height when PDF loads
    if (!pdfLoading && contractAgreementSign) {
      adjustIframeHeight();
    }

    // Add event listener for window resize
    window.addEventListener("resize", adjustIframeHeight);

    // Clean up
    return () => {
      window.removeEventListener("resize", adjustIframeHeight);
    };
  }, [pdfLoading, contractAgreementSign]);

  // Show message if no contract is available
  if (!contractAgreementSign) {
    return (
      <Row>
        <Col span={24}>
          <Alert
            message="No Contract Available"
            description="No signed contract agreement found for this user."
            type="info"
            showIcon
            className="mb-4"
          />
        </Col>
      </Row>
    );
  }

  return (
    <Row>
      <Col span={24} className="w-full">
        <div className="mb-4">
          <Title level={4}>My Contract</Title>
          {/* <Text type="secondary">
            Signed Contract: {contractAgreementSign.split('/').pop()}
          </Text> */}
        </div>

        {pdfLoading && (
          <div className="flex justify-center items-center py-32">
            <Spin size="large" />
            <Text className="ml-3">Loading PDF...</Text>
          </div>
        )}

        {/* PDF viewer container with enhanced styling */}
        <div className="w-full bg-white rounded-lg shadow-md">
          <iframe
            ref={iframeRef}
            title="Contract Agreement PDF"
            src={`${pdfUrl}#view=FitH`}
            width="100%"
            height={pdfHeight}
            className="w-full border-0 bg-white rounded-lg"
            onLoad={handlePdfLoad}
            onError={handlePdfError}
            style={{
              position: pdfLoading ? "absolute" : "relative",
              opacity: pdfLoading ? 0 : 1,
              minHeight: "800px",
              border: "none",
            }}
          >
            <Text className="text-white">
              Your browser does not support iframes. Please download the PDF to
              view it.
            </Text>
          </iframe>
        </div>

        {/* Download button for backup access */}
        <div className="mt-4 flex justify-between items-center">
          {/* <div className="flex items-center">
            <Text type="secondary" className="text-sm">
              Contract Path: {contractAgreementSign}
            </Text>
          </div> */}
          <div className="flex gap-4">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              download="contract_agreement.pdf"
              className="text-primary hover:underline flex items-center"
            >
              <span className="mr-2">📄</span>
              <Text>Open PDF in new tab</Text>
            </a>
            {/* <a
              href={pdfUrl}
              download="signed_contract_agreement.pdf"
              className="text-primary hover:underline flex items-center"
            >
              <span className="mr-2">⬇️</span>
              <Text>Download PDF</Text>
            </a> */}
          </div>
        </div>
      </Col>
    </Row>
  );
};

export default MyContracts;