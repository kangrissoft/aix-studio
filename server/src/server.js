const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../client/dist')));

// Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Create project
app.post('/api/projects', async (req, res) => {
  try {
    const { name, language, template } = req.body;
    
    // Create project directory
    const projectPath = path.join('projects', name);
    await fs.ensureDir(projectPath);
    
    // Initialize project structure based on template
    await initializeProject(projectPath, language, template);
    
    res.json({ 
      success: true, 
      message: 'Project created successfully',
      projectId: name,
      path: projectPath
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get projects
app.get('/api/projects', async (req, res) => {
  try {
    const projectsDir = 'projects';
    await fs.ensureDir(projectsDir);
    
    const projects = await fs.readdir(projectsDir);
    const projectList = [];
    
    for (const project of projects) {
      const projectPath = path.join(projectsDir, project);
      const stat = await fs.stat(projectPath);
      
      if (stat.isDirectory()) {
        projectList.push({
          id: project,
          name: project,
          createdAt: stat.birthtime,
          lastModified: stat.mtime
        });
      }
    }
    
    res.json({ projects: projectList });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Build extension
app.post('/api/build/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectPath = path.join('projects', projectId);
    
    // Check if project exists
    if (!(await fs.pathExists(projectPath))) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }
    
    // Run build process
    const buildResult = await buildExtension(projectPath);
    
    res.json({ 
      success: true, 
      message: 'Build completed',
      result: buildResult
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Download extension
app.get('/api/download/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectPath = path.join('projects', projectId);
    const aixPath = path.join(projectPath, 'dist', `${projectId}.aix`);
    
    if (!(await fs.pathExists(aixPath))) {
      return res.status(404).json({ 
        success: false, 
        message: 'Extension not found. Please build first.' 
      });
    }
    
    res.download(aixPath);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Initialize project structure
async function initializeProject(projectPath, language, template) {
  // Create standard directories
  await fs.ensureDir(path.join(projectPath, 'src'));
  await fs.ensureDir(path.join(projectPath, 'assets'));
  await fs.ensureDir(path.join(projectPath, 'libs'));
  await fs.ensureDir(path.join(projectPath, 'dist'));
  await fs.ensureDir(path.join(projectPath, 'build'));
  
  // Create build.xml based on language
  const buildXml = language === 'kotlin' 
    ? createKotlinBuildXml()
    : createJavaBuildXml();
  
  await fs.writeFile(path.join(projectPath, 'build.xml'), buildXml);
  
  // Create sample extension file
  const sampleCode = language === 'kotlin'
    ? createKotlinSample(template)
    : createJavaSample(template);
  
  const packagePath = 'com/example';
  await fs.ensureDir(path.join(projectPath, 'src', packagePath));
  
  const fileName = language === 'kotlin' ? 'MyExtension.kt' : 'MyExtension.java';
  await fs.writeFile(
    path.join(projectPath, 'src', packagePath, fileName), 
    sampleCode
  );
}

// Build extension using Ant
function buildExtension(projectPath) {
  return new Promise((resolve, reject) => {
    const ant = spawn('ant', ['package'], {
      cwd: projectPath,
      shell: true
    });
    
    let output = '';
    let error = '';
    
    ant.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    ant.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    ant.on('close', (code) => {
      if (code === 0) {
        resolve({ output, success: true });
      } else {
        reject(new Error(`Build failed: ${error}`));
      }
    });
  });
}

// Build XML templates
function createJavaBuildXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<project name="AppInventorExtension" default="package">
  <property name="src.dir" value="src"/>
  <property name="build.dir" value="build"/>
  <property name="dist.dir" value="dist"/>
  <property name="libs.dir" value="libs"/>
  <property name="assets.dir" value="assets"/>

  <path id="classpath">
    <fileset dir="\${libs.dir}" includes="**/*.jar"/>
  </path>

  <target name="clean">
    <delete dir="\${build.dir}"/>
    <delete dir="\${dist.dir}"/>
  </target>

  <target name="init">
    <mkdir dir="\${build.dir}"/>
    <mkdir dir="\${dist.dir}"/>
  </target>

  <target name="compile" depends="init">
    <javac srcdir="\${src.dir}" destdir="\${build.dir}" includeantruntime="false"
           source="11" target="11" encoding="UTF-8">
      <classpath refid="classpath"/>
    </javac>
  </target>

  <target name="package" depends="compile">
    <jar destfile="\${dist.dir}/\${ant.project.name}.aix" basedir="\${build.dir}">
      <fileset dir="\${assets.dir}" />
      <manifest>
        <attribute name="Built-By" value="AIX Studio"/>
        <attribute name="Created-By" value="AIX Studio"/>
      </manifest>
    </jar>
    <echo message="Extension built: \${dist.dir}/\${ant.project.name}.aix"/>
  </target>
</project>`;
}

function createKotlinBuildXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<project name="AppInventorExtension" default="package">
  <property name="src.dir" value="src"/>
  <property name="build.dir" value="build"/>
  <property name="dist.dir" value="dist"/>
  <property name="libs.dir" value="libs"/>
  <property name="assets.dir" value="assets"/>
  <property name="kotlin.version" value="1.8.0"/>

  <path id="kotlin.classpath">
    <fileset dir="\${libs.dir}" includes="kotlin-*.jar"/>
    <fileset dir="\${libs.dir}" includes="appinventor-components.jar"/>
    <fileset dir="\${libs.dir}" includes="android.jar"/>
  </path>

  <taskdef resource="META-INF/services/org.jetbrains.kotlin.ant.KotlinAntTaskDef.xml" 
           classpathref="kotlin.classpath"/>

  <target name="clean">
    <delete dir="\${build.dir}"/>
    <delete dir="\${dist.dir}"/>
  </target>

  <target name="init">
    <mkdir dir="\${build.dir}"/>
    <mkdir dir="\${dist.dir}"/>
  </target>

  <target name="compile" depends="init">
    <kotlinc src="\${src.dir}" output="\${build.dir}" classpathref="kotlin.classpath">
      <compilerarg value="-jvm-target"/>
      <compilerarg value="11"/>
    </kotlinc>
  </target>

  <target name="package" depends="compile">
    <jar destfile="\${dist.dir}/\${ant.project.name}.aix" basedir="\${build.dir}">
      <fileset dir="\${assets.dir}" />
      <manifest>
        <attribute name="Built-By" value="AIX Studio"/>
        <attribute name="Created-By" value="AIX Studio"/>
        <attribute name="Language" value="Kotlin"/>
      </manifest>
    </jar>
    <echo message="Extension built: \${dist.dir}/\${ant.project.name}.aix"/>
  </target>
</project>`;
}

// Sample code templates
function createJavaSample(template) {
  return `package com.example;

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
        super(container.\$form());
    }
    
    @SimpleFunction
    public String Greet(String name) {
        return "Hello, " + name + "!";
    }
}`;
}

function createKotlinSample(template) {
  return `package com.example

import com.google.appinventor.components.annotations.*
import com.google.appinventor.components.runtime.*
import com.google.appinventor.components.common.*

@DesignerComponent(
    version = 1,
    description = "My Custom Extension",
    category = ComponentCategory.EXTENSION,
    nonVisible = true,
    iconName = "images/extension.png"
)
@SimpleObject(external = true)
class MyExtension : AndroidNonvisibleComponent {
    
    constructor(container: ComponentContainer) : super(container.\$form())
    
    @SimpleFunction
    fun Greet(name: String): String {
        return "Hello, \$name!"
    }
}`;
}

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 AIX Studio Server running on port ${PORT}`);
});