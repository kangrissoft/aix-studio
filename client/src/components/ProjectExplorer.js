import React, { useState, useEffect } from 'react';
import { 
  FolderOutlined, 
  FileOutlined, 
  PlusOutlined,
  DeleteOutlined,
  EditOutlined
} from '@ant-design/icons';
import { Tree, Button, Input, Popconfirm, message } from 'antd';

const ProjectExplorer = ({ 
  projectPath, 
  onFileSelect, 
  onRefresh,
  onCreateFile,
  onDeleteFile 
}) => {
  const [treeData, setTreeData] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (projectPath) {
      loadProjectStructure();
    }
  }, [projectPath]);

  const loadProjectStructure = async () => {
    try {
      // In a real implementation, this would call an API
      const mockTreeData = [
        {
          title: 'src',
          key: 'src',
          icon: <FolderOutlined />,
          children: [
            {
              title: 'com',
              key: 'src/com',
              icon: <FolderOutlined />,
              children: [
                {
                  title: 'example',
                  key: 'src/com/example',
                  icon: <FolderOutlined />,
                  children: [
                    {
                      title: 'MyExtension.java',
                      key: 'src/com/example/MyExtension.java',
                      icon: <FileOutlined />,
                      isLeaf: true
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          title: 'assets',
          key: 'assets',
          icon: <FolderOutlined />,
          children: [
            {
              title: 'images',
              key: 'assets/images',
              icon: <FolderOutlined />,
              children: [
                {
                  title: 'extension.png',
                  key: 'assets/images/extension.png',
                  icon: <FileOutlined />,
                  isLeaf: true
                }
              ]
            }
          ]
        },
        {
          title: 'libs',
          key: 'libs',
          icon: <FolderOutlined />
        },
        {
          title: 'build.xml',
          key: 'build.xml',
          icon: <FileOutlined />,
          isLeaf: true
        }
      ];

      setTreeData(mockTreeData);
      setExpandedKeys(['src', 'src/com', 'src/com/example', 'assets']);
    } catch (error) {
      message.error('Failed to load project structure');
    }
  };

  const onSelect = (selectedKeys, info) => {
    if (selectedKeys.length > 0) {
      onFileSelect(selectedKeys[0]);
    }
  };

  const onExpand = (expandedKeys) => {
    setExpandedKeys(expandedKeys);
  };

  const handleCreateFile = (parentKey, isDirectory = false) => {
    const newKey = `${parentKey}/new-${isDirectory ? 'folder' : 'file'}`;
    const newNode = {
      title: `new-${isDirectory ? 'folder' : 'file'}`,
      key: newKey,
      icon: isDirectory ? <FolderOutlined /> : <FileOutlined />,
      isLeaf: !isDirectory,
      isNew: true
    };

    setTreeData(prevData => {
      const newData = [...prevData];
      const updateNode = (nodes) => {
        return nodes.map(node => {
          if (node.key === parentKey) {
            return {
              ...node,
              children: [...(node.children || []), newNode]
            };
          }
          if (node.children) {
            return {
              ...node,
              children: updateNode(node.children)
            };
          }
          return node;
        });
      };
      return updateNode(newData);
    });

    setEditingKey(newKey);
    setEditValue(`new-${isDirectory ? 'folder' : 'file'}`);
  };

  const handleRename = (key) => {
    setEditingKey(key);
    const node = findNodeByKey(treeData, key);
    if (node) {
      setEditValue(node.title);
    }
  };

  const handleDelete = (key) => {
    setTreeData(prevData => {
      const newData = [...prevData];
      const removeNode = (nodes) => {
        return nodes.filter(node => {
          if (node.key === key) {
            return false;
          }
          if (node.children) {
            node.children = removeNode(node.children);
          }
          return true;
        });
      };
      return removeNode(newData);
    });
    onDeleteFile(key);
  };

  const findNodeByKey = (nodes, key) => {
    for (const node of nodes) {
      if (node.key === key) {
        return node;
      }
      if (node.children) {
        const found = findNodeByKey(node.children, key);
        if (found) return found;
      }
    }
    return null;
  };

  const saveEdit = () => {
    if (editingKey && editValue) {
      setTreeData(prevData => {
        const newData = [...prevData];
        const updateNode = (nodes) => {
          return nodes.map(node => {
            if (node.key === editingKey) {
              return {
                ...node,
                title: editValue,
                key: editingKey.replace(/\/[^/]+$/, `/${editValue}`)
              };
            }
            if (node.children) {
              return {
                ...node,
                children: updateNode(node.children)
              };
            }
            return node;
          });
        };
        return updateNode(newData);
      });
      setEditingKey(null);
      setEditValue('');
    }
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const titleRender = (nodeData) => {
    if (nodeData.isNew && editingKey === nodeData.key) {
      return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onPressEnter={saveEdit}
            onBlur={cancelEdit}
            autoFocus
            style={{ width: 120 }}
          />
        </div>
      );
    }

    if (editingKey === nodeData.key) {
      return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onPressEnter={saveEdit}
            style={{ width: 120 }}
          />
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <span>{nodeData.title}</span>
        <div>
          <Button 
            type="text" 
            size="small" 
            icon={<EditOutlined />} 
            onClick={() => handleRename(nodeData.key)}
          />
          {!nodeData.isLeaf && (
            <Button 
              type="text" 
              size="small" 
              icon={<PlusOutlined />} 
              onClick={() => handleCreateFile(nodeData.key, true)}
            />
          )}
          <Popconfirm
            title="Are you sure you want to delete this?"
            onConfirm={() => handleDelete(nodeData.key)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="text" 
              size="small" 
              icon={<DeleteOutlined />} 
              danger
            />
          </Popconfirm>
        </div>
      </div>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="small"
          onClick={() => handleCreateFile('', true)}
        >
          New Project
        </Button>
        <Button 
          style={{ marginLeft: '8px' }} 
          size="small"
          onClick={onRefresh}
        >
          Refresh
        </Button>
      </div>
      
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        <Tree
          showIcon
          defaultExpandAll
          expandedKeys={expandedKeys}
          selectedKeys={[]}
          treeData={treeData}
          onSelect={onSelect}
          onExpand={onExpand}
          titleRender={titleRender}
        />
      </div>
    </div>
  );
};

export default ProjectExplorer;