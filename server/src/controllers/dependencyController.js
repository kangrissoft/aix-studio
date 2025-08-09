const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');

class DependencyController {
  async listDependencies(req, res) {
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
      
      // Get dependencies from libs folder
      const libsPath = path.join(projectPath, 'libs');
      let dependencies = [];
      
      if (await fs.pathExists(libsPath)) {
        const libFiles = await fs.readdir(libsPath);
        dependencies = libFiles.map(file => ({
          id: file.replace(/[^a-zA-Z0-9]/g, ''),
          name: file.replace(/-\d+\.\d+\.\d+.*\.jar$/, ''),
          version: this.extractVersion(file),
          file: file,
          size: this.getFileSize(path.join(libsPath, file))
        }));
      }
      
      res.json({
        success: true,
        dependencies
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
  
  async addDependency(req, res) {
    try {
      const { name, version = 'latest' } = req.body;
      const projectId = req.query.projectId || 'default';
      const projectPath = path.join('projects', projectId);
      
      if (!(await fs.pathExists(projectPath))) {
        return res.status(404).json({ 
          success: false, 
          message: 'Project not found' 
        });
      }
      
      // Search and download dependency from Maven Central
      const libInfo = await this.searchMavenCentral(name, version);
      if (!libInfo) {
        return res.status(404).json({ 
          success: false, 
          message: `Dependency '${name}' not found` 
        });
      }
      
      // Download the library
      await this.downloadLibrary(projectPath, libInfo);
      
      res.json({
        success: true,
        message: `Dependency ${libInfo.name}@${libInfo.version} added successfully`,
        dependency: libInfo
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
  
  async removeDependency(req, res) {
    try {
      const { id } = req.params;
      const projectId = req.query.projectId || 'default';
      const projectPath = path.join('projects', projectId);
      
      if (!(await fs.pathExists(projectPath))) {
        return res.status(404).json({ 
          success: false, 
          message: 'Project not found' 
        });
      }
      
      // Find and remove dependency file
      const libsPath = path.join(projectPath, 'libs');
      if (await fs.pathExists(libsPath)) {
        const libFiles = await fs.readdir(libsPath);
        const fileToRemove = libFiles.find(file => 
          file.replace(/[^a-zA-Z0-9]/g, '') === id
        );
        
        if (fileToRemove) {
          await fs.remove(path.join(libsPath, fileToRemove));
        }
      }
      
      res.json({
        success: true,
        message: 'Dependency removed successfully'
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
  
  async searchMavenCentral(req, res) {
    try {
      const { q: query } = req.query;
      if (!query) {
        return res.status(400).json({ 
          success: false, 
          message: 'Search query required' 
        });
      }
      
      const results = await this.searchMavenCentral(query);
      
      res.json({
        success: true,
        results
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
  
  async updateDependency(req, res) {
    try {
      const { id } = req.params;
      const { version } = req.body;
      const projectId = req.query.projectId || 'default';
      const projectPath = path.join('projects', projectId);
      
      if (!(await fs.pathExists(projectPath))) {
        return res.status(404).json({ 
          success: false, 
          message: 'Project not found' 
        });
      }
      
      // Remove old version and add new version
      await this.removeDependency({ params: { id }, query: { projectId } }, { json: () => {} });
      // Add new version logic here
      
      res.json({
        success: true,
        message: 'Dependency updated successfully'
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
  
  async checkForUpdates(req, res) {
    try {
      const projectId = req.query.projectId || 'default';
      const projectPath = path.join('projects', projectId);
      
      if (!(await fs.pathExists(projectPath))) {
        return res.status(404).json({ 
          success: false, 
          message: 'Project not found' 
        });
      }
      
      // Check for dependency updates
      const updates = await this.checkDependencyUpdates(projectPath);
      
      res.json({
        success: true,
        updates
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
  
  async searchMavenCentral(name, version) {
    try {
      // Search Maven Central API
      const searchUrl = `https://search.maven.org/solrsearch/select?q=${name}&rows=1&wt=json`;
      const response = await axios.get(searchUrl);
      
      if (response.data.response.docs.length === 0) {
        return null;
      }
      
      const doc = response.data.response.docs[0];
      const libVersion = version === 'latest' ? doc.latestVersion : version;
      
      return {
        name: doc.a,
        group: doc.g,
        version: libVersion,
        downloadUrl: `https://repo1.maven.org/maven2/${doc.g.replace(/\./g, '/')}/${doc.a}/${libVersion}/${doc.a}-${libVersion}.jar`,
        description: doc.p || 'No description available'
      };
    } catch (error) {
      throw new Error(`Failed to search Maven Central: ${error.message}`);
    }
  }
  
  async downloadLibrary(projectPath, libInfo) {
    try {
      const libsPath = path.join(projectPath, 'libs');
      await fs.ensureDir(libsPath);
      
      const response = await axios({
        method: 'GET',
        url: libInfo.downloadUrl,
        responseType: 'stream'
      });
      
      const fileName = `${libInfo.name}-${libInfo.version}.jar`;
      const filePath = path.join(libsPath, fileName);
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } catch (error) {
      throw new Error(`Failed to download library: ${error.message}`);
    }
  }
  
  extractVersion(filename) {
    const match = filename.match(/-(\d+\.\d+\.\d+)/);
    return match ? match[1] : 'unknown';
  }
  
  getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const sizeInKB = (stats.size / 1024).toFixed(1);
      return `${sizeInKB} KB`;
    } catch (error) {
      return 'unknown';
    }
  }
  
  async checkDependencyUpdates(projectPath) {
    // Mock implementation - in real scenario, check versions against Maven Central
    return [
      { name: 'gson', current: '2.8.9', latest: '2.10.1', updateAvailable: true },
      { name: 'commons-lang3', current: '3.12.0', latest: '3.12.0', updateAvailable: false }
    ];
  }
}

module.exports = new DependencyController();