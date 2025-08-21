import { useState, useEffect } from "react";
import { Typography, Progress } from "antd";
import ContractAgreement from "./components/ContractAgreement";
import SubscriptionDetails from "./components/SubscriptionDetails";
import CheckListstatus from "./components/CheckListstaus";
import { getStorage } from "../../../utils/commonfunction";
import TrainingVideo from "./components/TrainingVideo";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const { Text, Title } = Typography;

const OnboardingPage = () => {
  const [currentStep, setCurrentStep] = useState(2);
  const [onboardingProcess, setOnboardingProcess] = useState(20);
  const totalSteps = 5;
  const userData = getStorage("user", true);

  const navigate = useNavigate();
  // console.log('Onboarding User Local===>', userData);
// console.log("check3")
  const {
    userForEdit
  } = useSelector((state) => state?.usersmanagement);

  // Effect to load initial data
  useEffect(() => {
    // Get user data from storage

    // Set current step based on user's onboarding_step if available
    if (userData?.onboarding?.onboarding_step) {
      setCurrentStep(Number(userData.onboarding.onboarding_step));
    }

    // Set onboarding process percentage if available
    if (userData?.onboarding?.onboarding_process) {
      setOnboardingProcess(Number(userData.onboarding.onboarding_process));
    }
  }, []);

  useEffect(() => {

    if (userForEdit?.onboarding?.onboarding_step === 0) {
      navigate('/dashboard')
    }
  }, [userForEdit])

  // Function to update progress when a step is completed
  const handleNextStep = (newProgressValue) => {
    // If a specific progress value is passed from the child component, use it
    if (newProgressValue) {
      setOnboardingProcess(Number(newProgressValue));
    }

    // Otherwise, read from storage
    const updatedUserData = getStorage("user", true);

    // Update the step based on the latest data or increment it
    if (updatedUserData?.onboarding?.onboarding_step) {
      setCurrentStep(Number(updatedUserData.onboarding.onboarding_step));

      // If no specific progress was passed, get it from storage
      if (
        !newProgressValue &&
        updatedUserData?.onboarding?.onboarding_process
      ) {
        setOnboardingProcess(
          Number(updatedUserData.onboarding.onboarding_process)
        );
      }
    } else {
      // Fallback to incrementing if not available in storage
      const newStep = currentStep < totalSteps ? currentStep + 1 : currentStep;
      setCurrentStep(newStep);
    }
  };

  return (
    <div className="bg-darkGray px-header-wrapper onBoardingContainer h-full w-full flex flex-col gap-6">
      {
        currentStep < 5 ?
          <div className="w-full">
            {currentStep === 3 && onboardingProcess === 100 ? null :
              <div className="bg-gray border border-liteGray rounded-2xl overflow-hidden flex items-center p-2">
                <div className="bg-[#3D2811] aspect-square flex items-center justify-center rounded-xl">
                  <i
                    className="icon-onboarding text-primary text-lg"
                    style={{ fontSize: "36px" }}
                  ></i>
                </div>
                <div className="flex-1 pl-2">
                  <Text className="text-white text-lg font-medium">
                    Onboarding Process
                  </Text>
                  <div className="flex items-center">
                    <div className="flex-grow mr-2">
                      <Progress
                        percent={onboardingProcess}
                        showInfo={false}
                        strokeColor="#FF6D00"
                        trailColor="#373737"
                        strokeWidth={10}
                      />
                    </div>
                    <Text className="text-grayText whitespace-nowrap">
                      {Math.round(onboardingProcess)}%
                    </Text>
                  </div>
                </div>
              </div>
            }
          </div>
          : null
      }
      <div className="w-full">
        <Title level={3} className="text-white !m-0 h-auto">
          {currentStep === 2 && "Contract Agreement"}
          {currentStep === 3 && "Subscription"}
          {/* {currentStep === 4 && "Payment Method"} */}
          {currentStep === 5 && "Trainual Videos"}
        </Title>
      </div>
      <div className="h-full mb-6">
        {currentStep === 2 && <ContractAgreement onNext={handleNextStep} setCurrentStep={setCurrentStep} setOnboardingProcess={setOnboardingProcess} />}
        {currentStep === 3 && <SubscriptionDetails onNext={handleNextStep} setCurrentStep={setCurrentStep} setOnboardingProcess={setOnboardingProcess} />}
        {currentStep === 4 && <CheckListstatus onNext={handleNextStep} setCurrentStep={setCurrentStep} setOnboardingProcess={setOnboardingProcess} />}
        {currentStep === 5 && (
          <TrainingVideo />
        )}
        {/* {currentStep === 6 && (
          <div className="text-white">Review & Submit Component</div>
        )} */}
      </div>
    </div>
  );
};

export default OnboardingPage;
