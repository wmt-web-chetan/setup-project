import { createRoot } from "react-dom/client";
import "./index.scss";
import "./assets/LO-Icons/fontello-fb90d374/css/fontello.css"
import App from "./App.jsx";
import { ConfigProvider, theme } from "antd";
import { antConfig } from "./utils/antConfig.js";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./services/Store/index.js";
import '@ant-design/v5-patch-for-react-19';

createRoot(document.getElementById("root")).render(
  <ConfigProvider theme={antConfig} >
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </ConfigProvider>
);
