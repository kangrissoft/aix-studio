const path = require('path');
const fs = require('fs-extra');

class DocsController {
  async generateDocs(req, res) {
    try {
      const projectId = req.query.projectId || 'default';
      const projectPath = path.join('projects', projectId);
      
      // Check if project exists
      if (!(await fs.pathExists(projectPath))) {
        return res.status(404).json({ 
          success: false, 
          message: 'Project not found' 
        });
      }
      
      // Generate documentation (mock implementation)
      const docs = await this.parseProjectDocs(projectPath);
      
      res.json({ 
        success: true, 
        message: 'Documentation generated',
        docs
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
  
  async previewDocs(req, res) {
    try {
      const projectId = req.query.projectId || 'default';
      const docsPath = path.join('projects', projectId, 'docs.html');
      
      // Check if docs exist
      if (!(await fs.pathExists(docsPath))) {
        return res.status(404).json({ 
          success: false, 
          message: 'Documentation not found. Generate docs first.' 
        });
      }
      
      // In real implementation, you'd serve the file
      res.json({
        success: true,
        url: `/api/docs/file/${projectId}/docs.html`
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
  
  async downloadDocs(req, res) {
    try {
      const projectId = req.query.projectId || 'default';
      const docsPath = path.join('projects', projectId, 'docs.html');
      
      if (!(await fs.pathExists(docsPath))) {
        return res.status(404).json({ 
          success: false, 
          message: 'Documentation not found' 
        });
      }
      
      res.download(docsPath);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
  
  async searchDocs(req, res) {
    try {
      const { q: query } = req.query;
      if (!query) {
        return res.status(400).json({ 
          success: false, 
          message: 'Search query required' 
        });
      }
      
      // Mock search results
      res.json({
        success: true,
        results: [
          { type: 'method', name: 'Greet', class: 'MyExtension' },
          { type: 'class', name: 'MyExtension', package: 'com.example' }
        ]
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
  
  async parseProjectDocs(projectPath) {
    // Mock documentation parsing
    return {
      classes: [
        {
          name: 'MyExtension',
          package: 'com.example',
          description: 'My Custom Extension',
          methods: [
            { 
              name: 'Greet', 
              returnType: 'String', 
              params: 'name: String',
              description: 'Greets a person by name'
            },
            { 
              name: 'CalculateSum', 
              returnType: 'int', 
              params: 'a: int, b: int',
              description: 'Calculates sum of two integers'
            }
          ],
          properties: [
            { 
              name: 'SampleProperty', 
              type: 'String',
              description: 'A sample property'
            }
          ]
        }
      ]
    };
  }
}

module.exports = new DocsController();