import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Select, 
  Typography,
  Row,
  Col,
  Divider
} from 'antd';
import { 
  PlayCircleOutlined, 
  SaveOutlined, 
  DownloadOutlined,
  FileOutlined,
  FolderOutlined
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';

const { Title, Text } = Typography;
const { Option } = Select;

const EditorPage = () => {
  const [code, setCode] = useState(`package com.example;

import com.google.appinventor.components.annotations.*;
import com.google.appinventor.components.runtime.*;
import com.google.appinventor.components.common.*;

@DesignerComponent(
    version = 1,
    description = "My Custom Extension",
    category = ComponentCategory.EXTENSION,
    nonVisible = true,
    iconName = "images/extension.png"
)
@SimpleObject(external = true)
public class MyExtension extends AndroidNonvisibleComponent {
    
    public MyExtension(ComponentContainer container) {
        super(container.$form());
    }
    
    @SimpleFunction
    public String Greet(String name) {
        return "Hello, " + name + "!";
    }
}`);

  const [files, setFiles] = useState([
    { name: 'MyExtension.java', path: 'src/com/example/MyExtension.java', type: 'file' },
    { name: 'build.xml', path: 'build.xml', type: 'file' },
    { name: 'src', path: 'src', type: 'folder' },
    { name: 'assets', path: 'assets', type: 'folder' },
    { name: 'libs', path: 'libs', type: 'folder' }
  ]);

  const [selectedFile, setSelectedFile] = useState('src/com/example/MyExtension.java');

  const handleEditorChange = (value) => {
    setCode(value);
  };

  const handleBuild = () => {
    console.log('Building extension...');
    // Call build API
  };

  const handleSave = () => {
    console.log('Saving file...');
    // Call save API
  };

  const handleDownload = () => {
    console.log('Downloading extension...');
    // Call download API
  };

  return (
    <div>
      <Title level={2}>Code Editor</Title>
      
      <Row gutter={16}>
        <Col span={6}>
          <Card title="Project Files" size="small">
            {files.map((file, index) => (
              <div 
                key={index} 
                style={{ 
                  padding: '4px 8px', 
                  cursor: 'pointer',
                  backgroundColor: selectedFile === file.path ? '#e6f7ff' : 'transparent'
                }}
                onClick={() => setSelectedFile(file.path)}
              >
                {file.type === 'folder' ? <FolderOutlined /> : <FileOutlined />}
                <span style={{ marginLeft: '8px' }}>{file.name}</span>
              </div>
            ))}
          </Card>
        </Col>
        
        <Col span={18}>
          <Card 
            title={
              <Space>
                <Text>{selectedFile}</Text>
                <Select 
                  defaultValue="java" 
                  size="small"
                  style={{ width: 120 }}
                >
                  <Option value="java">Java</Option>
                  <Option value="kotlin">Kotlin</Option>
                  <Option value="xml">XML</Option>
                </Select>
              </Space>
            }
            extra={
              <Space>
                <Button icon={<SaveOutlined />} onClick={handleSave}>
                  Save
                </Button>
                <Button icon={<PlayCircleOutlined />} type="primary" onClick={handleBuild}>
                  Build
                </Button>
                <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                  Download
                </Button>
              </Space>
            }
          >
            <Editor
              height="600px"
              defaultLanguage="java"
              defaultValue={code}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                scrollBeyondLastLine: false,
                automaticLayout: true
              }}
            />
          </Card>
          
          <Divider />
          
          <Card title="Build Output" size="small">
            <pre style={{ 
              backgroundColor: '#000', 
              color: '#0f0', 
              padding: '16px', 
              borderRadius: '4px',
              height: '150px',
              overflow: 'auto'
            }}>
              {`> Building extension...
> Compiling Java sources...
> Creating .aix file...
> Build successful!
> Extension: dist/my-extension.aix`}
            </pre>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EditorPage;