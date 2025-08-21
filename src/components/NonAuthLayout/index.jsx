import { Layout } from "antd";
import React, { Suspense } from "react";
import { Content } from "antd/es/layout/layout";
import Headers from "../AuthLayout/Header";
import { Outlet, useLocation } from "react-router-dom";
import Footer from "../AuthLayout/Footer";

const NonAuth = (props) => {
  return (
    <Layout>
      <Headers />
      <div className="min-h-[calc(100vh-8vh)] pt-[8vh]">
        <div className="">
          <Content>
            <Suspense fallback="loading">
              <Outlet></Outlet>
            </Suspense>
          </Content>
        </div>
      </div>
      <Footer />
    </Layout>
  );
};

export default NonAuth;
