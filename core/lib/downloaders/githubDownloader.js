const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const EventEmitter = require('events');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

/**
 * GitHub Downloader for AIX Studio
 * Downloads releases, assets, and repositories from GitHub
 */
class GitHubDownloader extends EventEmitter {
  constructor(options = {}) {
    super();
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 3;
    this.userAgent = options.userAgent || 'AIX-Studio/1.0';
    this.githubToken = options.githubToken || process.env.GITHUB_TOKEN;
    this.verbose = options.verbose || false;
  }

  /**
   * Get repository information
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Object>} - Repository information
   */
  async getRepository(owner, repo) {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}`;
      
      this.emit('repo-info-start', { owner, repo, url });
      
      const headers = {
        'User-Agent': this.userAgent,
        'Accept': 'application/vnd.github.v3+json'
      };
      
      if (this.githubToken) {
        headers['Authorization'] = `token ${this.githubToken}`;
      }
      
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers
      });
      
      this.emit('repo-info-complete', response.data);
      
      return response.data;
    } catch (error) {
      this.emit('repo-info-error', { owner, repo, error: error.message });
      
      if (error.response && error.response.status === 404) {
        throw new Error(`Repository not found: ${owner}/${repo}`);
      }
      
      throw new Error(`Failed to get repository info: ${error.message}`);
    }
  }

  /**
   * List repository releases
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Object} options - List options
   * @returns {Promise<Array>} - Releases
   */
  async listReleases(owner, repo, options = {}) {
    try {
      const perPage = options.perPage || 30;
      const page = options.page || 1;
      
      const url = `https://api.github.com/repos/${owner}/${repo}/releases?per_page=${perPage}&page=${page}`;
      
      this.emit('releases-list-start', { owner, repo, url });
      
      const headers = {
        'User-Agent': this.userAgent,
        'Accept': 'application/vnd.github.v3+json'
      };
      
      if (this.githubToken) {
        headers['Authorization'] = `token ${this.githubToken}`;
      }
      
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers
      });
      
      this.emit('releases-list-complete', { owner, repo, count: response.data.length });
      
      return response.data;
    } catch (error) {
      this.emit('releases-list-error', { owner, repo, error: error.message });
      throw new Error(`Failed to list releases: ${error.message}`);
    }
  }

  /**
   * Get latest release
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Object>} - Latest release
   */
  async getLatestRelease(owner, repo) {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
      
      this.emit('latest-release-start', { owner, repo, url });
      
      const headers = {
        'User-Agent': this.userAgent,
        'Accept': 'application/vnd.github.v3+json'
      };
      
      if (this.githubToken) {
        headers['Authorization'] = `token ${this.githubToken}`;
      }
      
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers
      });
      
      this.emit('latest-release-complete', { owner, repo, tag: response.data.tag_name });
      
      return response.data;
    } catch (error) {
      this.emit('latest-release-error', { owner, repo, error: error.message });
      
      if (error.response && error.response.status === 404) {
        throw new Error(`No releases found for repository: ${owner}/${repo}`);
      }
      
      throw new Error(`Failed to get latest release: ${error.message}`);
    }
  }

  /**
   * Download release asset
   * @param {string} url - Asset download URL
   * @param {string} destination - Destination path
   * @param {Object} options - Download options
   * @returns {Promise<Object>} - Download result
   */
  async downloadAsset(url, destination, options = {}) {
    const startTime = Date.now();
    
    try {
      // Ensure destination directory exists
      await fs.ensureDir(path.dirname(destination));
      
      this.emit('asset-download-start', { url, destination });
      
      const headers = {
        'User-Agent': this.userAgent
      };
      
      if (this.githubToken) {
        headers['Authorization'] = `token ${this.githubToken}`;
      }
      
      const writer = fs.createWriteStream(destination);
      
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        timeout: this.timeout,
        headers,
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            this.emit('progress', { 
              url, 
              loaded: progressEvent.loaded, 
              total: progressEvent.total, 
              percent 
            });
          }
        }
      });
      
      response.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', async () => {
          try {
            const stats = await fs.stat(destination);
            const checksum = await this.calculateChecksum(destination);
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            this.emit('asset-download-complete', { 
              url, 
              destination, 
              size: stats.size,
              duration
            });
            
            resolve({
              success: true,
              url,
              destination,
              size: stats.size,
              duration,
              checksum: checksum,
              message: 'Asset downloaded successfully'
            });
          } catch (error) {
            reject(error);
          }
        });
        
        writer.on('error', (error) => {
          // Clean up partial file
          fs.unlink(destination).catch(() => {});
          this.emit('asset-download-error', { url, destination, error: error.message });
          reject(error);
        });
      });
    } catch (error) {
      this.emit('asset-download-error', { url, destination, error: error.message });
      throw new Error(`Failed to download asset: ${error.message}`);
    }
  }

  /**
   * Download release by tag
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} tag - Release tag
   * @param {string} assetName - Asset name to download
   * @param {string} destination - Destination path
   * @param {Object} options - Download options
   * @returns {Promise<Object>} - Download result
   */
  async downloadReleaseAsset(owner, repo, tag, assetName, destination, options = {}) {
    try {
      // Get release information
      let release;
      if (tag === 'latest') {
        release = await this.getLatestRelease(owner, repo);
      } else {
        const releases = await this.listReleases(owner, repo);
        release = releases.find(r => r.tag_name === tag);
        if (!release) {
          throw new Error(`Release with tag ${tag} not found`);
        }
      }
      
      // Find asset
      const asset = release.assets.find(a => a.name === assetName);
      if (!asset) {
        throw new Error(`Asset ${assetName} not found in release ${release.tag_name}`);
      }
      
      // Download asset
      const result = await this.downloadAsset(asset.browser_download_url, destination, options);
      
      return {
        ...result,
        release: release.tag_name,
        asset: asset.name
      };
    } catch (error) {
      throw new Error(`Failed to download release asset: ${error.message}`);
    }
  }

  /**
   * Clone repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} destination - Destination directory
   * @param {Object} options - Clone options
   * @returns {Promise<Object>} - Clone result
   */
  async cloneRepository(owner, repo, destination, options = {}) {
    const startTime = Date.now();
    
    try {
      // Ensure destination directory exists
      await fs.ensureDir(path.dirname(destination));
      
      this.emit('clone-start', { owner, repo, destination });
      
      const repoUrl = `https://github.com/${owner}/${repo}.git`;
      const branch = options.branch || 'main';
      const depth = options.depth || 1; // Shallow clone
      
      const cmd = `git clone --depth=${depth} --branch=${branch} ${repoUrl} "${destination}"`;
      
      const { stdout, stderr } = await execAsync(cmd, { 
        timeout: this.timeout,
        cwd: path.dirname(destination)
      });
      
      if (stderr && this.verbose) {
        console.warn('Git clone stderr:', stderr);
      }
      
      // Clean up .git directory to save space if requested
      if (options.cleanGitDir !== false) {
        const gitDir = path.join(destination, '.git');
        if (await fs.pathExists(gitDir)) {
          await fs.remove(gitDir);
        }
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.emit('clone-complete', { owner, repo, destination, duration });
      
      return {
        success: true,
        owner,
        repo,
        destination,
        duration,
        message: 'Repository cloned successfully'
      };
    } catch (error) {
      this.emit('clone-error', { owner, repo, destination, error: error.message });
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
  }

  /**
   * Download repository as ZIP
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} destination - Destination ZIP file path
   * @param {Object} options - Download options
   * @returns {Promise<Object>} - Download result
   */
  async downloadRepositoryZip(owner, repo, destination, options = {}) {
    try {
      const branch = options.branch || 'main';
      const url = `https://github.com/${owner}/${repo}/archive/${branch}.zip`;
      
      this.emit('repo-zip-start', { owner, repo, branch, url });
      
      // Ensure destination directory exists
      await fs.ensureDir(path.dirname(destination));
      
      const result = await this.downloadAsset(url, destination, options);
      
      this.emit('repo-zip-complete', { owner, repo, branch, destination });
      
      return {
        ...result,
        owner,
        repo,
        branch
      };
    } catch (error) {
      this.emit('repo-zip-error', { owner, repo, error: error.message });
      throw new Error(`Failed to download repository ZIP: ${error.message}`);
    }
  }

  /**
   * Search repositories
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Search results
   */
  async searchRepositories(query, options = {}) {
    try {
      const params = new URLSearchParams({
        q: query,
        sort: options.sort || 'stars',
        order: options.order || 'desc',
        per_page: options.perPage || 30
      });
      
      const url = `https://api.github.com/search/repositories?${params.toString()}`;
      
      this.emit('repo-search-start', { query, url });
      
      const headers = {
        'User-Agent': this.userAgent,
        'Accept': 'application/vnd.github.v3+json'
      };
      
      if (this.githubToken) {
        headers['Authorization'] = `token ${this.githubToken}`;
      }
      
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers
      });
      
      const results = response.data.items.map(item => ({
        id: item.id,
        name: item.name,
        fullName: item.full_name,
        description: item.description,
        stars: item.stargazers_count,
        forks: item.forks_count,
        language: item.language,
        updatedAt: item.updated_at,
        url: item.html_url,
        cloneUrl: item.clone_url
      }));
      
      this.emit('repo-search-complete', { query, count: results.length });
      
      return results;
    } catch (error) {
      this.emit('repo-search-error', { query, error: error.message });
      throw new Error(`Failed to search repositories: ${error.message}`);
    }
  }

  /**
   * Get file content from repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} path - File path
   * @param {string} ref - Git reference (branch, tag, commit)
   * @returns {Promise<Object>} - File content
   */
  async getFileContent(owner, repo, path, ref = 'main') {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`;
      
      this.emit('file-content-start', { owner, repo, path, ref, url });
      
      const headers = {
        'User-Agent': this.userAgent,
        'Accept': 'application/vnd.github.v3+json'
      };
      
      if (this.githubToken) {
        headers['Authorization'] = `token ${this.githubToken}`;
      }
      
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers
      });
      
      // Decode base64 content if it's a file
      let content = response.data.content;
      if (response.data.encoding === 'base64') {
        content = Buffer.from(content, 'base64').toString('utf8');
      }
      
      const result = {
        name: response.data.name,
        path: response.data.path,
        sha: response.data.sha,
        size: response.data.size,
        url: response.data.html_url,
        content: content,
        encoding: response.data.encoding,
        type: response.data.type
      };
      
      this.emit('file-content-complete', result);
      
      return result;
    } catch (error) {
      this.emit('file-content-error', { owner, repo, path, ref, error: error.message });
      
      if (error.response && error.response.status === 404) {
        throw new Error(`File not found: ${path} in ${owner}/${repo}`);
      }
      
      throw new Error(`Failed to get file content: ${error.message}`);
    }
  }

  /**
   * Calculate file checksum
   * @param {string} filePath - File path
   * @returns {Promise<string>} - SHA-256 checksum
   */
  async calculateChecksum(filePath) {
    const crypto = require('crypto');
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (error) => reject(error));
    });
  }

  /**
   * Validate GitHub token
   * @returns {Promise<boolean>} - True if token is valid
   */
  async validateToken() {
    if (!this.githubToken) {
      return false;
    }
    
    try {
      const headers = {
        'User-Agent': this.userAgent,
        'Authorization': `token ${this.githubToken}`
      };
      
      await axios.get('https://api.github.com/user', {
        timeout: this.timeout,
        headers
      });
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get rate limit information
   * @returns {Promise<Object>} - Rate limit info
   */
  async getRateLimit() {
    try {
      const headers = {
        'User-Agent': this.userAgent
      };
      
      if (this.githubToken) {
        headers['Authorization'] = `token ${this.githubToken}`;
      }
      
      const response = await axios.get('https://api.github.com/rate_limit', {
        timeout: this.timeout,
        headers
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get rate limit: ${error.message}`);
    }
  }

  /**
   * List repository contents
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} path - Directory path
   * @param {string} ref - Git reference
   * @returns {Promise<Array>} - Directory contents
   */
  async listContents(owner, repo, path = '', ref = 'main') {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`;
      
      this.emit('contents-list-start', { owner, repo, path, ref, url });
      
      const headers = {
        'User-Agent': this.userAgent,
        'Accept': 'application/vnd.github.v3+json'
      };
      
      if (this.githubToken) {
        headers['Authorization'] = `token ${this.githubToken}`;
      }
      
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers
      });
      
      const contents = response.data.map(item => ({
        name: item.name,
        path: item.path,
        type: item.type, // 'file' or 'dir'
        size: item.size,
        url: item.html_url,
        downloadUrl: item.download_url,
        sha: item.sha
      }));
      
      this.emit('contents-list-complete', { owner, repo, path, count: contents.length });
      
      return contents;
    } catch (error) {
      this.emit('contents-list-error', { owner, repo, path, ref, error: error.message });
      throw new Error(`Failed to list contents: ${error.message}`);
    }
  }
}

module.exports = GitHubDownloader;