import { Col, Row, Typography } from 'antd'
import React, { useEffect } from 'react'
import AppHeader from '../../../components/AuthLayout/Header'
import { getStorage } from '../../../utils/commonfunction';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loading from '../../../components/AuthLayout/Loading';

const UnderReview = () => {
    const { Text, Title } = Typography;
    // console.log("check1")

    const user = getStorage("user", true);
    const { userForEdit } = useSelector((state) => state?.usersmanagement);

    // console.log('UnderReview User Strore===>', userForEdit);
    // console.log('UnderReview User Local===>', user);

    const navigate = useNavigate();

    useEffect(() => {
        if (userForEdit?.user?.is_active === true) {
            navigate('/dashboard');
        }
    }, [userForEdit?.user?.is_active])

    // if (userForEditLoading) return <Loading />;

    return (
        <div>
            <>
                <Row className="w-full">
                    <Col xs={24}>
                        <div className="topAnimated"></div>
                    </Col>
                    <Col xs={24}>
                        <AppHeader />
                    </Col>
                </Row>
                <Row>
                    <div className="w-full loadingClass">
                        <div className="w-[94%] sm:w-[40%] flex flex-col items-center justify-center">
                            <div className="bg-primaryOpacity p-4 rounded-full w-fit">
                                <div className="bg-primary p-4 rounded-full">
                                    <i className="icon-referral-partner-perks before:!m-0 text-white text-7xl " />
                                </div>
                            </div>

                            <Text type="secondary" className="text-xl mt-5 text-center">
                                Your account is currently under review. Once it gets approved,
                                you will be able to track other progress here.
                            </Text>
                        </div>
                    </div>
                </Row>
            </>
        </div>
    )
}

export default UnderReview
