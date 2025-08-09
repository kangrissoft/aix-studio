import React, { useState } from 'react';
import { 
  HomeOutlined,
  ProjectOutlined,
  FileTextOutlined,
  BuildOutlined,
  ExperimentOutlined,
  ReadOutlined,
  CloudDownloadOutlined,
  DeploymentUnitOutlined,
  SettingOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { Menu, Layout } from 'antd';

const { Sider } = Layout;

const Sidebar = ({ 
  activeKey = 'explorer',
  onMenuItemClick,
  collapsed = false,
  onCollapse
}) => {
  const [selectedKey, setSelectedKey] = useState(activeKey);

  const menuItems = [
    {
      key: 'dashboard',
      icon: <HomeOutlined />,
      label: 'Dashboard'
    },
    {
      key: 'projects',
      icon: <ProjectOutlined />,
      label: 'Projects'
    },
    {
      key: 'explorer',
      icon: <FileTextOutlined />,
      label: 'File Explorer'
    },
    {
      key: 'editor',
      icon: <FileTextOutlined />,
      label: 'Code Editor'
    },
    {
      key: 'build',
      icon: <BuildOutlined />,
      label: 'Build'
    },
    {
      key: 'test',
      icon: <ExperimentOutlined />,
      label: 'Testing'
    },
    {
      key: 'docs',
      icon: <ReadOutlined />,
      label: 'Documentation'
    },
    {
      key: 'dependencies',
      icon: <DeploymentUnitOutlined />,
      label: 'Dependencies'
    },
    {
      key: 'templates',
      icon: <CloudDownloadOutlined />,
      label: 'Templates'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings'
    },
    {
      key: 'help',
      icon: <QuestionCircleOutlined />,
      label: 'Help'
    }
  ];

  const handleClick = ({ key }) => {
    setSelectedKey(key);
    onMenuItemClick(key);
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={200}
      style={{
        background: '#fff',
        borderRight: '1px solid #f0f0f0'
      }}
    >
      <div style={{ height: 32, margin: 16, background: 'rgba(255,255,255,.3)' }} />
      
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        onClick={handleClick}
        items={menuItems}
        style={{ height: '100%', borderRight: 0 }}
      />
    </Sider>
  );
};

export default Sidebar;