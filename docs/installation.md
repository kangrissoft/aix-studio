# Installation Guide

Complete guide to installing and setting up AIX Studio for App Inventor Extension development.

## 📋 System Requirements

### Minimum Requirements

- **Operating System**: Windows 10+, macOS 10.14+, Ubuntu 18.04+ (64-bit)
- **RAM**: 4 GB minimum (8 GB recommended)
- **Disk Space**: 2 GB free space
- **Internet Connection**: Required for initial setup and dependency downloads

### Recommended Requirements

- **Operating System**: Windows 11, macOS 12+, Ubuntu 20.04+
- **RAM**: 8 GB or more
- **Disk Space**: 5 GB free space
- **Processor**: Multi-core CPU (Intel i5/AMD Ryzen 5 or better)

## 🛠️ Prerequisites

Before installing AIX Studio, ensure you have the following software installed:

### 1. Node.js and npm

**Required Version**: Node.js 14.x or higher

#### Windows Installation

1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Run the installer and follow the setup wizard
3. Verify installation:
```bash
node --version
npm --version
```

#### macOS Installation

Using Homebrew (recommended):
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Verify installation
node --version
npm --version
```

Using official installer:
1. Download from [nodejs.org](https://nodejs.org/)
2. Run the .pkg installer
3. Verify installation in Terminal:
```bash
node --version
npm --version
```

#### Linux Installation (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install Node.js using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

For other Linux distributions:
```bash
# CentOS/RHEL/Fedora
sudo dnf install nodejs npm

# Arch Linux
sudo pacman -S nodejs npm
```

### 2. Java Development Kit (JDK)

**Required Version**: JDK 11 (OpenJDK or Oracle JDK)

#### Windows Installation

1. Download OpenJDK 11 from [Adoptium](https://adoptium.net/) or Oracle JDK
2. Run the installer
3. Set environment variables:
```cmd
# Add to System Environment Variables
JAVA_HOME=C:\Program Files\Java\jdk-11.x.x
PATH=%PATH%;%JAVA_HOME%\bin
```

#### macOS Installation

Using Homebrew:
```bash
# Install OpenJDK 11
brew install openjdk@11

# Create symlink for system Java wrappers
sudo ln -sfn /opt/homebrew/opt/openjdk@11/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-11.jdk

# Set JAVA_HOME
echo 'export JAVA_HOME=/Library/Java/JavaVirtualMachines/openjdk-11.jdk/Contents/Home' >> ~/.zshrc
source ~/.zshrc

# Verify installation
java -version
javac -version
```

Using official installer:
1. Download from [Oracle](https://www.oracle.com/java/technologies/javase-jdk11-downloads.html) or [Adoptium](https://adoptium.net/)
2. Run the installer
3. Set JAVA_HOME in `~/.zshrc` or `~/.bash_profile`:
```bash
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-11.x.x.jdk/Contents/Home
export PATH=$PATH:$JAVA_HOME/bin
```

#### Linux Installation

Ubuntu/Debian:
```bash
# Install OpenJDK 11
sudo apt update
sudo apt install openjdk-11-jdk

# Set JAVA_HOME
echo 'export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64' >> ~/.bashrc
source ~/.bashrc

# Verify installation
java -version
javac -version
```

CentOS/RHEL/Fedora:
```bash
# Install OpenJDK 11
sudo dnf install java-11-openjdk-devel

# Set JAVA_HOME
echo 'export JAVA_HOME=/usr/lib/jvm/java-11-openjdk' >> ~/.bashrc
source ~/.bashrc

# Verify installation
java -version
javac -version
```

### 3. Apache Ant

**Required Version**: Apache Ant 1.10.x or higher

#### Windows Installation

1. Download Apache Ant from [ant.apache.org](https://ant.apache.org/bindownload.cgi)
2. Extract to `C:\apache-ant-1.10.x`
3. Set environment variables:
```cmd
# Add to System Environment Variables
ANT_HOME=C:\apache-ant-1.10.x
PATH=%PATH%;%ANT_HOME%\bin
```

#### macOS Installation

Using Homebrew:
```bash
# Install Apache Ant
brew install ant

# Verify installation
ant -version
```

Manual installation:
1. Download from [ant.apache.org](https://ant.apache.org/bindownload.cgi)
2. Extract to `/usr/local/apache-ant`
3. Set environment variables in `~/.zshrc`:
```bash
export ANT_HOME=/usr/local/apache-ant
export PATH=$PATH:$ANT_HOME/bin
```

#### Linux Installation

Ubuntu/Debian:
```bash
# Install Apache Ant
sudo apt update
sudo apt install ant

# Verify installation
ant -version
```

Manual installation:
1. Download from [ant.apache.org](https://ant.apache.org/bindownload.cgi)
2. Extract to `/opt/apache-ant`
3. Set environment variables:
```bash
echo 'export ANT_HOME=/opt/apache-ant' >> ~/.bashrc
echo 'export PATH=$PATH:$ANT_HOME/bin' >> ~/.bashrc
source ~/.bashrc
```

## 🚀 Installing AIX Studio

### Method 1: From Source (Recommended)

#### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/aix-studio.git
cd aix-studio

# Or download and extract the ZIP file
# wget https://github.com/yourusername/aix-studio/archive/main.zip
# unzip main.zip
# cd aix-studio-main
```

#### 2. Install Dependencies

```bash
# Install all project dependencies
npm install

# This will install dependencies for:
# - Client (React frontend)
# - Server (Node.js backend)
# - Core (shared libraries)
```

#### 3. Environment Configuration

Create a `.env` file in the `server/` directory:
```bash
# server/.env
PORT=3001
NODE_ENV=development
JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64  # Adjust for your system
ANT_HOME=/usr/share/ant  # Adjust for your system
```

#### 4. Build the Application

```bash
# Build the client application
npm run build --workspace=client

# Build the server application
npm run build --workspace=server
```

#### 5. Start AIX Studio

```bash
# Development mode (with hot reloading)
npm run dev

# Production mode
npm start

# Access AIX Studio at http://localhost:3001
```

### Method 2: Using Docker (Alternative)

#### 1. Install Docker

**Windows**: Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)

**macOS**: 
```bash
# Using Homebrew
brew install --cask docker

# Or download from docker.com
```

**Linux**:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
# Logout and login again
```

#### 2. Clone and Run with Docker

```bash
# Clone the repository
git clone https://github.com/yourusername/aix-studio.git
cd aix-studio

# Build Docker images
docker-compose build

# Start AIX Studio
docker-compose up -d

# Access AIX Studio at http://localhost:3001

# Stop AIX Studio
docker-compose down
```

### Method 3: Pre-built Binary (Coming Soon)

```bash
# Download pre-built binary (when available)
# wget https://github.com/yourusername/aix-studio/releases/download/v1.0.0/aix-studio-linux-x64.tar.gz

# Extract
# tar -xzf aix-studio-linux-x64.tar.gz

# Run
# ./aix-studio
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the server directory with the following variables:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Java Configuration
JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
ANT_HOME=/usr/share/ant

# Project Directories
PROJECTS_DIR=./projects
UPLOADS_DIR=./uploads

# Security
SESSION_SECRET=your-secret-key-here
JWT_SECRET=your-jwt-secret-here

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/aix-studio.log
```

### IDE Integration

#### VS Code Setup

Install recommended extensions:
1. **ESLint** - JavaScript linting
2. **Prettier** - Code formatting
3. **Java Extension Pack** - Java support
4. **Debugger for Chrome** - Client-side debugging

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.format.enable": true,
  "java.home": "/usr/lib/jvm/java-11-openjdk-amd64"
}
```

#### IntelliJ IDEA Setup

1. Install Node.js plugin
2. Install Java plugin
3. Configure SDK:
   - File → Project Structure → SDKs
   - Add JDK 11
4. Set up run configurations for client and server

## 🔧 Verification

### Check Installation

After installation, verify all components are working:

```bash
# Check Node.js and npm
node --version
npm --version

# Check Java
java -version
javac -version

# Check Apache Ant
ant -version

# Check Git (for cloning)
git --version
```

### Test AIX Studio

1. Start AIX Studio:
```bash
npm run dev
```

2. Open browser and navigate to `http://localhost:3001`

3. Create a test project:
   - Click "Create New Project"
   - Choose "Component Extension (Java)"
   - Name it "TestExtension"
   - Click "Create Project"

4. Test build functionality:
   - Go to Builder tab
   - Click "Build Extension"
   - Verify build completes successfully

5. Check generated files:
```bash
# Navigate to projects directory
ls -la projects/TestExtension/
# Should show: src/, libs/, assets/, build.xml, etc.
```

## 🎯 First-Time Setup

### 1. Initial Configuration

When you first open AIX Studio:

1. **Set up development environment**:
   - Go to Settings → Development Environment
   - Verify Java and Ant paths are correct
   - Click "Validate Environment"

2. **Configure user preferences**:
   - Choose theme (Light/Dark)
   - Set language preference
   - Configure auto-save settings

3. **Create your first project**:
   - Navigate to Projects tab
   - Click "Create New Project"
   - Select a template
   - Configure project settings

### 2. Download Essential Libraries

AIX Studio will automatically download required libraries, but you can manually add others:

1. Go to Dependencies tab
2. Search for libraries like:
   - `gson` for JSON parsing
   - `retrofit` for HTTP requests
   - `commons-lang3` for utilities

3. Click "Add Dependency" for each library

## 🚨 Troubleshooting

### Common Installation Issues

#### 1. "Command not found" Errors

**Problem**: Commands like `node`, `npm`, `java`, `ant` are not recognized

**Solution**:
```bash
# Check if commands are in PATH
echo $PATH

# Add to PATH (Linux/macOS)
echo 'export PATH=$PATH:/usr/local/bin' >> ~/.bashrc
source ~/.bashrc

# Windows: Add to System Environment Variables
```

#### 2. Java Version Issues

**Problem**: Wrong Java version or JAVA_HOME not set

**Solution**:
```bash
# Check Java version
java -version

# Set JAVA_HOME correctly
# Linux/macOS:
export JAVA_HOME=/path/to/jdk-11
# Windows:
set JAVA_HOME=C:\Program Files\Java\jdk-11

# Add to shell profile for persistence
echo 'export JAVA_HOME=/path/to/jdk-11' >> ~/.bashrc
```

#### 3. Port Conflicts

**Problem**: Port 3001 is already in use

**Solution**:
```bash
# Change port in .env file
echo "PORT=3002" >> server/.env

# Or kill process using the port
# Linux/macOS:
lsof -i :3001
kill -9 <PID>

# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

#### 4. Permission Errors

**Problem**: Permission denied when installing or running

**Solution**:
```bash
# Linux/macOS: Use sudo for system installations
sudo npm install -g some-package

# Fix npm permissions
sudo chown -R $(whoami) ~/.npm

# Docker: Add user to docker group
sudo usermod -aG docker $USER
```

#### 5. Build Failures

**Problem**: Extension build fails

**Solution**:
```bash
# Check Java and Ant installation
java -version
ant -version

# Verify build.xml exists
ls -la build.xml

# Check source code compilation
cd projects/YourProject
ant compile
```

### Debugging Steps

1. **Check logs**:
```bash
# Server logs
tail -f server/logs/aix-studio.log

# Client console (browser DevTools)
# Press F12 → Console tab
```

2. **Verify environment**:
```bash
# Run environment validation
npm run validate

# Or manually check:
node --version
npm --version
java -version
javac -version
ant -version
```

3. **Clear cache**:
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install

# Clear build cache
npm run clean
```

## 🔒 Security Considerations

### Secure Installation

1. **Use official sources** for downloading software
2. **Verify checksums** when available
3. **Keep software updated** to latest stable versions
4. **Use strong passwords** for any authentication
5. **Regular security scans** of dependencies

### Firewall Configuration

If running on a server:

```bash
# Allow AIX Studio port (default 3001)
# Ubuntu/Debian with UFW:
sudo ufw allow 3001

# CentOS/RHEL with firewalld:
sudo firewall-cmd --add-port=3001/tcp --permanent
sudo firewall-cmd --reload
```

## 📱 Mobile Development Considerations

### Android SDK (Optional)

For advanced Android integration:

```bash
# Download Android Studio from developer.android.com
# Install Android SDK
# Set ANDROID_HOME environment variable
export ANDROID_HOME=/path/to/android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

## 🎯 Performance Optimization

### System Optimization

1. **Allocate sufficient RAM** to development environment
2. **Use SSD storage** for faster builds
3. **Close unnecessary applications** during development
4. **Enable hardware acceleration** in Docker settings

### AIX Studio Optimization

```bash
# Increase Node.js memory limit (if needed)
export NODE_OPTIONS="--max-old-space-size=4096"

# Enable production mode for better performance
export NODE_ENV=production
```

## 🔄 Updates and Maintenance

### Keeping AIX Studio Updated

```bash
# Pull latest changes from repository
git pull origin main

# Update dependencies
npm install

# Rebuild application
npm run build

# Restart AIX Studio
npm start
```

### Backup Configuration

```bash
# Backup important files
cp -r projects/ projects-backup-$(date +%Y%m%d)
cp server/.env .env.backup
cp -r ~/.aix-studio/ ~/.aix-studio-backup/
```

## 🆘 Getting Help

### Community Support

- **GitHub Issues**: [github.com/yourusername/aix-studio/issues](https://github.com/yourusername/aix-studio/issues)
- **Documentation**: Refer to other guides in the `docs/` directory
- **Community Forum**: (Link to community forum when available)

### Professional Support

For enterprise users:
- Email: support@yourcompany.com
- SLA: 24-hour response time
- Priority bug fixes and feature requests

## 📈 Next Steps

After successful installation:

1. **Create your first extension** using the tutorial in `docs/tutorial.md`
2. **Explore the interface** and familiarize yourself with all tabs
3. **Join the community** to share extensions and get help
4. **Contribute** to the project by reporting bugs or suggesting features

### Quick Start Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Check code quality
npm run lint

# Clean build artifacts
npm run clean
```

This installation guide provides everything you need to get AIX Studio up and running for professional App Inventor Extension development.
