import "./Page404.scss";

import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

const Page404 = () => {
  const navigate = useNavigate();

  return (
    <div className="container404 flex items-center justify-center h-[100vh]">
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={
          <Button
            type="primary"
            onClick={() => navigate(-1)}
            data-testid="back-home-btn"
          >
            Back Home
          </Button>
        }
      />
    </div>
  );
};

export default Page404;
