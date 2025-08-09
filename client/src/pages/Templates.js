import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography,
  List,
  Input,
  Select,
  Tag,
  Divider
} from 'antd';
import { 
  CloudDownloadOutlined, 
  PlusOutlined,
  SearchOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const Templates = () => {
  const [templates] = useState([
    {
      id: 1,
      name: 'Component Extension (Java)',
      description: 'Basic component extension template using Java',
      language: 'Java',
      category: 'Component',
      author: 'AIX Studio Team',
      version: '1.0.0',
      downloads: 1245
    },
    {
      id: 2,
      name: 'Sensor Extension (Java)',
      description: 'Sensor-based extension template using Java',
      language: 'Java',
      category: 'Sensor',
      author: 'AIX Studio Team',
      version: '1.0.0',
      downloads: 892
    },
    {
      id: 3,
      name: 'Component Extension (Kotlin)',
      description: 'Basic component extension template using Kotlin',
      language: 'Kotlin',
      category: 'Component',
      author: 'AIX Studio Team',
      version: '1.0.0',
      downloads: 654
    },
    {
      id: 4,
      name: 'UI Extension (Java)',
      description: 'User interface extension template using Java',
      language: 'Java',
      category: 'UI',
      author: 'AIX Studio Team',
      version: '1.0.0',
      downloads: 432
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Component', 'Sensor', 'UI', 'Utility'];

  const filteredTemplates = selectedCategory === 'All' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  return (
    <div>
      <Title level={2}>Templates</Title>
      
      <Card title="Template Gallery">
        <Space style={{ marginBottom: '16px' }}>
          <Search 
            placeholder="Search templates..." 
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
          <Select 
            defaultValue="All" 
            style={{ width: 120 }}
            onChange={setSelectedCategory}
          >
            {categories.map(category => (
              <Option key={category} value={category}>{category}</Option>
            ))}
          </Select>
          <Button icon={<PlusOutlined />}>Create Template</Button>
        </Space>
        
        <List
          grid={{ gutter: 16, column: 2 }}
          dataSource={filteredTemplates}
          renderItem={item => (
            <List.Item>
              <Card 
                title={item.name}
                extra={<Tag color={item.language === 'Java' ? 'blue' : 'purple'}>{item.language}</Tag>}
                actions={[
                  <Button 
                    type="primary" 
                    icon={<CloudDownloadOutlined />}
                    size="small"
                  >
                    Use Template
                  </Button>
                ]}
              >
                <Text type="secondary">{item.description}</Text>
                <div style={{ marginTop: '8px' }}>
                  <Text strong>Category: </Text>
                  <Tag>{item.category}</Tag>
                </div>
                <div>
                  <Text strong>Author: </Text>
                  <Text>{item.author}</Text>
                </div>
                <div>
                  <Text strong>Version: </Text>
                  <Text>{item.version}</Text>
                </div>
                <div>
                  <Text strong>Downloads: </Text>
                  <Text>{item.downloads}</Text>
                </div>
              </Card>
            </List.Item>
          )}
        />
      </Card>
      
      <Divider />
      
      <Card title="Custom Templates">
        <Button type="dashed" block style={{ height: '200px' }}>
          <PlusOutlined />
          <div>Upload Custom Template</div>
        </Button>
      </Card>
    </div>
  );
};

export default Templates;