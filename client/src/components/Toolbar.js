import React from 'react';
import { 
  FileAddOutlined,
  FolderAddOutlined,
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
  CopyOutlined,
  CutOutlined,
  PasteOutlined,
  SearchOutlined,
  PlayCircleOutlined,
  BuildOutlined,
  BugOutlined,
  CloudDownloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { Space, Button, Divider } from 'antd';

const Toolbar = ({ 
  onNewFile,
  onNewFolder,
  onSave,
  onUndo,
  onRedo,
  onCopy,
  onCut,
  onPaste,
  onFind,
  onBuild,
  onRun,
  onDebug,
  onDeploy,
  onSettings
}) => {
  return (
    <div style={{ 
      padding: '8px', 
      borderBottom: '1px solid #d9d9d9',
      backgroundColor: '#fff'
    }}>
      <Space size="small">
        {/* File Operations */}
        <Button.Group>
          <Button 
            icon={<FileAddOutlined />} 
            title="New File"
            onClick={onNewFile}
          />
          <Button 
            icon={<FolderAddOutlined />} 
            title="New Folder"
            onClick={onNewFolder}
          />
          <Button 
            icon={<SaveOutlined />} 
            title="Save"
            onClick={onSave}
          />
        </Button.Group>
        
        <Divider type="vertical" />
        
        {/* Edit Operations */}
        <Button.Group>
          <Button 
            icon={<UndoOutlined />} 
            title="Undo"
            onClick={onUndo}
          />
          <Button 
            icon={<RedoOutlined />} 
            title="Redo"
            onClick={onRedo}
          />
          <Button 
            icon={<CopyOutlined />} 
            title="Copy"
            onClick={onCopy}
          />
          <Button 
            icon={<CutOutlined />} 
            title="Cut"
            onClick={onCut}
          />
          <Button 
            icon={<PasteOutlined />} 
            title="Paste"
            onClick={onPaste}
          />
        </Button.Group>
        
        <Divider type="vertical" />
        
        {/* Search */}
        <Button 
          icon={<SearchOutlined />} 
          title="Find"
          onClick={onFind}
        />
        
        <Divider type="vertical" />
        
        {/* Build Operations */}
        <Button.Group>
          <Button 
            icon={<PlayCircleOutlined />} 
            title="Run"
            type="primary"
            onClick={onRun}
          />
          <Button 
            icon={<BuildOutlined />} 
            title="Build"
            onClick={onBuild}
          />
          <Button 
            icon={<BugOutlined />} 
            title="Debug"
            onClick={onDebug}
          />
        </Button.Group>
        
        <Divider type="vertical" />
        
        {/* Deploy Operations */}
        <Button.Group>
          <Button 
            icon={<CloudDownloadOutlined />} 
            title="Deploy"
            onClick={onDeploy}
          />
          <Button 
            icon={<SettingOutlined />} 
            title="Settings"
            onClick={onSettings}
          />
        </Button.Group>
      </Space>
    </div>
  );
};

export default Toolbar;