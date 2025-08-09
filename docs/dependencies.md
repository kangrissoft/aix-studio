# Dependency Management Guide

Complete guide to managing dependencies in AIX Studio for App Inventor Extension development.

## 📦 Overview

AIX Studio provides a powerful dependency management system that allows you to easily add, remove, and manage libraries for your App Inventor Extensions. Dependencies are stored in the `libs/` directory of your project and can be sourced from Maven Central or other repositories.

## 🚀 Getting Started

### Adding Dependencies

1. Navigate to the **Dependencies** tab in AIX Studio
2. Click the **"Add Dependency"** button
3. Enter the library name and version (or use "latest")
4. Click **"Add Dependency"** to download and install

### Example Dependencies

```bash
# Common App Inventor Extension Dependencies
gson                    # JSON parsing
retrofit:2.9.0         # HTTP client
commons-lang3          # Utility functions
okhttp                 # HTTP client
firebase-bom:32.7.0    # Firebase libraries
```

## 🔍 Searching for Dependencies

### Maven Central Search

AIX Studio integrates with Maven Central to help you find libraries:

1. Use the search bar in the Dependencies tab
2. Enter keywords like "gson", "retrofit", or "firebase"
3. Browse search results with version information
4. Click "Add" to install the selected dependency

### Popular Libraries for App Inventor Extensions

| Library | Purpose | Latest Version |
|---------|---------|----------------|
| `gson` | JSON parsing and serialization | 2.10.1 |
| `retrofit` | REST API client | 2.9.0 |
| `okhttp` | HTTP client | 4.12.0 |
| `commons-lang3` | Utility functions | 3.14.0 |
| `jackson-core` | JSON processing | 2.16.1 |
| `firebase-bom` | Firebase libraries | 32.7.0 |

## 📋 Managing Dependencies

### Viewing Installed Dependencies

The Dependencies tab shows all currently installed libraries:

- **Name**: Library name
- **Version**: Installed version
- **Group**: Maven group ID
- **Size**: File size
- **Status**: Installation status

### Removing Dependencies

1. Find the dependency in the list
2. Click the **"Remove"** button next to it
3. Confirm the removal
4. The library will be deleted from the `libs/` directory

### Updating Dependencies

1. Go to the Dependencies tab
2. Click **"Check for Updates"**
3. Review available updates
4. Select dependencies to update
5. Click **"Update Selected"**

## 🛠️ Advanced Dependency Management

### Version Specification

When adding dependencies, you can specify versions in several ways:

```bash
# Latest version
gson

# Specific version
retrofit:2.9.0

# Version range (if supported)
junit:junit:[4.12,5.0)

# SNAPSHOT versions
library:1.0-SNAPSHOT
```

### Local Dependencies

To add local JAR files:

1. Place the JAR file in your project's `libs/` directory
2. The dependency will automatically appear in the list
3. No additional configuration needed

### Dependency Conflicts

AIX Studio helps manage dependency conflicts:

- **Duplicate Detection**: Automatically identifies duplicate libraries
- **Version Resolution**: Suggests the best version to use
- **Conflict Reporting**: Shows detailed conflict information

## 📊 Dependency Analysis

### Statistics

The Dependencies tab provides useful statistics:

- **Total Dependencies**: Number of installed libraries
- **Total Size**: Combined size of all dependencies
- **Updates Available**: Count of outdated libraries
- **Security Issues**: Known vulnerabilities (if any)

### Export/Import Dependencies

#### Export Dependencies

1. Click **"Export Dependencies"**
2. Download a JSON file containing your dependency list
3. Share with team members or backup for later

#### Import Dependencies

1. Click **"Import Dependencies"**
2. Upload a previously exported JSON file
3. AIX Studio will download and install all listed dependencies

## 🔧 Configuration

### Build Configuration

Dependencies are automatically included in your build process through `build.xml`:

```xml
<path id="classpath">
    <fileset dir="${libs.dir}" includes="**/*.jar"/>
</path>
```

### Custom Repositories

To add custom Maven repositories:

1. Go to **Settings** tab
2. Navigate to **Dependency Settings**
3. Add repository URLs
4. Save configuration

## 🎯 Best Practices

### 1. Minimize Dependencies

- Only add libraries you actually need
- Remove unused dependencies regularly
- Consider the impact on extension size

### 2. Version Management

- Use specific versions for production extensions
- Regularly update dependencies for security fixes
- Test thoroughly after updating dependencies

### 3. Security Considerations

- Check for known vulnerabilities
- Use trusted sources (Maven Central preferred)
- Regularly audit dependencies

### 4. Performance Optimization

```bash
# Good: Only what you need
implementation 'com.google.code.gson:gson:2.10.1'

# Avoid: Entire library suites
implementation 'com.google.guava:guava:32.1.3-jre'  # Only if you use many parts
```

### 5. Documentation

Always document your dependencies:

```markdown
## Dependencies

- **gson**: JSON parsing (v2.10.1)
- **retrofit**: REST API client (v2.9.0)
- **Custom Library**: Internal utility library (v1.2.0)
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Dependency Not Found

```bash
# Check spelling and version
# Try searching with different keywords
# Verify the library exists on Maven Central
```

#### 2. Build Failures

```bash
# Check dependency compatibility
# Ensure all dependencies are properly downloaded
# Verify Java version compatibility
```

#### 3. Large Extension Size

```bash
# Analyze dependency sizes
# Remove unnecessary dependencies
# Consider shading/proguard for size reduction
```

#### 4. Version Conflicts

```bash
# Use dependency resolution tools
# Specify explicit versions
# Check for transitive dependencies
```

### Debugging Dependencies

1. **Check logs** in the build output
2. **Verify file existence** in `libs/` directory
3. **Test with minimal dependencies**
4. **Use dependency analysis tools**

## 📱 App Inventor Specific Considerations

### Required Dependencies

All App Inventor Extensions require:

```xml
<!-- Core App Inventor libraries -->
<dependency>
    <groupId>com.google.appinventor</groupId>
    <artifactId>appinventor-components</artifactId>
    <version>latest</version>
</dependency>
```

### Android Dependencies

Be mindful of Android API levels:

- **API Level 28** is commonly used
- Check compatibility with target devices
- Avoid conflicting Android libraries

### ProGuard Configuration

For optimized builds:

```proguard
# Keep App Inventor component annotations
-keep class com.google.appinventor.components.annotations.** { *; }

# Keep extension classes
-keep class * extends com.google.appinventor.components.runtime.AndroidNonvisibleComponent { *; }
```

## 🔄 Migration from Old Projects

### Converting Legacy Dependencies

1. **Inventory existing JARs** in old project
2. **Identify Maven equivalents** where possible
3. **Add through AIX Studio** dependency manager
4. **Remove old manual JARs**
5. **Test thoroughly**

### Example Migration

**Before (Manual)**:
```
libs/
├── gson-2.8.5.jar
├── retrofit-2.6.0.jar
└── okhttp-3.12.0.jar
```

**After (Managed)**:
```bash
# Add through AIX Studio
gson:2.10.1
retrofit:2.9.0
okhttp:4.12.0
```

## 🎯 Advanced Features

### Dependency Graph

AIX Studio can generate dependency graphs:

1. Click **"View Dependency Graph"**
2. See visual representation of dependencies
3. Identify circular dependencies
4. Optimize dependency structure

### Bill of Materials (BOM)

For related libraries, use BOMs:

```bash
# Firebase BOM manages versions automatically
firebase-bom:32.7.0
firebase-analytics
firebase-auth
```

### Optional Dependencies

Mark dependencies as optional when appropriate:

```xml
<!-- In build.xml -->
<dependency optional="true">
    <groupId>optional-library</groupId>
    <artifactId>optional-artifact</artifactId>
    <version>1.0.0</version>
</dependency>
```

## 📈 Performance Monitoring

### Build Time Impact

Monitor how dependencies affect build times:

- **Small libraries**: Minimal impact
- **Large libraries**: Significant impact
- **Multiple dependencies**: Cumulative effect

### Runtime Performance

Consider runtime impact:

- **Memory usage** of loaded libraries
- **Initialization time** for complex dependencies
- **Method count** affecting dex limits

## 🤝 Team Collaboration

### Sharing Dependencies

1. **Export dependency list** from Dependencies tab
2. **Share JSON file** with team members
3. **Import in other projects** for consistency
4. **Version control** dependency configurations

### Dependency Policies

Establish team policies:

- **Approved libraries** list
- **Version update** procedures
- **Security review** processes
- **Documentation** requirements

This dependency management guide helps you effectively manage libraries in your App Inventor Extensions using AIX Studio's integrated tools.
```

Repository Anda sekarang memiliki **dokumentasi lengkap** untuk semua fitur utama AIX Studio!