import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  HomeOutlined,
  ProjectOutlined,
  FileOutlined,
  BuildOutlined,
  CloudDownloadOutlined,
  ExperimentOutlined,
  ReadOutlined,
  SyncOutlined,
  DeploymentUnitOutlined,
  SettingOutlined
} from '@ant-design/icons';
import 'antd/dist/reset.css';
import './App.css';

import Home from './pages/Home';
import Projects from './pages/Projects';
import Editor from './pages/Editor';
import Builder from './pages/Builder';
import Templates from './pages/Templates';
import Settings from './pages/Settings';
import Testing from './pages/Testing';
import Documentation from './pages/Documentation';
import Migration from './pages/Migration';
import Dependencies from './pages/Dependencies';

const { Header, Sider, Content } = Layout;

function App() {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider theme="light">
          <div className="logo">
            <h2>AIX Studio</h2>
          </div>
          <Menu mode="inline" defaultSelectedKeys={['1']}>
            <Menu.Item key="1" icon={<HomeOutlined />}>
              <a href="/">Dashboard</a>
            </Menu.Item>
            <Menu.Item key="2" icon={<ProjectOutlined />}>
              <a href="/projects">Projects</a>
            </Menu.Item>
            <Menu.Item key="3" icon={<FileOutlined />}>
              <a href="/editor">Editor</a>
            </Menu.Item>
            <Menu.Item key="4" icon={<BuildOutlined />}>
              <a href="/builder">Builder</a>
            </Menu.Item>
            <Menu.Item key="5" icon={<ExperimentOutlined />}>
              <a href="/testing">Testing</a>
            </Menu.Item>
            <Menu.Item key="6" icon={<ReadOutlined />}>
              <a href="/documentation">Documentation</a>
            </Menu.Item>
            <Menu.Item key="7" icon={<DeploymentUnitOutlined />}>
              <a href="/dependencies">Dependencies</a>
            </Menu.Item>
            <Menu.Item key="8" icon={<SyncOutlined />}>
              <a href="/migration">Migration</a>
            </Menu.Item>
            <Menu.Item key="9" icon={<CloudDownloadOutlined />}>
              <a href="/templates">Templates</a>
            </Menu.Item>
            <Menu.Item key="10" icon={<SettingOutlined />}>
              <a href="/settings">Settings</a>
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout>
          <Header style={{ background: '#fff', padding: 0 }} />
          <Content style={{ margin: '24px 16px 0' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/editor" element={<Editor />} />
              <Route path="/builder" element={<Builder />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/testing" element={<Testing />} />
              <Route path="/documentation" element={<Documentation />} />
              <Route path="/migration" element={<Migration />} />
              <Route path="/dependencies" element={<Dependencies />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
}

export default App;