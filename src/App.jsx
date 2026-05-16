import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { APIConfigProvider } from './context/APIConfigContext';
import { TransformProvider } from './context/TransformContext';
import Layout from './components/layout/Layout';

// 懒加载页面以优化初始加载性能
const Dashboard = lazy(() => import('./pages/Dashboard'));
const APIConfigManager = lazy(() => import('./pages/APIConfigManager'));
const APITransformer = lazy(() => import('./pages/APITransformer'));
const APITester = lazy(() => import('./pages/APITester'));
const UsageGuide = lazy(() => import('./pages/UsageGuide'));

function App() {
  return (
    <APIConfigProvider>
      <TransformProvider>
        <Router>
          <Layout>
            <Suspense fallback={<div className="flex h-full items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/config" element={<APIConfigManager />} />
                <Route path="/transform" element={<APITransformer />} />
                <Route path="/test" element={<APITester />} />
                <Route path="/guide" element={<UsageGuide />} />
              </Routes>
            </Suspense>
          </Layout>
        </Router>
      </TransformProvider>
    </APIConfigProvider>
  );
}

export default App;
