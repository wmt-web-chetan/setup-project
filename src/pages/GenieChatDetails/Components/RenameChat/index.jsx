import { Button, Form, Input, Modal, Typography } from 'antd'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { renameConversationAction } from '../../../../services/Store/Genie/action';
import { updateGenieHistory } from '../../../../services/Store/Genie/slice';

const RenameChat = ({ openRenameModal, setOpenRenameModal, renameChatData, setRenameChatData }) => {

    const [form] = Form.useForm();
    const { Text, Title } = Typography;
    const { chatHistory, chatHistoryLoading, recommendationLoading } = useSelector((state) => state?.genie);
    const dispatch = useDispatch();

    const {
        userForEdit
    } = useSelector((state) => state?.usersmanagement);

    console.log('renameChatData', renameChatData, chatHistory)

    useEffect(() => {
        form.setFieldsValue({
            chatName: renameChatData?.title
        });
    }, [renameChatData?.title])

    const handleModalCancel = () => {
        setOpenRenameModal(false);
        setRenameChatData(null);
    }

    // console.log('renameChatDatarenameChatDatarenameChatData', renameChatData?.title)

    const handleModalSubmit = () => {
        form.validateFields().then((values) => {

            const payload = {
                user_id: userForEdit?.user?.id,
                conversation_id: renameChatData?.conversation_id,
                title: values?.chatName
            }

            dispatch(renameConversationAction(payload)).then((res) => {

                if (res?.payload?.meta?.status === 200) {

                    console.log('294 res', res)
                    console.log('294 chatHistory', chatHistory)

                    dispatch(updateGenieHistory(res?.payload?.data))

                }
                setOpenRenameModal(false);
            })

            // renameConversationAction
            console.log('values', values);
        });



    };

    return (
        <Modal
            title={'Rename Chat '}
            open={openRenameModal}
            onCancel={handleModalCancel}
            onOk={handleModalSubmit}
            okText={"Rename"}
            okButtonProps={{ className: "bg-primary hover:bg-primary-dark" }}
            className="renameChat"
            destroyOnClose={true}
            centered
            closeIcon={
                <Button
                    shape="circle"
                    icon={<i className="icon-close before:!m-0 text-sm" />}
                />
            }
        >
            {
                renameChatData?.title?.length > 0 ?
                    <Form
                        form={form}
                        layout="vertical"
                        name="videoForm"
                        initialValues={{ chatName: renameChatData?.title }}
                        requiredMark={false}
                    >
                        <Form.Item
                            name="chatName"
                            label={<Text type="secondary">Rename Chat</Text>}
                            rules={[
                                {
                                    required: true,
                                    message: "Please Enter a Chat Name",
                                },
                            ]}
                        >
                            <Input
                                placeholder="Rename Chat"
                                className=" rounded-lg"
                            />
                        </Form.Item>
                    </Form>
                    : 'loading'
            }
        </Modal>
    )
}

export default RenameChat
