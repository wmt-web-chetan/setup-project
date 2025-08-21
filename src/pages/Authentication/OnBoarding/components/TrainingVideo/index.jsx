import { Button, Col, Empty, Modal, Progress, Radio, Row, Steps, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import './TrainingVideo.scss';
import { formatDate, getStorage, setStorage } from '../../../../../utils/commonfunction';
import VideoPlayer from '../../../../../components/AuthLayout/VideoPlayer';
import QuizModal from '../../../../../components/AuthLayout/QuizModal';
import { useDispatch, useSelector } from 'react-redux';
import { trackMcqViewsAction } from '../../../../../services/Store/McqModule/action';
import { useNavigate } from "react-router-dom";
import { editeUserData } from '../../../../../services/Store/Users/slice';

const TrainingVideo = () => {

    const dispatch = useDispatch()
    const navigate = useNavigate();
    const user = getStorage('user', true);
    const { Text, Title } = Typography;

    const [singleVideo, setSingleVideo] = useState(undefined);
    const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
    const [isMCQModalOpen, setIsMCQModalOpen] = useState(false);
    const [isOpenGoToDashboardModal, setIsOpenGoToDashboardModal] = useState(false);

    const {
        userForEdit
    } = useSelector((state) => state?.usersmanagement);

    // console.log('video training user 1515', user);
    // console.log('video training userForEdit 1515', userForEdit);

    const areAllVideosCompleted = () => {
        // If no videos or no onboardingDetail, return false
        if (!userForEdit?.onboarding?.onboarding_details?.video || !userForEdit?.onboarding?.onboarding_details?.video.length) {
            return false;
        }

        // Check if all videos have event_type === "ended" and all_questions_viewed === 1
        return userForEdit?.onboarding?.onboarding_details?.video?.every(
            video => video.all_questions_viewed === 1
            // video => video.event_type === "ended" && video.all_questions_viewed === 1
        );
    };

    const showContinueButton = areAllVideosCompleted();

    useEffect(() => {
        if (showContinueButton) {
            setIsOpenGoToDashboardModal(true)
        }
    }, [showContinueButton])

    const onClickVideo = (item) => {

        // console.log('item 1515', item)

        if (item?.all_questions_viewed === 1) {
            // console.log('return 1515', item)
            return
        } else if (item?.event_type !== "ended") {
            // console.log('ended 1515', item)

            setSingleVideo(item)
            setIsVideoPlayerOpen(true);
            setIsMCQModalOpen(false);
        } else if (item?.event_type === "ended" && item?.all_questions_viewed === 0) {

            // console.log('ended && 0 1515', item)

            setSingleVideo(item)
            setIsVideoPlayerOpen(false);
            setIsMCQModalOpen(true);
        }
    }


    const handleCancelMCQModal = () => {
        setSingleVideo(undefined);
        setIsMCQModalOpen(false);
    };


    // user=>onboarding=>onboarding_step
    // responseData=>is_onboarding_process_completed


    // Function to update user data in storage
    const updateUserVideoData = (responseData) => {
        if (userForEdit?.onboarding && responseData) {
            const step = responseData?.is_onboarding_process_completed;

            // Create a deep copy of the user object
            const updatedUser = JSON.parse(JSON.stringify(userForEdit));

            // Create a new onboarding object with the updated step
            updatedUser.onboarding = {
                ...updatedUser.onboarding,
                onboarding_step: step
            };

            // console.log("editeUserData100",updatedUser)
            // Store the updated user object back to storage
            dispatch(editeUserData(updatedUser));
            setStorage('user', updatedUser);
            return true;
        }
        return false;
    };

    // // Function to update user data in storage
    // const updateUserVideoData = (responseData) => {
    //     if (userForEdit?.onboarding && responseData) {
    //         const step = responseData?.is_onboarding_process_completed;
    //         const updatedUser = { ...userForEdit };

    //         console.log("step", step)
    //         console.log("updatedUser Up", updatedUser)

    //         // Update the video with data from the response
    //         updatedUser.onboarding.onboarding_step = step;


    //         console.log("updatedUser Down", updatedUser)

    //         // Store the updated user object back to storage
    //         dispatch(editeUserData(updatedUser))
    //         setStorage('user', updatedUser);
    //         return true;
    //     }
    //     return false;
    // };

    const onClickFinalStep = () => {
        let payload = {
            is_onboarding_process_completed: 0
        }
        dispatch(trackMcqViewsAction(payload)).then((res) => {
            if (res?.payload?.meta?.status === 200) {
                // console.log('Go to dashboard')
                // console.log('res.payload.data 1515  ', res)

                updateUserVideoData(res?.payload?.data)
                setIsOpenGoToDashboardModal(false);
                navigate('/dashboard')
            }
        }).catch((e) => {
            console.log('Error', e)
        })
    }

    const handleCancel = () => {
        setIsOpenGoToDashboardModal(false);
    };

    return (
        <div>

            {
                <Modal title={false} centered destroyOnClose open={isOpenGoToDashboardModal} width={'40%'} onCancel={handleCancel} footer={
                    <Button
                        type="primary"
                        size="large"
                        block
                        onClick={onClickFinalStep}

                    >
                        Go To Dashboard
                    </Button>}
                    closeIcon={<Button shape="circle" icon={<i className="icon-close before:!m-0 text-sm" />} />}
                >
                    <div className='flex items-center justify-center mt-24'>
                        <div className="bg-primaryOpacity p-4 rounded-full w-fit">
                            <div className="bg-primary p-4 rounded-full">
                                <i className="icon-tick before:!m-0 text-white text-5xl " />
                            </div>
                        </div>
                    </div>
                    <div className='flex flex-col items-center justify-center pt-10 pb-5'>
                        <Text className="font-semibold text-xl text-center">Congratulations! Well Done🎉</Text>
                        <Text className="text-grayText text-center px-24 py-3">You’ve successfully completed the onboarding training. Your accounts are now set up, and you can access the dashboard.</Text>
                    </div>
                </Modal>
            }

            {(isVideoPlayerOpen && singleVideo) ?
                <div className="bg-gray rounded-2xl border border-liteGray p-6 h-full">
                    <VideoPlayer vimeoUrl={singleVideo?.embed_url} singleVideo={singleVideo} setSingleVideo={setSingleVideo} setIsVideoPlayerOpen={setIsVideoPlayerOpen} setIsMCQModalOpen={setIsMCQModalOpen} />
                </div> :
                <Row
                    className="bg-gray rounded-2xl border border-liteGray p-6 h-full"
                    gutter={[0, 24]}
                >
                    <>
                        {
                            showContinueButton ?
                                <Col xs={24} className='flex items-center'>
                                    <Row className='w-full bg-liteGrayV1 p-2 rounded-2xl border border-liteGray' align={'middle'}>
                                        <Col xs={24} md={24} lg={18} className='text-lg ps-2'>
                                            You’ve successfully completed the onboarding training. Your accounts are now set up, and you can access the dashboard.
                                        </Col>
                                        <Col xs={24} md={24} lg={6}>
                                            <Button
                                                type="primary"
                                                size="large"
                                                block
                                                onClick={onClickFinalStep}
                                            // className="rounded-lg shadow-md"
                                            >
                                                Go to Dashboard
                                            </Button>
                                        </Col>
                                    </Row>
                                </Col>
                                : null
                        }
                        <Col xs={24} className='flex items-center'>
                            <div className='text-xl'>Videos</div>
                            <span className='mx-3 text-grayText'>&#8226;</span>
                            <div className='bg-primaryOpacity rounded-lg px-3 py-1 text-primary'>{userForEdit?.onboarding?.onboarding_details?.count || 0}</div>
                        </Col>
                        {
                            userForEdit?.onboarding?.onboarding_details?.video?.length > 0 ?
                                <Col xs={24} className=''>
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols- gap-4 mt-3">
                                        {
                                            userForEdit?.onboarding?.onboarding_details?.video?.map((item) => (
                                                <div className={`bg-liteGray rounded-3xl p-4 cursor-pointer ${item?.all_questions_viewed === 1 ? "opacity-40 !cursor-not-allowed" : ""} `} key={item?.video_id} onClick={() => onClickVideo(item)}>
                                                    <div>
                                                        <img src={item?.thumbnail} alt="" className='w-full rounded-2xl' />
                                                    </div>
                                                    <div className='p-2'>
                                                        <div className='font-semibold whitespace-nowrap overflow-hidden text-ellipsis mb-1'>
                                                            {item?.title}
                                                        </div>
                                                        <div className='text-grayText whitespace-nowrap overflow-hidden text-ellipsis mb-1'>{formatDate(item?.created_at)
                                                        }</div>
                                                        {
                                                            Math.round(item?.progress) > 0 ?
                                                                <div className="flex items-center">
                                                                    <div className="flex-grow mr-2">
                                                                        <Progress
                                                                            percent={Math.round(item?.progress)}
                                                                            showInfo={false}
                                                                            strokeColor="#FF6D00"
                                                                            trailColor="#1E1E1E"
                                                                            strokeWidth={7}
                                                                        />
                                                                    </div>
                                                                    <Text className="text-grayText whitespace-nowrap">
                                                                        {Math.round(item?.progress)}%
                                                                    </Text>
                                                                </div>
                                                                : null
                                                        }
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </Col>
                                :
                                <div className="flex justify-center items-center h-full w-full py-48">
                                    <Empty description="No Videos Found" />
                                </div>
                        }
                    </>
                </Row>
            }
            <QuizModal
                video={singleVideo}
                isMCQModalOpen={isMCQModalOpen}
                handleCancelMCQModal={handleCancelMCQModal}
            />
        </div>
    )
}

export default TrainingVideo
