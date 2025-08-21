import React, { useState, useEffect } from 'react';
import { Modal, Typography, Radio, Button, Row, Col } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { trackMcqViewsAction } from '../../../services/Store/McqModule/action';
import { getStorage, setStorage } from '../../../utils/commonfunction';
import { editeUserData } from '../../../services/Store/Users/slice';

const { Text } = Typography;

const QuizModal = ({ isMCQModalOpen, handleCancelMCQModal, video }) => {

  const dispatch = useDispatch()
  const user = getStorage("user", true);
  const {
    userForEdit
  } = useSelector((state) => state?.usersmanagement);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    // Reset state when modal opens or video changes
    if (isMCQModalOpen) {
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setAnsweredQuestions([]);
      setShowAnswer(false);
    }
  }, [isMCQModalOpen, video]);

  // Prevent modal from closing when clicking outside
  const handleModalCancel = () => {
    // Only allow explicitly calling handleCancel
    return false;
  };

  const handleAnswerSelect = (e) => {
    setSelectedAnswer(e.target.value);
  };

  // Function to update user data in storage
  const updateUserVideoData = (responseData) => {
    if (userForEdit?.onboarding?.onboarding_details?.video && responseData?.view_status?.video_id) {
      const videoId = responseData?.view_status?.video_id;
      
      // Create a deep copy of the entire user object
      const updatedUser = JSON.parse(JSON.stringify(userForEdit));
  
      // console.log('214 up updatedUser ', updatedUser);
  
      // Find the matching video in the user's onboarding details
      const videoIndex = updatedUser.onboarding.onboarding_details.video.findIndex(
        video => video.video_id === videoId
      );
  
      // console.log('214 videoIndex ', videoIndex);
  
      if (videoIndex !== -1) {
        // Create a new video object with updated properties
        const updatedVideo = {
          ...updatedUser.onboarding.onboarding_details.video[videoIndex],
          all_questions_viewed: responseData?.view_status?.all_questions_viewed,
        };
        
        // Create a new array with the updated video
        updatedUser.onboarding.onboarding_details.video = [
          ...updatedUser.onboarding.onboarding_details.video.slice(0, videoIndex),
          updatedVideo,
          ...updatedUser.onboarding.onboarding_details.video.slice(videoIndex + 1)
        ];
  
        // console.log('214 down updatedUser ', updatedUser);
        // console.log("editeUserData74",updatedUser)
        // Store the updated user object back to storage
        dispatch(editeUserData(updatedUser));
        setStorage('user', updatedUser);
        return true;
      }
    }
    return false;
  };


  // const updateUserVideoData = (responseData) => {


  //   if (userForEdit?.onboarding?.onboarding_details?.video && responseData?.view_status?.video_id) {
  //     const videoId = responseData?.view_status?.video_id;
  //     const updatedUser = { ...userForEdit };

  //     console.log('214 up updatedUser ', updatedUser);

  //     // Find and update the matching video in the user's onboarding details
  //     const videoIndex = updatedUser.onboarding.onboarding_details.video.findIndex(
  //       video => video.video_id === videoId
  //     );

  //     console.log('214 videoIndex ', videoIndex);

  //     if (videoIndex !== -1) {
  //       // Update the video with data from the response
  //       updatedUser.onboarding.onboarding_details.video[videoIndex] = {
  //         ...updatedUser.onboarding.onboarding_details.video[videoIndex],
  //         all_questions_viewed: responseData?.view_status?.all_questions_viewed,
  //       };

  //       console.log('214 down updatedUser ', updatedUser);

  //       // Store the updated user object back to storage
  //       dispatch(editeUserData(updatedUser))
  //       setStorage('user', updatedUser);
  //       return true;
  //     }
  //   }
  //   return false;
  // };


  const handleContinueClick = () => {
    if (selectedAnswer !== null) {
      // Check if the question was already answered
      if (!answeredQuestions.includes(currentQuestion)) {
        setAnsweredQuestions([...answeredQuestions, currentQuestion]);
      }

      setShowAnswer(true);


      // If this is the last question, we can close the modal after showing the answer
      if (showAnswer && currentQuestion === (video?.mcq_questions?.length - 1)) {
        // Wait for 1.5 seconds to show the answer before closing

        // console.log('video 1515', video)

        let payload = {
          video_id: String(video?.video_id),
          all_questions_viewed: 1,
        }
        dispatch(trackMcqViewsAction(payload)).then((res) => {
          if (res?.payload?.meta?.status === 200) {
            // console.log('res.payload.data 1515  ', res)
            updateUserVideoData(res.payload.data)
            handleCancelMCQModal();
          }
        }).catch((e) => {
          console.log('Error', e)
        })

      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < (video?.mcq_questions?.length - 1)) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      // For previous questions, we've already answered them
      setSelectedAnswer(null);
      setShowAnswer(false);
    }
  };

  // Helper function to determine if an answer is correct
  const isCorrectAnswer = (answerId) => {
    if (!video?.mcq_questions || !video.mcq_questions[currentQuestion]) return false;

    const answers = video.mcq_questions[currentQuestion].answers;
    const answer = answers.find(a => a.id === answerId);
    return answer?.is_correct === 1;
  };

  // Get answer options for the current question
  const getAnswerOptions = () => {
    if (!video?.mcq_questions || !video.mcq_questions[currentQuestion]) return [];

    return video.mcq_questions[currentQuestion].answers.map(answer => {
      // Determine if this is the correct answer
      const isCorrect = answer.is_correct === 1;

      return {
        label: (
          <Text
            className='text-xl'
            style={{
              color: showAnswer
                ? (isCorrect
                  ? '#52c41a'  // Always show correct answer in green after Continue
                  : answer.id === selectedAnswer ? '#ff4d4f' : 'inherit')
                : (answer.id === selectedAnswer ? 'primary' : 'inherit')
            }}
          >
            {answer.answer_text}
          </Text>
        ),
        value: answer.id
      };
    });
  };

  // console.log('video?.mcq_questions?.length 1515', video?.mcq_questions?.length)

  const getGridStyle = () => {
    const questionsCount = video?.mcq_questions?.length || 1;
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${questionsCount}, minmax(0, 1fr))`,
      gap: '0.5rem'
    };
  };

  return (
    <Modal
      title={
        <div className=''>
          <div className='titleText px-[24px] py-[20px]'>{video?.title}</div>
          <div className={`questionStep `} style={getGridStyle()}>
            {video?.mcq_questions?.map((item, index) => (
              <div
                key={item.id}
                className={`py-[3px] rounded-full ${index === currentQuestion ? 'bg-primary' : index < currentQuestion ? 'bg-primary opacity-60' : 'bg-liteGray'}`}
              ></div>
            ))}
          </div>
        </div>
      }
      className='quizModal'
      width={'45%'}
      open={isMCQModalOpen}
      maskClosable={false}
      closeIcon={null}
      destroyOnClose={true}
      centered
      footer={false}
      onCancel={handleModalCancel}
    >
      <div className='px-[24px] py-[20px]'>
        <div className='questionBox py-5 flex flex-col'>
          <Text type='secondary' className='mb-3'>Question {currentQuestion + 1}</Text>
          <Text className='text-xl'>{video?.mcq_questions?.[currentQuestion]?.question_title}</Text>
        </div>
        <div className='optionBox pt-7 pb-5 flex flex-col justify-start'>
          <Radio.Group
            className='flex flex-col gap-4 text-xl'
            options={getAnswerOptions()}
            value={selectedAnswer}
            onChange={handleAnswerSelect}
            disabled={showAnswer}
          />
        </div>
        <div className='quizButton pt-10'>
          <Row gutter={[24]}>
            {currentQuestion > 0 && (
              <Col xs={24} md={12}>
                <Button
                  className="bg-primaryOpacity text-primary border-primary"
                  size="large"
                  variant="filled"
                  block
                  onClick={handlePreviousQuestion}
                >
                  Previous
                </Button>
              </Col>
            )}
            <Col xs={24} md={currentQuestion > 0 ? 12 : 24}>
              {showAnswer && currentQuestion < (video?.mcq_questions?.length - 1) ? (
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={handleNextQuestion}
                >
                  Next Question
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={handleContinueClick}
                  disabled={selectedAnswer === null}
                >
                  {showAnswer && currentQuestion === (video?.mcq_questions?.length - 1) ? 'Finish' : 'Continue'}
                </Button>
              )}
            </Col>
          </Row>
        </div>
      </div>
    </Modal>
  );
};

export default QuizModal;