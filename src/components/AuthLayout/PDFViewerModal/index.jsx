import { Button, Modal, Spin, Typography } from 'antd'
import React, { useState } from 'react'
import { IMAGE_BASE_URL } from '../../../utils/constant';

const PDFViewerModal = ({ openPDFModal, setOpenPDFModal }) => {

    const { Text, Title } = Typography;

    const [pdfLoading, setPdfLoading] = useState(true);


    const onClickVoicetoTextCancle = () => {
        setOpenPDFModal(false);
    }

    // Handle PDF loading events
    const handlePdfLoad = () => {
        setPdfLoading(false);
    };

    return (
        <Modal
            title={false}
            centered
            destroyOnClose
            open={openPDFModal}
            width={"70%"}
            onCancel={onClickVoicetoTextCancle}
            footer={
                false
            }
            closeIcon={
                <Button
                    shape="circle"
                    icon={<i className="icon-close before:!m-0 text-sm" />}
                />
            }
        >
            <div className="bg-gray rounded-3xl shadow-sm h-[800px] relative">
                {pdfLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray z-10 rounded-3xl">
                        <Spin size="large" tip="Loading PDF Document..." />
                    </div>

                )}
                <iframe
                    title="Contract Agreement PDF"
                    src={`${IMAGE_BASE_URL}/user/53d5ab9e-a6e5-4645-be28-5019b7a46748/contract_agreement/contract_template_1745492662.pdf#page=9`}
                    width="100%"
                    className="w-full h-[500px] lg:h-full border-0 bg-white rounded-3xl"
                    onLoad={handlePdfLoad}
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
            </div>
        </Modal>
    )
}

export default PDFViewerModal
