import axios from 'axios';

const API_BASE = '/api';

class DocsService {
  async generateDocs() {
    try {
      const response = await axios.post(`${API_BASE}/docs/generate`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to generate documentation');
    }
  }
  
  async previewDocs() {
    try {
      const response = await axios.get(`${API_BASE}/docs/preview`);
      return response.data.url;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to preview documentation');
    }
  }
  
  async downloadDocs() {
    try {
      const response = await axios.get(`${API_BASE}/docs/download`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'documentation.html');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to download documentation');
    }
  }
  
  async searchDocs(query) {
    try {
      const response = await axios.get(`${API_BASE}/docs/search?q=${query}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to search documentation');
    }
  }
}

export default new DocsService();