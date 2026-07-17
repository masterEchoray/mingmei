import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

async function bootstrap() {
  // 阶段一：启动 MSW 拦截 /api/v1/*，返回 Mock 数据。
  // 若 Service Worker 无法注册（例如非 HTTPS 环境），也不阻断页面渲染。
  try {
    const { startMockWorker } = await import('./mocks/browser');
    await startMockWorker();
  } catch (e) {
    console.error('[Mock] 启动失败，接口将无法返回数据，请使用 HTTPS 或 localhost 访问：', e);
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

bootstrap();
