import { Button, notification, Typography } from "antd";
import React, { useState } from "react";
import successBadge from "../../../../../assets/SVGs/Checklist.svg";
import pendingBadge from "../../../../../assets/SVGs/Pending-Checklist.svg";
import { getStorage, setStorage } from "../../../../../utils/commonfunction";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserOnboardingStep5 } from "../../../../../services/Store/OnBoarding/action";
import { editeUserData } from "../../../../../services/Store/Users/slice";

const CheckListstatus = ({ setCurrentStep, setOnboardingProcess }) => {
  const { Text, Title } = Typography;

  const user = getStorage("user", true);
  const { onboardingStep5Loading } = useSelector((state) => state?.onboarding);

  const { userForEdit } = useSelector((state) => state?.usersmanagement);

  // console.log("214 CheckListstatus userForEdit ", userForEdit);

  const dispatch = useDispatch();

  // const [isProcessing, setIsProcessing] = useState(false);

  // console.log('CheckListstatus user', user?.onboarding?.onboarding_details?.passwords);

  // Check if all passwords and urls are not null
  const allCredentialsComplete =
    userForEdit?.onboarding?.onboarding_details?.passwords?.every(
      (item) => item?.password !== null && item?.user_name !== null
    ) || false;

    // console.log('userForEdit?.onboarding',userForEdit?.onboarding?.onboarding_process);

  const onClickStep4 = () => {
    // setIsProcessing(true);
    dispatch(fetchUserOnboardingStep5({ id: userForEdit?.user?.id })).then(
      (res) => {
        if (res?.payload?.meta?.status === 200) {
          // console.log("res step 5", res);
          // console.log("editeUserData42", res?.payload?.data);
          dispatch(editeUserData(res?.payload?.data));
          setStorage("user", res?.payload?.data);
          setCurrentStep(
            Number(res?.payload?.data?.onboarding?.onboarding_step)
          );
          setOnboardingProcess(
            Number(res?.payload?.data?.onboarding?.onboarding_process)
          );
          // setIsProcessing(false);
        }
      }
    );
    // fetchUserOnboardingStep5
  };

  return (
    <div className="w-full flex justify-center items-center py-5">
      <div className="w-[100%] md:w-[86%] lg:w-[46%] bg-gray border border-liteGray rounded-2xl p-6 md:p-8 lg:p-10">
        <div className="mb-8">
          <Title level={2}>Your Path to Full Access</Title>
          <Text className="text-[21px]" type="secondary">
            Each checklist item moves you closer to 100% of completion,
            unlocking full dashboard access.
            <Text className="text-[21px] text-primary">
            {" "}Please wait while your accounts listed below are being created by
              the admin.
            </Text>
          </Text>{" "}
        </div>

        <div className="flex items-center mb-5">
          <div className="mr-5">
            <img src={successBadge} alt="" className="" />
          </div>
          <Text className="text-[20px] md:text-[20px] lg:text-[24px] w-full">
            BrokerAIQ Account Created
          </Text>
        </div>

        <div className="flex items-center mb-5">
          <div className="mr-5">
            <img src={successBadge} className="" />
          </div>
          <Text className="text-[20px] md:text-[20px] lg:text-[24px] w-full">
            Loan Originator Engagement Agreement Signed
          </Text>
        </div>

        <div className="flex items-center mb-5">
          <div className="mr-5">
            <img src={successBadge} className="" />
          </div>
          <Text className="text-[20px] md:text-[20px] lg:text-[24px] w-full">
            Platform Fee Paid
          </Text>
        </div>

        {userForEdit?.onboarding?.onboarding_details?.passwords?.length > 0 &&
          userForEdit?.onboarding?.onboarding_details?.passwords.map(
            (item, index) => (
              <div className="flex items-center mb-5" key={item.id || index}>
                <div className="mr-5">
                  <img
                    src={
                      item.password !== null && item.user_name !== null
                        ? successBadge
                        : pendingBadge
                    }
                    alt=""
                  />
                </div>
                <Text className="text-[20px] md:text-[20px] lg:text-[24px] w-full">
                  {item.name}
                </Text>
              </div>
            )
          )}

        <Button
          disabled={userForEdit?.onboarding?.onboarding_process !== "100"}
          // disabled={!allCredentialsComplete}
          block
          type="primary"
          className="mt-5"
          size="large"
          onClick={onClickStep4}
          loading={onboardingStep5Loading}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default CheckListstatus;
