import React, { useState, useEffect } from 'react';
import { notification as antNotification } from 'antd';
import { 
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const Notification = ({ 
  type = 'info',
  message,
  description,
  duration = 4.5,
  placement = 'topRight',
  onClose = () => {},
  ...props
}) => {
  const [api, contextHolder] = antNotification.useNotification();

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'info':
      default:
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const showNotification = () => {
    api[type]({
      message,
      description,
      icon: getIcon(),
      duration,
      placement,
      onClose,
      ...props
    });
  };

  useEffect(() => {
    if (message) {
      showNotification();
    }
  }, [message, description, type]);

  return (
    <>
      {contextHolder}
      {api}
    </>
  );
};

export default Notification;