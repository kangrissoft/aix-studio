import React from 'react';
import { Modal as AntModal, Button } from 'antd';

const Modal = ({ 
  visible,
  title,
  children,
  onOk,
  onCancel,
  okText = 'OK',
  cancelText = 'Cancel',
  width = 520,
  footer = null,
  ...props
}) => {
  const defaultFooter = footer === null ? [
    <Button key="cancel" onClick={onCancel}>
      {cancelText}
    </Button>,
    <Button key="ok" type="primary" onClick={onOk}>
      {okText}
    </Button>
  ] : footer;

  return (
    <AntModal
      visible={visible}
      title={title}
      onOk={onOk}
      onCancel={onCancel}
      okText={okText}
      cancelText={cancelText}
      width={width}
      footer={defaultFooter}
      {...props}
    >
      {children}
    </AntModal>
  );
};

export default Modal;