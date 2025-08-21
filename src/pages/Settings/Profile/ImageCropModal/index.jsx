import React, { useState, useCallback } from 'react';
import { Modal, Button, Row, Col, Typography, Slider, Upload, message } from 'antd';
import { UploadOutlined, ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import Cropper from 'react-easy-crop';

const { Text } = Typography;

const ImageCropModal = ({ 
  visible, 
  onCancel, 
  onConfirm, 
  initialImage = null 
}) => {
  const [imageSrc, setImageSrc] = useState(initialImage);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Handle file upload
  const handleFileUpload = (file) => {
    if (!file.type.startsWith('image/')) {
      message.error('Please select an image file');
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      message.error('Image size should not exceed 10MB');
      return false;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target.result);
      // Reset crop settings when new image is loaded
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
    return false; // Prevent default upload
  };

  // Handle crop complete
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Create cropped image
  const createCroppedImage = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const image = new Image();

    return new Promise((resolve) => {
      image.onload = () => {
        // Set canvas size to desired output size
        canvas.width = 400;
        canvas.height = 400;

        // Draw the cropped image
        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          canvas.width,
          canvas.height
        );

        // Convert to blob
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.95);
      };
      image.src = imageSrc;
    });
  }, [imageSrc, croppedAreaPixels]);

  // Handle confirm
  const handleConfirm = async () => {
    if (!imageSrc) {
      message.error('Please select an image first');
      return;
    }

    const croppedImage = await createCroppedImage();
    if (croppedImage) {
      const croppedImageUrl = URL.createObjectURL(croppedImage);
      onConfirm(croppedImage, croppedImageUrl);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onCancel();
  };

  // Reset controls
  const resetControls = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <Modal
      title="Edit Profile Picture"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      className="modalWrapperBox"
      destroyOnClose
      closeIcon={
        <Button
          shape="circle"
          icon={<i className="icon-close before:!m-0 text-sm" />}
        />
      }
    >
      <div className="pt-5">
        {/* Upload Section */}
        {!imageSrc && (
          <div 
            className="bg-darkGray rounded-lg text-center"
            style={{
              padding: "30px 0",
              border: "2px dashed #FF6D00",
              borderRadius: "8px",
            }}
          >
            <Upload
              accept="image/*"
              beforeUpload={handleFileUpload}
              showUploadList={false}
            >
              <div className="flex flex-col items-center">
                <div className="bg-primaryOpacity w-16 h-16 flex items-center justify-center !rounded-full mb-4">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary">
                    <i className="icon-upload text-2xl" />
                  </div>
                </div>
                <Text className="text-white mb-1">
                  Drag & drop or Choose image to upload
                </Text>
                <Text className="text-grayText text-xs">
                  Supported formats: JPG, PNG, WebP
                </Text>
                <Text className="text-grayText text-xs mt-1">
                  Maximum file size: 10MB
                </Text>
              </div>
            </Upload>
          </div>
        )}

        {/* Image Editor */}
        {imageSrc && (
          <div className="space-y-4">
            {/* Crop Area */}
            <div className="relative w-full h-80 bg-darkGray rounded-lg overflow-hidden">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                style={{
                  containerStyle: {
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#171717',
                  },
                }}
              />
            </div>

            {/* Controls */}
            <div className="space-y-4 p-4 bg-darkGray rounded-lg border border-[#373737]">
              {/* Zoom Control */}
              <div className="flex items-center space-x-3">
                <ZoomOutOutlined className="text-grayText" />
                <Slider
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={setZoom}
                  className="flex-1"
                />
                <ZoomInOutlined className="text-grayText" />
              </div>

              {/* Quick Action Buttons */}
              <div className="flex justify-center">
                <Button onClick={resetControls} className="bg-darkGray border-[#373737] text-white hover:bg-[#373737]">
                  Reset
                </Button>
              </div>
            </div>

            {/* Change Image */}
            <div className="text-center">
              <Upload
                accept="image/*"
                beforeUpload={handleFileUpload}
                showUploadList={false}
              >
                <Button type="dashed" className="bg-darkGray border-[#373737] text-grayText hover:text-white hover:border-white mb-4">
                  Change Image
                </Button>
              </Upload>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mb-6 border-t-2 border-solid border-[#373737] pt-6"></div>
        <Row gutter={16}>
          <Col span={12}>
            <Button block size="large" onClick={handleCancel}>
              Cancel
            </Button>
          </Col>
          <Col span={12}>
            <Button 
              block 
              size="large" 
              type="primary" 
              onClick={handleConfirm}
              disabled={!imageSrc}
              style={{ backgroundColor: "#FF6D00", borderColor: "#FF6D00" }}
            >
              Done
            </Button>
          </Col>
        </Row>
      </div>
    </Modal>
  );
};

export default ImageCropModal;