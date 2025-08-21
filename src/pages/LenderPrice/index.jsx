
import React from 'react';
import './LenderPrice.scss';
import { Col, Row, Typography } from 'antd';
import { Link } from 'react-router-dom';
import ShadowBoxContainer from '../../components/AuthLayout/ShadowBoxContainer';

const LenderPrice = () => {

    const { Text, Title } = Typography;

    return (
        <Row
            className="bg-darkGray px-header-wrapper h-full w-full"
            gutter={[0, 24]}
        >
            <Col
                span={24}
                className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mt-6"
            >
                <div className="flex justify-center items-center">
                    <Title
                        level={2}
                        className="text-white !m-0 h-auto flex flex-wrap sm:flex-nowrap justify-center items-center text-base sm:text-lg md:text-xl"
                    >
                        <Link
                            to="/dashboard"
                            className="text-primary hover:text-primary flex justify-center"
                        >
                            <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
                                Dashboard
                            </Text>
                        </Link>
                        <Text className="text-grayText mx-2">
                            {" "}
                            <i className="icon-right-arrow" />{" "}
                        </Text>
                        <Link
                            to="/lender-price"
                            className="text-primary hover:text-primary flex justify-center"
                        >
                            <Text className="text-white text-lg sm:text-2xl">Lender Price</Text>
                        </Link>
                    </Title>
                </div>
            </Col>
            {/* <ShadowBoxContainer height="calc(100vh - 200px)" shadowVisible={false}> */}
                <iframe
                    src="https://marketplace.digitallending.com/#/app/company/61cb49357f60e70001d4b1a5/quick-pricer"
                    title="External App"
                    style={{ width: '100%', height: '1080px', border: 'none' }}
                ></iframe>
            {/* </ShadowBoxContainer> */}
        </Row>
    )
}

export default LenderPrice
