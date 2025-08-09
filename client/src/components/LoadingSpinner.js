import React from 'react';
import { Spin, Alert } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const LoadingSpinner = ({ 
  spinning = true,
  tip = 'Loading...',
  size = 'large',
  fullscreen = false,
  children = null
}) => {
  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

  if (fullscreen) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
        zIndex: 1000
      }}>
        <Spin 
          indicator={antIcon} 
          size={size} 
          tip={tip}
        />
      </div>
    );
  }

  return (
    <Spin 
      spinning={spinning}
      indicator={antIcon}
      size={size}
      tip={tip}
    >
      {children || <div style={{ textAlign: 'center', padding: '50px' }}>
        <Alert
          message="Loading"
          description={tip}
          type="info"
          showIcon
        />
      </div>}
    </Spin>
  );
};

export default LoadingSpinner;