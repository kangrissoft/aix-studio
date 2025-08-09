# Project Migration Guide

Complete guide to migrating existing App Inventor Extension projects to modern AIX Studio format.

## 🎯 Overview

AIX Studio provides powerful migration tools to help you upgrade legacy App Inventor Extension projects to modern standards. Whether you have old build systems, outdated dependencies, or legacy code structures, the migration system can help modernize your projects.

## 📋 Migration Scenarios

### Common Migration Types

1. **Legacy Build System Migration** - Upgrade from old Ant build files
2. **Language Migration** - Convert Java projects to Kotlin
3. **Structure Migration** - Reorganize project directory structure
4. **Dependency Migration** - Update outdated libraries
5. **Full Migration** - Complete project modernization

## 🔍 Analyzing Your Project

### Running Project Analysis

Before migration, analyze your current project:

1. Navigate to the **Migration** tab in AIX Studio
2. Click **"Analyze Project"**
3. Review the analysis report
4. Identify migration needs

### Analysis Report Components

The analysis provides detailed information:

```bash
📊 Project Analysis Results:
============================
Project Type: ant (legacy)
Language: java
Source Code: ✅ Found (src/main/java/)
Libraries: ✅ Found (libs/)
Assets: ✅ Found (assets/)
Build File: ⚠️ Outdated (build.xml)

⚠️ Issues Found:
   • Build file uses deprecated compiler options
   • Using outdated appinventor-components.jar (v1.0)
   • No unit tests found
   • Missing documentation
   • Non-standard directory structure

🔧 Migration Recommended:
   • Build System Modernization
   • Dependency Updates
   • Testing Setup
   • Documentation Generation
```

### Migration Priority Levels

Issues are categorized by priority:

- **Critical**: Must fix for project to work
- **High**: Important for maintainability
- **Medium**: Nice to have improvements
- **Low**: Optional enhancements

## 🚀 Migration Types

### 1. Build System Migration

#### What it does:
- Updates `build.xml` to modern format
- Ensures Java 11 compatibility
- Adds proper source/target settings
- Includes Kotlin support if needed
- Optimizes build performance

#### Before Migration:
```xml
<!-- Old build.xml -->
<project name="MyExtension" default="jar">
    <target name="compile">
        <javac srcdir="src" destdir="build" 
               classpath="libs/appinventor.jar"/>
    </target>
</project>
```

#### After Migration:
```xml
<!-- Modern build.xml -->
<project name="MyExtension" default="package">
    <property name="src.dir" value="src"/>
    <property name="build.dir" value="build"/>
    <property name="dist.dir" value="dist"/>
    
    <path id="classpath">
        <fileset dir="${libs.dir}" includes="**/*.jar"/>
    </path>
    
    <target name="compile" depends="init">
        <javac srcdir="${src.dir}" destdir="${build.dir}" 
               includeantruntime="false"
               source="11" target="11" encoding="UTF-8">
            <classpath refid="classpath"/>
        </javac>
    </target>
</project>
```

#### Running Build Migration:
```bash
# In AIX Studio Migration tab:
# Select "Build System Only" migration type
# Click "Start Migration"

# Or via CLI (if available):
aix migrate build --project MyLegacyProject
```

### 2. Language Migration (Java to Kotlin)

#### What it does:
- Converts `.java` files to `.kt` files
- Updates syntax to Kotlin conventions
- Preserves functionality
- Updates build system for Kotlin support
- Downloads Kotlin libraries

#### Before Migration (Java):
```java
package com.example;

import com.google.appinventor.components.annotations.*;
import com.google.appinventor.components.runtime.*;

@DesignerComponent(version = 1, description = "My Extension")
@SimpleObject(external = true)
public class MyExtension extends AndroidNonvisibleComponent {
    
    public MyExtension(ComponentContainer container) {
        super(container.$form());
    }
    
    @SimpleFunction
    public String greet(String name) {
        return "Hello, " + name + "!";
    }
}
```

#### After Migration (Kotlin):
```kotlin
package com.example

import com.google.appinventor.components.annotations.*
import com.google.appinventor.components.runtime.*

@DesignerComponent(version = 1, description = "My Extension")
@SimpleObject(external = true)
class MyExtension : AndroidNonvisibleComponent {
    
    constructor(container: ComponentContainer) : super(container.$form())
    
    @SimpleFunction
    fun greet(name: String): String {
        return "Hello, $name!"
    }
}
```

#### Running Language Migration:
```bash
# In AIX Studio Migration tab:
# Select "Convert to Kotlin" migration type
# Click "Start Migration"

# Or via CLI:
aix migrate kotlin --project MyJavaProject
```

### 3. Structure Migration

#### What it does:
- Reorganizes directory structure to standard format
- Moves files to proper locations
- Creates missing directories
- Updates build configurations
- Ensures proper package naming

#### Before Migration (Legacy Structure):
```
MyLegacyProject/
├── Source/
│   └── com/
│       └── example/
│           └── MyExtension.java
├── Libraries/
│   └── appinventor.jar
├── Assets/
│   └── icon.png
└── build.xml
```

#### After Migration (Standard Structure):
```
MyLegacyProject/
├── src/
│   └── com/
│       └── example/
│           └── MyExtension.java
├── libs/
│   └── appinventor-components.jar
├── assets/
│   └── images/
│       └── icon.png
├── test/
│   └── com/
│       └── example/
│           └── MyExtensionTest.java
├── docs/
├── build/
├── dist/
├── build.xml
├── README.md
└── package.json
```

#### Running Structure Migration:
```bash
# In AIX Studio Migration tab:
# Select "Structure Reorganization" migration type
# Click "Start Migration"

# Or via CLI:
aix migrate structure --project MyLegacyProject
```

### 4. Dependency Migration

#### What it does:
- Updates outdated libraries
- Downloads latest versions from Maven Central
- Removes deprecated dependencies
- Resolves version conflicts
- Optimizes library sizes

#### Before Migration (Outdated Dependencies):
```
libs/
├── appinventor.jar (v1.0 - 2018)
├── gson-2.2.4.jar (2013)
├── commons-lang-2.6.jar (2011)
└── httpclient-4.3.6.jar (2014)
```

#### After Migration (Modern Dependencies):
```
libs/
├── appinventor-components-2.0.jar (2024)
├── gson-2.10.1.jar (2023)
├── commons-lang3-3.14.0.jar (2024)
└── okhttp-4.12.0.jar (2024)
```

#### Running Dependency Migration:
```bash
# In AIX Studio Migration tab:
# Select "Update Dependencies" migration type
# Click "Start Migration"

# Or via CLI:
aix migrate deps --project MyLegacyProject
```

### 5. Full Migration

#### What it does:
- Complete project modernization
- Backup creation before migration
- All migration types combined
- Testing setup
- Documentation generation
- Quality assurance

#### Migration Steps in Full Migration:
1. ✅ Create project backup
2. ✅ Reorganize directory structure
3. ✅ Modernize build system
4. ✅ Update dependencies
5. ✅ Convert to Kotlin (optional)
6. ✅ Setup testing framework
7. ✅ Generate documentation
8. ✅ Quality validation

#### Running Full Migration:
```bash
# In AIX Studio Migration tab:
# Select "Full Migration" migration type
# Configure options (backup, kotlin, etc.)
# Click "Start Migration"

# Or via CLI:
aix migrate full --project MyLegacyProject --backup --kotlin
```

## 🛠️ Manual Migration Steps

### Before Migration Checklist

1. **Backup your project**:
```bash
# Create manual backup
cp -r MyLegacyProject MyLegacyProject-backup-$(date +%Y%m%d)
```

2. **Document current state**:
   - Note current dependencies
   - Document custom build steps
   - Save any special configurations
   - Record project version and last build date

3. **Test current functionality**:
   - Ensure project builds successfully
   - Verify all features work
   - Note any existing issues

### Step-by-Step Manual Migration

#### Step 1: Initialize AIX Studio Project

```bash
# Create new project structure using AIX Studio
# Or manually create standard structure:

mkdir MyModernProject
cd MyModernProject
mkdir -p src/com/example
mkdir -p libs assets test docs build dist
```

#### Step 2: Migrate Source Code

```bash
# Copy source files to new structure
cp -r ../MyLegacyProject/Source/* src/

# Update package declarations if needed
# Update imports to modern App Inventor libraries
```

#### Step 3: Update Build System

Replace old `build.xml` with modern version:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project name="AppInventorExtension" default="package">
  <property name="src.dir" value="src"/>
  <property name="build.dir" value="build"/>
  <property name="dist.dir" value="dist"/>
  <property name="libs.dir" value="libs"/>
  <property name="assets.dir" value="assets"/>

  <path id="classpath">
    <fileset dir="${libs.dir}" includes="**/*.jar"/>
  </path>

  <target name="clean">
    <delete dir="${build.dir}"/>
    <delete dir="${dist.dir}"/>
  </target>

  <target name="init">
    <mkdir dir="${build.dir}"/>
    <mkdir dir="${dist.dir}"/>
  </target>

  <target name="compile" depends="init">
    <javac srcdir="${src.dir}" destdir="${build.dir}" 
           includeantruntime="false"
           source="11" target="11" encoding="UTF-8">
      <classpath refid="classpath"/>
    </javac>
  </target>

  <target name="package" depends="compile">
    <jar destfile="${dist.dir}/${ant.project.name}.aix" 
         basedir="${build.dir}">
      <fileset dir="${assets.dir}" />
      <manifest>
        <attribute name="Built-By" value="AIX Studio"/>
        <attribute name="Created-By" value="AIX Studio"/>
        <attribute name="Version" value="1.0.0"/>
      </manifest>
    </jar>
    <echo message="Extension built: ${dist.dir}/${ant.project.name}.aix"/>
  </target>
</project>
```

#### Step 4: Update Dependencies

```bash
# Remove old libraries
rm libs/*.jar

# Download modern libraries
# Use AIX Studio Dependencies tab or manually download:

# App Inventor Components
wget -O libs/appinventor-components.jar \
  "https://github.com/mit-cml/appinventor-sources/raw/master/appinventor/components/lib/appinventor-components.jar"

# Common utilities
wget -O libs/gson-2.10.1.jar \
  "https://repo1.maven.org/maven2/com/google/code/gson/gson/2.10.1/gson-2.10.1.jar"
```

#### Step 5: Convert to Modern Structure

```
# Old structure (example)
MyExtension/
├── Source/
├── Libraries/
├── Assets/
└── build.xml

# New structure
my-extension/
├── src/
├── libs/
├── assets/
├── test/
├── build/
├── dist/
└── build.xml
```

#### Step 6: Update Source Code

Update package declarations:
```java
// Old
package com.mycompany.myextension;

// New (if needed, usually stays the same)
package com.mycompany.myextension;
```

Update imports:
```java
// Ensure proper imports for modern App Inventor
import com.google.appinventor.components.annotations.*;
import com.google.appinventor.components.runtime.*;
import com.google.appinventor.components.common.*;
```

## 🐱 Kotlin Migration

### Automatic Conversion

AIX Studio provides automatic Java to Kotlin conversion:

```bash
# Using AIX Studio Migration tab:
# Select "Convert to Kotlin" option
# Review converted code
# Accept or modify as needed
```

### Manual Kotlin Conversion Tips

When converting manually, follow these patterns:

#### Constructor Conversion
```java
// Java:
public MyExtension(ComponentContainer container) {
    super(container.$form());
}

// Kotlin:
constructor(container: ComponentContainer) : super(container.$form())
```

#### Method Conversion
```java
// Java:
@SimpleFunction
public String greet(String name) {
    return "Hello, " + name;
}

// Kotlin:
@SimpleFunction
fun greet(name: String): String {
    return "Hello, $name"
}
```

#### Property Conversion
```java
// Java:
@SimpleProperty
public String getSampleProperty() {
    return sampleProperty;
}

@SimpleProperty
public void setSampleProperty(String value) {
    sampleProperty = value;
}

// Kotlin:
@SimpleProperty
var sampleProperty: String = ""
    get() = field
    set(value) { field = value }
```

### Kotlin Migration Checklist

- [ ] Convert all `.java` files to `.kt`
- [ ] Update build system for Kotlin support
- [ ] Download Kotlin libraries
- [ ] Test all functionality
- [ ] Update documentation
- [ ] Verify extension builds successfully

## 🧪 Testing After Migration

### Setup Testing Environment

```bash
# Initialize test environment
# AIX Studio automatically sets this up, or manually:

mkdir -p test/com/example

# Download test dependencies
wget -O libs/junit-4.13.2.jar \
  "https://repo1.maven.org/maven2/junit/junit/4.13.2/junit-4.13.2.jar"
```

### Migrate Existing Tests

If you have existing tests:

```bash
# Move test files to proper location
mv old-tests/ test/

# Update imports and package names
# Ensure compatibility with new structure

# Example test migration:
```

#### Before Migration (Old Test):
```java
// Old test structure
package com.mycompany.tests;
import com.mycompany.MyExtension;
import junit.framework.TestCase;

public class MyExtensionTest extends TestCase {
    public void testGreet() {
        MyExtension ext = new MyExtension();
        assertEquals("Hello, World!", ext.greet("World"));
    }
}
```

#### After Migration (Modern Test):
```java
// Modern test structure
package com.mycompany;

import static org.junit.Assert.*;
import org.junit.Test;
import org.junit.Before;

public class MyExtensionTest {
    
    private MyExtension extension;
    
    @Before
    public void setUp() {
        // Setup with mock container
        extension = new MyExtension(/* mock container */);
    }
    
    @Test
    public void testGreet() {
        String result = extension.greet("World");
        assertEquals("Hello, World!", result);
    }
}
```

### Run Tests

```bash
# Using AIX Studio Testing tab:
# Click "Run Tests"
# View results and coverage

# Or command line:
cd MyMigratedProject
ant test

# With coverage:
ant test-coverage
```

## 📦 Dependency Management Migration

### Old vs New Dependencies

| Old Approach | New Approach | Benefits |
|-------------|--------------|----------|
| Manual JAR downloads | AIX Studio dependency management | Easy updates |
| Mixed version libraries | Version management | Consistency |
| No dependency tracking | `dependencies.json` | Audit trail |
| Manual updates | Automatic checking | Time saving |

### Migrating Dependencies

#### Create Dependencies Configuration

```json
// dependencies.json
{
  "appinventor-components": {
    "version": "2.0",
    "group": "com.google.appinventor",
    "added": "2024-01-01T00:00:00.000Z"
  },
  "gson": {
    "version": "2.10.1",
    "group": "com.google.code.gson",
    "added": "2024-01-01T00:00:00.000Z"
  },
  "commons-lang3": {
    "version": "3.14.0",
    "group": "org.apache.commons",
    "added": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Add Dependencies via AIX Studio

```bash
# Using Dependencies tab:
# Search for "gson"
# Click "Add Dependency"
# Version: 2.10.1
# Click "Add"

# Or batch add:
aix add gson:2.10.1
aix add retrofit:2.9.0
aix add commons-lang3:3.14.0
```

## 🎯 Post-Migration Checklist

### ✅ Essential Checks

- [ ] Project builds successfully (`ant package`)
- [ ] All functionality preserved
- [ ] Tests pass (`ant test`)
- [ ] Dependencies are up to date
- [ ] Documentation generated (`aix docs`)
- [ ] Extension works in App Inventor

### ✅ Advanced Checks

- [ ] Code coverage acceptable (>80%)
- [ ] No deprecated APIs used
- [ ] Proper error handling
- [ ] Consistent naming conventions
- [ ] Comprehensive documentation
- [ ] Performance benchmarks

### ✅ Performance Checks

- [ ] Build time reasonable (<30 seconds)
- [ ] Extension size optimized (<5MB)
- [ ] Memory usage acceptable
- [ ] No memory leaks
- [ ] Startup time reasonable

### ✅ Security Checks

- [ ] No known vulnerable dependencies
- [ ] Proper input validation
- [ ] Secure coding practices
- [ ] Updated security libraries

## 🆘 Troubleshooting Migration

### Common Issues and Solutions

#### 1. Build Failures

**Problem**: Project fails to build after migration

**Solutions**:
```bash
# Check Java version compatibility
java -version

# Verify build.xml syntax
ant -verbose

# Check classpath issues
ls -la libs/

# Clean and rebuild
ant clean
ant package
```

#### 2. Dependency Issues

**Problem**: Missing or conflicting dependencies

**Solutions**:
```bash
# List current dependencies
aix deps list

# Add missing dependencies
aix add missing-library

# Resolve conflicts
aix deps update

# Check for security vulnerabilities
aix deps audit
```

#### 3. Kotlin Conversion Issues

**Problem**: Kotlin compilation errors

**Solutions**:
```bash
# Check Kotlin libraries
ls libs/kotlin*

# Download if missing
aix download kotlin

# Manual conversion for complex cases
# Use IntelliJ IDEA Kotlin converter as reference
```

#### 4. Test Failures

**Problem**: Tests fail after migration

**Solutions**:
```bash
# Setup test environment
aix test

# Check test structure
find test/ -name "*.java"

# Run specific tests
ant test -Dtest.includes=**/MySpecificTest.java

# Debug test failures
ant test -Dtest.verbose=true
```

#### 5. Structure Issues

**Problem**: Files in wrong locations

**Solutions**:
```bash
# Verify standard structure
tree -I 'node_modules|build|dist'

# Move files to correct locations
mv Source/* src/
mv Libraries/* libs/
mv Assets/* assets/

# Update build.xml paths
```

### Migration Logs

AIX Studio creates detailed migration logs:

```
MIGRATION-REPORT.md    # Migration summary
backup-*/              # Project backup
migration.log          # Detailed migration log
build.log              # Build process log
test.log               # Test execution log
```

### Rollback Procedure

If migration fails, rollback to backup:

```bash
# Stop AIX Studio
# Remove migrated project
rm -rf MyMigratedProject

# Restore from backup
cp -r MyProject-backup-20240101 MyMigratedProject

# Restart migration with different approach
```

## 🚀 Advanced Migration Features

### Custom Migration Scripts

Create `migration.js` for complex migrations:

```javascript
module.exports = {
  beforeMigration: async (project) => {
    // Pre-migration tasks
    console.log('Starting migration for:', project.name);
    await backupProject(project.path);
  },
  
  afterMigration: async (project) => {
    // Post-migration tasks
    console.log('Migration completed for:', project.name);
    await generateDocumentation(project.path);
    await runTests(project.path);
  },
  
  customSteps: [
    {
      name: "Update Custom Library",
      description: "Update proprietary library to latest version",
      run: async (project) => {
        // Custom migration logic
        await downloadCustomLibrary(project.path);
        await updateLibraryReferences(project.path);
      }
    },
    {
      name: "Migrate Configuration Files",
      description: "Convert old config files to new format",
      run: async (project) => {
        await convertConfigFiles(project.path);
      }
    }
  ]
};
```

### Incremental Migration

For large projects, migrate incrementally:

```bash
# Step 1: Structure migration
aix migrate structure --project MyLargeProject

# Step 2: Build system migration
aix migrate build --project MyLargeProject

# Step 3: Dependency migration
aix migrate deps --project MyLargeProject

# Step 4: Testing setup
aix test --setup --project MyLargeProject

# Step 5: Full verification
aix build --project MyLargeProject
```

### Batch Migration

Migrate multiple projects at once:

```bash
# Create migration batch file
echo "Project1,java,kotlin" > migration-batch.csv
echo "Project2,java,java" >> migration-batch.csv
echo "Project3,kotlin,kotlin" >> migration-batch.csv

# Run batch migration
aix migrate batch --file migration-batch.csv --full
```

## 📊 Migration Benefits

### After successful migration, you'll get:

✅ **Modern build system** - Faster, more reliable builds
✅ **Dependency management** - Easy library updates and security patches
✅ **Testing framework** - Better code quality and reliability
✅ **Standard structure** - Easier collaboration and maintenance
✅ **Documentation generation** - Better maintainability and onboarding
✅ **Kotlin support** - Modern language features and null safety
✅ **CI/CD ready** - Automated deployment and testing
✅ **Community templates** - Shared best practices and patterns
✅ **Performance improvements** - Optimized code and libraries
✅ **Security enhancements** - Updated dependencies and practices

### Migration Metrics

Track your migration progress:

```bash
# Migration Statistics Report
Projects Migrated: 15/20
Success Rate: 93%
Average Migration Time: 45 minutes
Code Size Reduction: 23%
Build Time Improvement: 40%
Test Coverage Increase: 65%
Security Vulnerabilities Fixed: 8
```

## 🎯 Best Practices for Migration

### 1. Plan Thoroughly

- **Inventory current projects** and their states
- **Prioritize migrations** based on importance and complexity
- **Schedule downtime** for critical projects
- **Assign team members** to specific migration tasks

### 2. Test Extensively

- **Create test plans** before migration
- **Document expected behaviors** for verification
- **Run comprehensive tests** after each migration step
- **Validate in App Inventor** with real projects

### 3. Document Everything

- **Keep migration logs** for future reference
- **Update project documentation** after migration
- **Create migration guides** for team members
- **Share lessons learned** with the community

### 4. Monitor Performance

- **Measure build times** before and after migration
- **Track extension sizes** and memory usage
- **Monitor user feedback** on migrated extensions
- **Benchmark performance** against old versions

This migration guide helps you successfully upgrade your App Inventor Extension projects to modern standards using AIX Studio's comprehensive migration tools.
