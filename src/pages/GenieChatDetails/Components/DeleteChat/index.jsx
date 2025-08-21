import { Button, Col, Modal, Row, Typography } from 'antd'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { removeChatConversation } from '../../../../services/Store/Genie/action';
import { deleteGenieHistory } from '../../../../services/Store/Genie/slice';

const DeleteChat = ({ openDeleteModal, setOpenDeleteModal, deleteChatData, setDeleteChatData }) => {

    const { Text, Title } = Typography;
    const { chatHistory, chatHistoryLoading, recommendationLoading } = useSelector((state) => state?.genie);

    const dispatch = useDispatch();

    const {
        userForEdit
    } = useSelector((state) => state?.usersmanagement);

    const handleCancelDelete = () => {
        setOpenDeleteModal(false);
        setDeleteChatData(null);
    }

    const handleConfirmDelete = () => {

        console.log('deleteChatData', deleteChatData);


        const payload = {
            conversation_id: deleteChatData?.conversation_id,
            user_id: userForEdit?.user?.id,
        }

        console.log('294 payload', payload)

        dispatch(removeChatConversation(payload)).then((res) => {

            if (res?.payload?.meta?.status === 200) {

                console.log('294 res', res)
                console.log('294 chatHistory', chatHistory)

                dispatch(deleteGenieHistory(res?.payload?.data))

                setOpenDeleteModal(false);
                setDeleteChatData(null);
            }
        })

    }

    return (
        <Modal
            title="Delete Chat"
            centered
            destroyOnClose
            open={openDeleteModal}
            footer={false}
            onCancel={handleCancelDelete}
            closeIcon={
                <Button
                    shape="circle"
                    icon={<i className="icon-close before:!m-0 text-sm" />}
                />
            }
        >
            <div className=" border-t-2 border-solid border-[#373737] mt-5">
                <Row gutter={16} className="">
                    <div className="w-full pt-5 flex  items-center justify-center  pb-5">
                        <Text className=" text-base font-normal text-grayText text-center">
                            Are you sure you want to delete this chat?
                        </Text>

                    </div>
                    <Col span={12}>
                        <Button block onClick={handleCancelDelete} size="large">
                            Cancel
                        </Button>
                    </Col>
                    <Col span={12}>
                        <Button
                            block
                            danger
                            type="primary"
                            size="large"
                            onClick={handleConfirmDelete}
                        >
                            Confirm Deletion
                        </Button>
                    </Col>
                </Row>
            </div>
        </Modal>
    )
}

export default DeleteChat
