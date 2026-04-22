import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { ConfigProvider, theme } from 'antd';
import { store } from './store';
import App from './App';
import zhCN from 'antd/locale/zh_CN';
import '@xyflow/react/dist/style.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ConfigProvider locale={zhCN} theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          colorBgContainer: '#001529',
          colorBgElevated: '#001529',
          colorText: '#fff',
          colorTextSecondary: '#999'
        }
      }}>
        <App />
      </ConfigProvider>
    </Provider>
  </React.StrictMode>
);