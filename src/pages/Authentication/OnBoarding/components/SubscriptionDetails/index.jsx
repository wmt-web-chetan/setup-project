import { Col, Row, Typography } from "antd";
import React from "react";
import './SubscriptionDetails.scss';
import aiBadge from "../../../../../assets/SVGs/AI-Bullet.svg";
import ogBadge from "../../../../../assets/SVGs/Orange-Bullet.svg";

import PaymentForm from "../../../PaymentForm";
import { getStorage } from "../../../../../utils/commonfunction";

const SubscriptionDetails = ({ onNext, setCurrentStep, setOnboardingProcess }) => {
  const { Text, Title } = Typography;

  const user = getStorage("user", true);

  // console.log('user',user);

  return (
    <Row
      className="bg-gray rounded-2xl border border-liteGray p-6"
      gutter={[0, 24]}
    >
      <Col xs={24} md={24} lg={8} xl={10}>
        <div className="bg-gray rounded-2xl border border-liteGray">
          <div className="relative bg-darkGray rounded-t-2xl ">
            <div className="absolute h-full w-full overflow-hidden rounded-t-2xl">
              <div className="elipceBot absolute p-[360px] right-[50%] top-[-40%] "></div>
              <div className="elipceBot absolute p-[320px] left-[57%] bottom-[-44%] "></div>
            </div>
            <div className="py-14 text-center pb-28">
              <Text className="text-[32px] z-10">
                Subscribe and Unlock Full Access!
              </Text>
            </div>
            <div className="moneyPlant absolute bottom-[-24%] left-[7%] bg-liteGray flex items-center rounded-lg p-3 w-[86%] z-10">
              <div className="bg-primaryOpacity rounded-lg p-[6px]">
                <i className="icon-subscription before:!m-0 text-primary text-7xl " />
              </div>
              <div className="ml-3">
                <div className="">
                  <Text className="text-primary mb-3">Monthly Plan</Text>
                </div>
                <div className="flex items-end">
                  <Title level={2} className="!m-0">
                    ${user?.onboarding?.onboarding_details?.plan?.[0]?.price}
                  </Title>
                  <Text type="secondary" className="ml-1">
                    /month
                  </Text>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center ">
            <div className="mt-24 w-[86%] mb-8">
              <Title level={4} type="secondary">
                Inclusions
              </Title>
              <div className="mb-1 flex">
                <img src={aiBadge} alt="" className="mr-2" />
                <Text>Product & Pricing Genie</Text>
              </div>
              <div className="mb-1 flex">
                <img src={aiBadge} alt="" className="mr-2" />

                <Text>Automated AI Loan Matching</Text>
              </div>
              <div className="mb-1 flex">
                <img src={ogBadge} alt="" className="mr-2" />

                <Text>Onboarding & Training</Text>
              </div>
              <div className="mb-1 flex">
                <img src={ogBadge} alt="" className="mr-2" />
                <Text>Community Access</Text>
              </div>
              <div className="mb-1 flex">
                <img src={ogBadge} alt="" className="mr-2" />
                <Text>Recruitment & Referrals</Text>
              </div>
              <div className="mb-1 flex">
                <img src={ogBadge} alt="" className="mr-2" />
                <Text>Quickly Connect with Account Executives</Text>
              </div>
            </div>
          </div>
        </div>
      </Col>
      <Col xs={24} md={24} lg={16} xl={14} className="lg:pl-14">
        <PaymentForm onNext={onNext} setCurrentStep={setCurrentStep} setOnboardingProcess={setOnboardingProcess}/>
      </Col>
    </Row>
  );
};

export default SubscriptionDetails;