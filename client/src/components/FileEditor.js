import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { 
  PlayCircleOutlined, 
  SaveOutlined, 
  DownloadOutlined,
  FileSearchOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { 
  Button, 
  Space, 
  Select, 
  Input,
  Modal,
  message,
  Tabs
} from 'antd';

const { Option } = Select;
const { TabPane } = Tabs;

const FileEditor = ({ 
  filePath, 
  onSave, 
  onBuild,
  onDownload,
  initialContent = '',
  language = 'java'
}) => {
  const [code, setCode] = useState(initialContent);
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [isDirty, setIsDirty] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (filePath) {
      loadFileContent();
    }
  }, [filePath]);

  const loadFileContent = async () => {
    try {
      // In a real implementation, this would load from the file system
      // For now, we'll use mock content based on file extension
      let mockContent = '';
      let detectedLanguage = 'plaintext';
      
      if (filePath.endsWith('.java')) {
        detectedLanguage = 'java';
        mockContent = `package com.example;

import com.google.appinventor.components.annotations.*;
import com.google.appinventor.components.runtime.*;
import com.google.appinventor.components.common.*;

@DesignerComponent(
    version = 1,
    description = "My Extension",
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
}`;
      } else if (filePath.endsWith('.kt')) {
        detectedLanguage = 'kotlin';
        mockContent = `package com.example

import com.google.appinventor.components.annotations.*
import com.google.appinventor.components.runtime.*
import com.google.appinventor.components.common.*

@DesignerComponent(
    version = 1,
    description = "My Extension",
    category = ComponentCategory.EXTENSION,
    nonVisible = true,
    iconName = "images/extension.png"
)
@SimpleObject(external = true)
class MyExtension : AndroidNonvisibleComponent {
    
    constructor(container: ComponentContainer) : super(container.$form())
    
    @SimpleFunction
    fun greet(name: String): String {
        return "Hello, $name!"
    }
}`;
      } else if (filePath.endsWith('.xml')) {
        detectedLanguage = 'xml';
        mockContent = `<?xml version="1.0" encoding="UTF-8"?>
<project name="AppInventorExtension" default="package">
  <property name="src.dir" value="src"/>
  <property name="build.dir" value="build"/>
  <property name="dist.dir" value="dist"/>
  
  <target name="clean">
    <delete dir="\${build.dir}"/>
    <delete dir="\${dist.dir}"/>
  </target>
</project>`;
      } else {
        detectedLanguage = 'plaintext';
        mockContent = initialContent || `// ${filePath}\n\n`;
      }

      setCode(mockContent);
      setCurrentLanguage(detectedLanguage);
      setIsDirty(false);
    } catch (error) {
      message.error('Failed to load file content');
    }
  };

  const handleEditorChange = (value) => {
    setCode(value);
    setIsDirty(true);
  };

  const handleSave = () => {
    onSave(filePath, code);
    setIsDirty(false);
    message.success('File saved successfully');
  };

  const handleSearch = () => {
    setSearchVisible(true);
  };

  const performSearch = () => {
    // In a real implementation, this would use Monaco's search functionality
    message.info(`Searching for: ${searchTerm}`);
    setSearchVisible(false);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
        <Space>
          <Button 
            icon={<SaveOutlined />} 
            onClick={handleSave}
            disabled={!isDirty}
          >
            Save
          </Button>
          <Button 
            icon={<PlayCircleOutlined />} 
            type="primary" 
            onClick={onBuild}
          >
            Build
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={onDownload}
          >
            Download
          </Button>
          <Button 
            icon={<SearchOutlined />} 
            onClick={handleSearch}
          >
            Search
          </Button>
          
          <Select 
            value={currentLanguage} 
            style={{ width: 120 }}
            onChange={setCurrentLanguage}
            size="small"
          >
            <Option value="java">Java</Option>
            <Option value="kotlin">Kotlin</Option>
            <Option value="xml">XML</Option>
            <Option value="json">JSON</Option>
            <Option value="plaintext">Text</Option>
          </Select>
          
          {isDirty && (
            <span style={{ color: '#faad14' }}>●</span>
          )}
        </Space>
      </div>
      
      <div style={{ flex: 1 }}>
        <Editor
          height="100%"
          language={currentLanguage}
          value={code}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            suggestOnTriggerCharacters: true,
            wordBasedSuggestions: true,
            quickSuggestions: true
          }}
        />
      </div>
      
      <Modal
        title="Find in Files"
        visible={searchVisible}
        onCancel={() => setSearchVisible(false)}
        footer={null}
      >
        <Input.Search
          placeholder="Enter search term"
          enterButton="Search"
          size="large"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={performSearch}
        />
      </Modal>
    </div>
  );
};

export default FileEditor;