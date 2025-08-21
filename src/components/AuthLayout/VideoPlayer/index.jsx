import React, { useRef, useState, useEffect } from 'react';
import './VideoPlayer.scss'
import { useDispatch, useSelector } from 'react-redux';
import { endVimeoEventAction, storeVimeoEventAction } from '../../../services/Store/VideoModule/action';
import { getStorage, setStorage } from '../../../utils/commonfunction';
import Loading from '../Loading';
import { Button } from 'antd';
import { editeUserData } from '../../../services/Store/Users/slice';


const VideoPlayer = ({ vimeoUrl, singleVideo, setSingleVideo, setIsMCQModalOpen, setIsVideoPlayerOpen }) => {
    const iframeRef = useRef(null);
    const dispatch = useDispatch()
    const playerRef = useRef(null);

    const [isPaused, setIsPaused] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [videoCompleted, setVideoCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const startTime = singleVideo?.pause_time || 0;

    const user = getStorage("user", true);

    const {
        userForEdit
    } = useSelector((state) => state?.usersmanagement);


    // console.log('vimeoUrl', vimeoUrl);
    // console.log('startTime', startTime);
    // console.log('singleVideo', singleVideo);

    const getModifiedUrl = (url) => {
        // Check if URL already has parameters
        const hasParams = url.includes('?');
        const connector = hasParams ? '&' : '?';

        // Add specific parameters to hide sidebar controls and enable autoplay
        // Using documented Vimeo parameters
        return `${url}${connector}controls=true&sidedock=false&title=false&byline=false&portrait=false&share=false&like=false&watch_later=false&pip=false&dnt=1&show_vimeo_logo=false&autoplay=1`;
    };


    const updateUserVideoData = (responseData) => {
        if (userForEdit?.onboarding?.onboarding_details?.video && responseData?.video_id) {
            const videoId = responseData.video_id;
            
            // Create a deep copy of the user object
            const updatedUser = JSON.parse(JSON.stringify(userForEdit));
    
            // Find the matching video in the user's onboarding details
            const videoIndex = updatedUser.onboarding.onboarding_details.video.findIndex(
                video => video.video_id === videoId
            );
    
            if (videoIndex !== -1) {
                // Create a new video object with the updated properties
                const updatedVideo = {
                    ...updatedUser.onboarding.onboarding_details.video[videoIndex],
                    progress: responseData.progress,
                    event_type: responseData.event_type,
                    pause_time: responseData.pause_time,
                    end_time: responseData.end_time,
                    all_questions_viewed: 0
                };
                
                // Create a new array with the updated video
                updatedUser.onboarding.onboarding_details.video = [
                    ...updatedUser.onboarding.onboarding_details.video.slice(0, videoIndex),
                    updatedVideo,
                    ...updatedUser.onboarding.onboarding_details.video.slice(videoIndex + 1)
                ];
    
                // Store the updated user object back to storage
                // console.log("editeUserData75",updatedUser)
                dispatch(editeUserData(updatedUser));

                setStorage('user', updatedUser);
                return true;
            }
        }
        return false;
    };

    // Function to update user data in storage
    // const updateUserVideoData = (responseData) => {
    //     if (userForEdit?.onboarding?.onboarding_details?.video && responseData?.video_id) {
    //         const videoId = responseData.video_id;
    //         const updatedUser = { ...userForEdit };

    //         // Find and update the matching video in the user's onboarding details
    //         const videoIndex = updatedUser.onboarding.onboarding_details.video.findIndex(
    //             video => video.video_id === videoId
    //         );

    //         if (videoIndex !== -1) {
    //             // Update the video with data from the response
    //             updatedUser.onboarding.onboarding_details.video[videoIndex] = {
    //                 ...updatedUser.onboarding.onboarding_details.video[videoIndex],
    //                 progress: responseData.progress,
    //                 event_type: responseData.event_type,
    //                 pause_time: responseData.pause_time,
    //                 end_time: responseData.end_time,
    //                 all_questions_viewed: 0
    //             };

    //             // Store the updated user object back to storage
    //             dispatch(editeUserData(updatedUser))
    //             setStorage('user', updatedUser);
    //             return true;
    //         }
    //     }
    //     return false;
    // };

    useEffect(() => {
        // Load the Vimeo Player API
        const script = document.createElement('script');
        script.src = 'https://player.vimeo.com/api/player.js';
        script.async = true;
        document.body.appendChild(script);

        let player;

        script.onload = () => {
            // Initialize the Vimeo player when API is loaded
            player = new window.Vimeo.Player(iframeRef.current, {
                controls: true,      // Keep basic controls (play/pause/etc)
                title: false,        // Hide title
                byline: false,       // Hide author byline
                portrait: false,     // Hide author portrait
                sidedock: false,     // Hide sidedock (contains like, share, etc.)
                share: false,        // Hide share button
                like: false,         // Hide like button
                watch_later: false,  // Hide watch later button
                pip: false,          // Hide picture-in-picture button
                dnt: 1,              // Do not track (may hide some additional UI)
                showVimeoLogo: false, // Hide Vimeo logo
                autoplay: true       // Enable autoplay
            });

            playerRef.current = player;

            // Track if the video has ended to prevent pause event from firing
            let hasEnded = false;

            player.on('pause', (data) => {
                // Skip if the video has ended
                if (hasEnded) {
                    return;
                }

                const seconds = data.seconds;
                let payload = {
                    video_id: String(singleVideo?.video_id),
                    event_type: 'pause',
                    pause_time: seconds.toFixed(0)
                }
                dispatch(storeVimeoEventAction(payload)).then((res) => {

                    // Update user data in storage
                    if (res?.payload?.data) {
                        updateUserVideoData(res.payload.data);
                    }
                }).catch((e) => {
                    console.log('Error:', e)
                });
                setCurrentTime(seconds);
                setIsPaused(true);
                
            });

            player.on('play', () => {
                setIsPaused(false);
                // Reset the ended flag when the video starts playing again
                hasEnded = false;
            });

            player.on('loaded', () => {
                // Reset the ended flag when the video is loaded
                hasEnded = false;
            });

            player.on('ended', () => {
                // Set the ended flag to true
                hasEnded = true;

                let payload = {
                    video_id: String(singleVideo?.video_id),
                    event_type: 'ended',
                    end_time: 1
                }
                dispatch(endVimeoEventAction(payload)).then((res) => {

                    // Update user data in storage, same as in pause event
                    if (res?.payload?.meta?.status === 200) {

                        updateUserVideoData(res.payload.data)
                        setIsVideoPlayerOpen(false);
                        setIsMCQModalOpen(true);
                    }
                }).catch((e) => {
                    console.log('Error in ended event:', e);
                });

                setVideoCompleted(true);
            });

            // Set the start time if provided
            if (startTime > 0) {
                player.setCurrentTime(startTime).then(() => {
                }).catch((error) => {
                    console.error('Error setting video start time:', error);
                });
            }

            // Force play when loaded
            player.ready().then(() => {
                setIsLoading(false);
                player.play().catch((error) => {
                    console.error('Error autoplaying video:', error);
                });
            });
        };

        // Clean up
        return () => {
            if (player) {
                player.off('pause');
                player.off('play');
                player.off('ended');
                player.off('loaded');
            }
            document.body.removeChild(script);
        };
    }, [startTime, dispatch, singleVideo]);

    const videoHeight = window.innerWidth < 640 ? 200
        : (window.innerWidth > 640 && window.innerWidth < 768) ? 300
            : (window.innerWidth > 768 && window.innerWidth < 1024) ? 500
                : (window.innerWidth > 1024 && window.innerWidth < 1280) ? 400
                    : (window.innerWidth > 1280 && window.innerWidth < 1536) ? 440
                        : (window.innerWidth > 1536 && window.innerWidth < 1790) ? 600
                            : (window.innerWidth > 1790) ? 600 : 600

    const videoWidth = window.innerWidth < 640 ? 280
        : (window.innerWidth > 640 && window.innerWidth < 768) ? 400
            : (window.innerWidth > 768 && window.innerWidth < 1024) ? 650
                : (window.innerWidth > 1024 && window.innerWidth < 1280) ? 700
                    : (window.innerWidth > 1280 && window.innerWidth < 1536) ? 800
                        : (window.innerWidth > 1536 && window.innerWidth < 1790) ? 900
                            : (window.innerWidth > 1790) ? 900 : 900


    const handleCancelVideoPlayer = () => {

        if (singleVideo?.event_type === "ended" && singleVideo?.all_questions_viewed === 0) {
            // console.log('called cancel 1515 if')

            setIsVideoPlayerOpen(false);
            setIsMCQModalOpen(true);
        }
        else if (singleVideo?.event_type !== "ended") {
            if (playerRef.current) {
                // Get current time
                playerRef.current.getCurrentTime().then(seconds => {
                    // Manually create the same payload that would be created in the pause event
                    const payload = {
                        video_id: String(singleVideo?.video_id),
                        event_type: 'pause',
                        pause_time: seconds.toFixed(0)
                    };


                    // Dispatch the same action that would be dispatched in the pause event
                    dispatch(storeVimeoEventAction(payload)).then((res) => {

                        // Update user data in storage
                        if (res?.payload?.data) {
                            updateUserVideoData(res.payload.data);
                        }

                        // Then pause the video and close the player
                        playerRef.current.pause().then(() => {
                            setCurrentTime(seconds);
                            setIsPaused(true);
                            setIsVideoPlayerOpen(false);
                        });
                    }).catch((e) => {
                        playerRef.current.pause();
                        setIsVideoPlayerOpen(false);
                    });
                }).catch(error => {
                    setIsVideoPlayerOpen(false);
                });
            } else {
                // If player reference is not available, just close the player
                setIsVideoPlayerOpen(false);
            }
        } else {
            // console.log('called cancel 1515 else')

            setSingleVideo(undefined);
            setIsVideoPlayerOpen(false);
        }


    }



    return (
        <div className="video-container flex justify-center relative">

            {isLoading && (
                <div className="loading-container absolute flex items-center justify-center top-[45%]">
                    <Loading />
                </div>
            )}
            <Button
                shape="circle"
                icon={<i className="icon-close before:!m-0 text-md" />}
                className='absolute right-0 p-2'
                onClick={handleCancelVideoPlayer}
            />
            <div>

                <iframe
                    ref={iframeRef}
                    src={getModifiedUrl(vimeoUrl)}
                    width={videoWidth}
                    height={videoHeight}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title="Vimeo Video Player"
                    className='vimeoPlayerBox'
                    onLoad={() => setIsLoading(false)}
                ></iframe>
                {/* <div className='flex justify-center mt-3'>
                    <Button
                        type="primary"
                        onClick={handleCancelVideoPlayer}
                        className="rounded-3xl"
                    >
                        Close
                    </Button>
                </div> */}
            </div>



        </div>
    );
};

export default VideoPlayer;