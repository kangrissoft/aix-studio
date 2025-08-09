import React, { useState, useEffect } from 'react';
import { 
  CheckCircleOutlined, 
  WarningOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  CloudOutlined,
  DatabaseOutlined,
  CodeOutlined
} from '@ant-design/icons';
import { Space, Tooltip, Tag } from 'antd';

const StatusBar = ({ 
  status = 'ready',
  message = 'Ready',
  projectName = 'Untitled',
  projectPath = '',
  connectionStatus = 'connected',
  language = 'java',
  fileCount = 0,
  buildStatus = 'idle'
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'ready':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'busy':
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
      default:
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CloudOutlined style={{ color: '#52c41a' }} />;
      case 'disconnected':
        return <CloudOutlined style={{ color: '#ff4d4f' }} />;
      case 'connecting':
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
      default:
        return <CloudOutlined style={{ color: '#faad14' }} />;
    }
  };

  const getBuildIcon = () => {
    switch (buildStatus) {
      case 'building':
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <DatabaseOutlined style={{ color: '#faad14' }} />;
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '4px 16px',
      backgroundColor: '#f5f5f5',
      borderTop: '1px solid #d9d9d9',
      fontSize: '12px'
    }}>
      <Space size="large">
        <Space>
          <Tooltip title={message}>
            <span>
              {getStatusIcon()}
              <span style={{ marginLeft: '4px' }}>{status}</span>
            </span>
          </Tooltip>
        </Space>
        
        <Space>
          <Tooltip title="Project">
            <span>
              <CodeOutlined />
              <span style={{ marginLeft: '4px' }}>{projectName}</span>
            </span>
          </Tooltip>
        </Space>
        
        <Space>
          <Tooltip title="Files">
            <span>
              <DatabaseOutlined />
              <span style={{ marginLeft: '4px' }}>{fileCount} files</span>
            </span>
          </Tooltip>
        </Space>
        
        <Space>
          <Tooltip title="Language">
            <Tag color={language === 'java' ? 'blue' : 'purple'}>
              {language}
            </Tag>
          </Tooltip>
        </Space>
      </Space>
      
      <Space size="large">
        <Space>
          <Tooltip title="Connection Status">
            <span>
              {getConnectionIcon()}
              <span style={{ marginLeft: '4px' }}>{connectionStatus}</span>
            </span>
          </Tooltip>
        </Space>
        
        <Space>
          <Tooltip title="Build Status">
            <span>
              {getBuildIcon()}
              <span style={{ marginLeft: '4px' }}>{buildStatus}</span>
            </span>
          </Tooltip>
        </Space>
        
        <Space>
          <Tooltip title="Current Time">
            <span>
              {currentTime.toLocaleTimeString()}
            </span>
          </Tooltip>
        </Space>
      </Space>
    </div>
  );
};

export default StatusBar;