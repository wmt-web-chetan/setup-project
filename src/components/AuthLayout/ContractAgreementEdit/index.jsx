// ContractAgreementEdit.jsx - Fixed with scroll position preservation and contract switching
import React, { useState, useRef, useEffect } from "react";
import JoditEditor from "jodit-react";
import { Row, Col, Typography, Spin } from "antd";
import { initialContent, initialContent2, initialContent3,initialContent4 } from "../../../helpers/constant";

const { Text, Title } = Typography;

const ContractAgreementEdit = ({
  FacilityName,
  InspectionCompleteDate,
  InspectionEventType,
  Employee,
  persentage,
  onChange,
  contractAgreementSign,
  contractTemplatePath,
  contractTemplateText,
  selectedContract
}) => {
  // Initialize state
  const [data, setData] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfHeight, setPdfHeight] = useState("800px");

  // Refs
  const editorRef = useRef(null);
  const iframeRef = useRef(null);
  const editorContainerRef = useRef(null);
  const scrollPositionRef = useRef(0);

  // Track data flow
  const lastSentValue = useRef("");
  const isInitialized = useRef(false);
  const lastSelectedContract = useRef(null); // Track the last selected contract

  // Format PDF URL
  const pdfUrl = contractTemplatePath || "";

  // Initial setup of content and contract change handler
  useEffect(() => {
    

    // Initialize on first load OR when selectedContract changes
    const shouldInitialize = !isInitialized.current || 
                            (selectedContract !== lastSelectedContract.current && selectedContract);

    if (shouldInitialize) {
      
      let initialValue;
      
      // console.log('okko contractTemplateText',contractTemplateText)
      // console.log('okko selectedContract',selectedContract)

      // Priority: contractTemplateText > selectedContract-based content
      if (contractAgreementSign) {
        initialValue = contractTemplateText;
      } else {
        initialValue = selectedContract === '1' ? initialContent : 
                      selectedContract === '2' ? initialContent2 : 
                      selectedContract === '3' ? initialContent3 :
                      selectedContract === '4' ? initialContent4 :
                      initialContent; // fallback to initialContent
      }

      // console.log('Setting initial value for contract:', selectedContract);

      // Set initial content
      setData(initialValue);

      // Mark as initialized and update last selected contract
      isInitialized.current = true;
      lastSelectedContract.current = selectedContract;

      // Send initial value to parent
      if (typeof onChange === "function") {
        // console.log("Sending content to parent");
        onChange(initialValue);
        lastSentValue.current = initialValue;
      }
    }
  }, [contractTemplateText, onChange, selectedContract]);

  // Apply template replacements
  useEffect(() => {
    // Skip if contract is already signed or not initialized
    if (contractAgreementSign || !isInitialized.current) {
      return;
    }

    // console.log("Applying template replacements");

    // Define replacements
    const replacements = {
      "{{FacilityName}}": FacilityName || "",
      "{{InspectionCompleteDate}}": InspectionCompleteDate || "",
      "{{InspectionEventType}}": InspectionEventType || "",
      "{{Employee}}": Employee || "",
      "{{persentage}}": persentage || "",
    };

    // Apply replacements to current content
    const result = Object.entries(replacements).reduce(
      (str, [key, value]) => str.replaceAll(key, value),
      data
    );

    // Only update if there's a change
    if (result !== data) {
      // console.log("Template replacements changed content, updating");
      setData(result);

      // Send to parent if it's different from last sent value
      if (typeof onChange === "function" && result !== lastSentValue.current) {
        // console.log("Sending replacement-updated content to parent");
        onChange(result);
        lastSentValue.current = result;
      }
    }
  }, [
    FacilityName,
    InspectionCompleteDate,
    InspectionEventType,
    Employee,
    persentage,
    contractAgreementSign,
    data,
    onChange,
  ]);

  // Set up scroll position tracking
  useEffect(() => {
    if (!contractAgreementSign) {
      // Function to find the editor workplace element
      const findEditorWorkplace = () => {
        if (editorContainerRef.current) {
          return editorContainerRef.current.querySelector(".jodit-workplace");
        }
        return null;
      };

      // Function to save scroll position
      const saveScrollPosition = () => {
        const workplace = findEditorWorkplace();
        if (workplace) {
          scrollPositionRef.current = workplace.scrollTop;
        }
      };

      // Function to restore scroll position
      const restoreScrollPosition = () => {
        const workplace = findEditorWorkplace();
        if (workplace && scrollPositionRef.current) {
          workplace.scrollTop = scrollPositionRef.current;
        }
      };

      // Add scroll event listener to save position
      const workplace = findEditorWorkplace();
      if (workplace) {
        workplace.addEventListener("scroll", saveScrollPosition);

        // Restore position after any potential change
        const observer = new MutationObserver(() => {
          setTimeout(restoreScrollPosition, 0);
        });

        observer.observe(workplace, {
          childList: true,
          subtree: true,
          characterData: true,
        });

        return () => {
          workplace.removeEventListener("scroll", saveScrollPosition);
          observer.disconnect();
        };
      }
    }
  }, [contractAgreementSign]);

  // Handle PDF loading
  const handlePdfLoad = () => {
    setPdfLoading(false);
  };

  // Handle editor content changes on blur
  const onChangeEditor = (value) => {
    // Save scroll position before updating
    const workplace =
      editorContainerRef.current?.querySelector(".jodit-workplace");
    if (workplace) {
      scrollPositionRef.current = workplace.scrollTop;
    }

    // Update local state
    setData(value);

    // Always send to parent if different
    if (typeof onChange === "function" && value !== lastSentValue.current) {
      onChange(value);
      lastSentValue.current = value;
    }

    // Restore scroll position after a short delay
    setTimeout(() => {
      if (workplace) {
        workplace.scrollTop = scrollPositionRef.current;
      }
    }, 0);
  };

  // Dynamically adjust iframe height based on content
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

  // Toolbar buttons config
  const buttons = [
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
    "image",
    "link",
    "table",
    "|",
    "hr",
    "eraser",
    "copyformat",
    "|",
    "fullsize",
    "selectall",
    "print",
    "|",
    "source",
    "preview",
    "|",
  ];

  // Handle print functionality
  const handlePrint = async () => {
    setIsPrinting(true);

    try {
      // Create a new window for printing
      const printWindow = window.open("", "_blank");

      if (!printWindow) {
        throw new Error("Unable to open print window");
      }

      // Write the content to the new window
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print Document</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    padding: 20px;
                    color: #000000;
                }
                @media print {
                    body {
                        padding: 0;
                    }
                }
            </style>
        </head>
        <body>
            ${data}
        </body>
        </html>
      `);

      // Wait for images to load
      await new Promise((resolve) => {
        if (printWindow.document.images.length === 0) {
          resolve();
          return;
        }

        let loadedImages = 0;
        Array.from(printWindow.document.images).forEach((img) => {
          if (img.complete) {
            loadedImages++;
            if (loadedImages === printWindow.document.images.length) {
              resolve();
            }
          } else {
            img.onload = () => {
              loadedImages++;
              if (loadedImages === printWindow.document.images.length) {
                resolve();
              }
            };
            img.onerror = () => {
              loadedImages++;
              if (loadedImages === printWindow.document.images.length) {
                resolve();
              }
            };
          }
        });
      });

      // Close the document and trigger print
      printWindow.document.close();
      printWindow.print();

      // Close the window after printing
      printWindow.onafterprint = () => {
        printWindow.close();
        setIsPrinting(false);
      };
    } catch (error) {
      console.error("Print error:", error);
      setIsPrinting(false);
    }
  };

  // Editor configuration with focus on scroll stability
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
    buttons: buttons,
    uploader: {
      insertImageAsBase64URI: true,
      url: "/upload",
    },
    width: 800,
    height: 842,
    // Critical for scroll stability:
    saveCursorPosition: false,
    // Additional events to preserve scroll
    events: {
      beforeSetMode: function () {
        // Save scroll position before changing modes
        const workplace = document.querySelector(".jodit-workplace");
        if (workplace) {
          scrollPositionRef.current = workplace.scrollTop;
        }
      },
      afterSetMode: function () {
        // Restore scroll position after changing modes
        setTimeout(() => {
          const workplace = document.querySelector(".jodit-workplace");
          if (workplace) {
            workplace.scrollTop = scrollPositionRef.current;
          }
        }, 10);
      },
      // Add handlers for focusing and blurring
      focus: function () {
        // Save scroll position on focus
        const workplace = document.querySelector(".jodit-workplace");
        if (workplace) {
          scrollPositionRef.current = workplace.scrollTop;
        }
      },
      blur: function () {
        // Save scroll position on blur
        const workplace = document.querySelector(".jodit-workplace");
        if (workplace) {
          scrollPositionRef.current = workplace.scrollTop;
        }
      },
    },
  };

  // Render PDF viewer if contract is already signed
  if (contractAgreementSign) {
    return (
      <Row>
        <Col span={24} className="w-full">
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
              style={{
                position: pdfLoading ? "absolute" : "relative",
                opacity: pdfLoading ? 0 : 1,
                minHeight: "800px",
                border: "none",
              }}
            >
              <Text className="text-white">
                Your browser does not support iframes. Please download the PDF
                to view it.
              </Text>
            </iframe>
          </div>

          {/* Download button for backup access */}
          <div className="mt-4 flex justify-end">
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
          </div>
        </Col>
      </Row>
    );
  }

  // Editor view
  return (
    <Row>
      <Col span={24}>
        {isPrinting && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white p-5 rounded-lg shadow-lg">
              <Text>Preparing document for print...</Text>
              <div className="mt-3 mx-auto w-10 h-10 border-4 border-solid border-gray-300 border-t-primary rounded-full animate-spin" />
            </div>
          </div>
        )}
        <style>
          {`
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .jodit-container {
              border-radius: 8px;
            }
            .jodit-toolbar__box {
              border-top-left-radius: 8px;
              border-top-right-radius: 8px;
            }
            .jodit-wysiwyg {
              color: #000000 !important;
            }
            .jodit-workplace {
              color: #000000 !important;
              background-color: white;
              overflow: auto !important;
              position: relative !important;
            }
            .jodit-container:not(.jodit_inline) .jodit-wysiwyg {
              color: #000000 !important;
              position: static !important;
              overflow: visible !important;
            }
            /* Fix for scroll stealing focus */
            .jodit-container .jodit-workplace:focus-within {
              outline: none !important;
            }
          `}
        </style>
        <div className="w-full mx-auto" ref={editorContainerRef}>
          <JoditEditor
            ref={editorRef}
            value={data}
            config={editorConfig}
            onBlur={onChangeEditor}
            className="jodit-black-text"
          />
        </div>
      </Col>
    </Row>
  );
};

export default ContractAgreementEdit;