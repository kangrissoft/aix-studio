import React, { useState, useEffect, useRef } from 'react';
import { 
  PlayCircleOutlined, 
  ClearOutlined,
  DownloadOutlined,
  FileSearchOutlined
} from '@ant-design/icons';
import { 
  Button, 
  Space, 
  Select,
  Input,
  Progress,
  Badge,
  message
} from 'antd';

const { Option } = Select;

const BuildOutput = ({ 
  onBuild,
  onClean,
  onDownload,
  initialOutput = '',
  buildStatus = 'idle'
}) => {
  const [output, setOutput] = useState(initialOutput);
  const [status, setStatus] = useState(buildStatus);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState(0);
  const [warnings, setWarnings] = useState(0);
  const outputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [output]);

  const scrollToBottom = () => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  };

  const handleBuild = async () => {
    setStatus('building');
    setProgress(0);
    setErrors(0);
    setWarnings(0);
    setOutput('Starting build...\n');
    
    try {
      // Simulate build process
      const steps = [
        'Compiling Java sources...',
        'Creating JAR file...',
        'Packaging extension...',
        'Build completed successfully!'
      ];
      
      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProgress(((i + 1) / steps.length) * 100);
        setOutput(prev => prev + steps[i] + '\n');
        
        if (steps[i].includes('completed successfully')) {
          setStatus('success');
        } else if (steps[i].includes('error') || steps[i].includes('failed')) {
          setStatus('error');
          setErrors(prev => prev + 1);
        } else if (steps[i].includes('warning')) {
          setWarnings(prev => prev + 1);
        }
      }
      
      onBuild();
    } catch (error) {
      setStatus('error');
      setOutput(prev => prev + `Build failed: ${error.message}\n`);
      message.error('Build failed');
    }
  };

  const handleClean = () => {
    setOutput('');
    setStatus('idle');
    setProgress(0);
    setErrors(0);
    setWarnings(0);
    onClean();
  };

  const clearOutput = () => {
    setOutput('');
  };

  const getBuildStatus = () => {
    switch (status) {
      case 'building': return { color: 'processing', text: 'Building...' };
      case 'success': return { color: 'success', text: 'Success' };
      case 'error': return { color: 'error', text: 'Failed' };
      default: return { color: 'default', text: 'Idle' };
    }
  };

  const { color, text } = getBuildStatus();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
        <Space>
          <Badge 
            status={color} 
            text={text} 
          />
          
          <Button 
            icon={<PlayCircleOutlined />} 
            type="primary" 
            onClick={handleBuild}
            loading={status === 'building'}
            disabled={status === 'building'}
          >
            Build Extension
          </Button>
          
          <Button 
            icon={<ClearOutlined />} 
            onClick={handleClean}
          >
            Clean Build
          </Button>
          
          <Button 
            icon={<DownloadOutlined />} 
            onClick={onDownload}
            disabled={status !== 'success'}
          >
            Download
          </Button>
          
          <Button 
            icon={<ClearOutlined />} 
            onClick={clearOutput}
            disabled={!output}
          >
            Clear
          </Button>
          
          <Progress 
            percent={progress} 
            size="small" 
            style={{ width: 100 }}
          />
          
          <Space>
            <Badge status="error" text={`Errors: ${errors}`} />
            <Badge status="warning" text={`Warnings: ${warnings}`} />
          </Space>
        </Space>
      </div>
      
      <div 
        ref={outputRef}
        style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: '#000',
          color: '#0f0',
          padding: '16px',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          fontSize: '12px'
        }}
      >
        {output || 'No build output yet. Click "Build Extension" to start.'}
      </div>
      
      <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
        <Input
          placeholder="Filter output..."
          prefix={<FileSearchOutlined />}
          size="small"
          style={{ width: 200 }}
        />
      </div>
    </div>
  );
};

export default BuildOutput;