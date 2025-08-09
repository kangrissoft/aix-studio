# Usage Guide

Complete guide to using AIX Studio for App Inventor Extension development.

## 🚀 Getting Started

### Creating Your First Project

1. **Open AIX Studio** in your web browser (default: `http://localhost:3001`)
2. **Navigate to the Projects tab**
3. **Click "Create New Project"**
4. **Choose a template**:
   - Component Extension (Java) - Basic extension template
   - Component Extension (Kotlin) - Modern Kotlin template
   - Sensor Extension (Java/Kotlin) - Sensor-based extensions
   - UI Extension (Java) - User interface components
   - Utility Extension (Java/Kotlin) - Helper functions
5. **Configure project settings**:
   - Project name (e.g., "MyFirstExtension")
   - Package name (e.g., "com.mycompany.extensions")
   - Class name (e.g., "MyFirstExtension")
   - Description (e.g., "My first App Inventor extension")
6. **Click "Create Project"**

### Project Structure Overview

After creation, your project will have this structure:

```
MyFirstExtension/
├── src/                    # Source code
│   └── com/mycompany/extensions/
│       └── MyFirstExtension.java
├── test/                   # Unit tests
│   └── com/mycompany/extensions/
│       └── MyFirstExtensionTest.java
├── assets/                 # Images and resources
│   └── images/
│       └── extension.png
├── libs/                   # Dependencies (auto-managed)
├── docs/                   # Generated documentation
├── build/                  # Build artifacts
├── dist/                   # Final extension files
├── build.xml              # Build configuration
├── README.md              # Project documentation
└── .gitignore             # Git ignore rules
```

## 📝 Development Workflow

### 1. Writing Code

#### Navigate to the Editor Tab

1. **Click on the Editor tab** in the left sidebar
2. **Browse project files** in the file explorer panel
3. **Select your main extension file** (e.g., `MyFirstExtension.java`)
4. **Start coding** using the Monaco editor with syntax highlighting

#### Basic Extension Structure

```java
package com.mycompany.extensions;

import com.google.appinventor.components.annotations.*;
import com.google.appinventor.components.runtime.*;
import com.google.appinventor.components.common.*;

@DesignerComponent(
    version = 1,
    description = "My first App Inventor extension",
    category = ComponentCategory.EXTENSION,
    nonVisible = true,
    iconName = "images/extension.png"
)
@SimpleObject(external = true)
public class MyFirstExtension extends AndroidNonvisibleComponent {
    
    public MyFirstExtension(ComponentContainer container) {
        super(container.$form());
    }
    
    @SimpleFunction(description = "Greets a person by name")
    public String Greet(String name) {
        return "Hello, " + name + "!";
    }
}
```

#### Using Code Generation

AIX Studio provides powerful code generation features:

1. **Right-click in editor** or use the **Generate menu**
2. **Choose generation type**:
   - **Method**: Generate `@SimpleFunction` methods
   - **Property**: Generate `@SimpleProperty` getters/setters
   - **Event**: Generate `@SimpleEvent` dispatchers
   - **Block**: Generate custom block definitions

3. **Example Method Generation**:
   ```bash
   # Generate a method via command palette:
   # Ctrl+Shift+P → "Generate Method"
   # Enter: "CalculateSum:int,a:int,b:int"
   # Result:
   @SimpleFunction(description = "Calculates sum of two integers")
   public int CalculateSum(int a, int b) {
       return a + b;
   }
   ```

### 2. Adding Dependencies

#### Using the Dependencies Tab

1. **Navigate to the Dependencies tab**
2. **Search for libraries** in the search bar:
   - Try "gson" for JSON parsing
   - Try "retrofit" for HTTP requests
   - Try "commons-lang3" for utilities
3. **Click "Add Dependency"** for desired libraries
4. **Libraries are automatically downloaded** to the `libs/` directory

#### Manual Dependency Management

```bash
# Add specific versions
# In Dependencies tab search: gson:2.10.1

# Add from Maven Central
# Search: com.squareup.retrofit2:retrofit:2.9.0

# View installed dependencies
# Dependencies tab shows: Name, Version, Size, Status
```

### 3. Writing Tests

#### Navigate to the Testing Tab

1. **Click the Testing tab**
2. **View existing tests** in the `test/` directory
3. **Add new test methods** following JUnit conventions
4. **Run tests** with a single click

#### Sample Test Structure

```java
package com.mycompany.extensions;

import static org.junit.Assert.*;
import org.junit.Test;
import org.junit.Before;

public class MyFirstExtensionTest {
    
    private MyFirstExtension extension;
    
    @Before
    public void setUp() {
        extension = new MyFirstExtension(/* mock container */);
    }
    
    @Test
    public void testGreetWithValidName() {
        String result = extension.Greet("Alice");
        assertEquals("Hello, Alice!", result);
    }
    
    @Test
    public void testGreetWithEmptyName() {
        String result = extension.Greet("");
        assertEquals("Hello, !", result);
    }
}
```

#### Running Tests with Coverage

1. **Enable coverage analysis** in Testing tab
2. **Click "Run Tests with Coverage"**
3. **View coverage report** showing:
   - Line coverage percentage
   - Branch coverage
   - Uncovered lines
   - Method coverage

### 4. Building Extensions

#### Using the Builder Tab

1. **Navigate to the Builder tab**
2. **Click "Build Extension"**
3. **Watch build progress** in the output panel
4. **Download the generated .aix file** when complete

#### Build Process Details

```bash
# What happens during build:
# 1. Compiles Java/Kotlin source code
# 2. Packages compiled classes into JAR
# 3. Creates .aix extension file
# 4. Places result in dist/ directory

# Build output example:
> Compiling 1 source file
> Creating JAR file
> Packaging extension
> Build successful: dist/MyFirstExtension.aix (2.4 MB)
```

#### Build Configuration

The `build.xml` file controls the build process:

```xml
<!-- Key build targets -->
<target name="compile">     <!-- Compiles source code -->
<target name="package">     <!-- Creates .aix file -->
<target name="test">        <!-- Runs unit tests -->
<target name="clean">       <!-- Cleans build directories -->
```

## 🎨 Advanced Features

### Template System

#### Using Built-in Templates

1. **Create new project** with different templates:
   - **Component Extension**: Basic extension functionality
   - **Sensor Extension**: Hardware sensor integration
   - **UI Extension**: Custom user interface components
   - **Utility Extension**: Helper functions and utilities

2. **Template features**:
   - Pre-configured `build.xml`
   - Sample extension class
   - Asset placeholders
   - Documentation templates

#### Creating Custom Templates

1. **Navigate to Templates tab**
2. **Click "Create Template"**
3. **Configure template settings**:
   - Template name and description
   - Language (Java/Kotlin)
   - Category and tags
   - Required dependencies
4. **Customize template files**
5. **Save and use template** for future projects

### Documentation Generation

#### Auto-generated Documentation

1. **Go to Documentation tab**
2. **Click "Generate Docs"**
3. **View API documentation** including:
   - Class descriptions
   - Method signatures and parameters
   - Property definitions
   - Event declarations
   - Package structure

#### Documentation Features

```bash
# Export options:
# - HTML format (interactive web docs)
# - Markdown format (plain text)
# - PDF format (printable)
# - JSON format (machine-readable)

# Search functionality:
# - Method names
# - Parameter types
# - Class names
# - Package paths
```

### Project Migration

#### Migrating Old Projects

1. **Navigate to Migration tab**
2. **Click "Analyze Project"**
3. **Review analysis report** showing:
   - Current project structure
   - Issues found
   - Migration recommendations
4. **Choose migration type**:
   - **Full Migration**: Complete modernization
   - **Build System Only**: Update build files
   - **Convert to Kotlin**: Language migration
   - **Update Dependencies**: Library updates
5. **Start migration** and review results

### Live Development

#### Watch Mode

1. **Enable Watch Mode** in relevant tabs
2. **Files are monitored** for changes
3. **Automatic actions** triggered:
   - **Editor**: Auto-save every 30 seconds
   - **Builder**: Auto-rebuild on source changes
   - **Testing**: Auto-run tests on code changes
   - **Documentation**: Auto-regenerate on API changes

#### Development Shortcuts

```bash
# Keyboard shortcuts:
Ctrl+S          # Save current file
Ctrl+B          # Build extension
Ctrl+T          # Run tests
Ctrl+D          # Generate documentation
Ctrl+Shift+F    # Format code
Ctrl+Shift+P    # Command palette
F5              # Refresh/reload
```

## 🧪 Testing and Quality Assurance

### Test-Driven Development

#### Workflow

1. **Write failing test** first
2. **Run test** to confirm it fails
3. **Write minimal code** to pass test
4. **Run test** to confirm it passes
5. **Refactor** if needed
6. **Repeat** for next feature

#### Example TDD Cycle

```java
// 1. Write failing test
@Test
public void testAddNumbers() {
    int result = extension.AddNumbers(2, 3);
    assertEquals(5, result);  // This will fail initially
}

// 2. Write minimal implementation
@SimpleFunction
public int AddNumbers(int a, int b) {
    return 0;  // Fails test
}

// 3. Fix implementation
@SimpleFunction
public int AddNumbers(int a, int b) {
    return a + b;  // Passes test
}
```

### Code Quality Metrics

#### Using the Quality Tab (if available)

1. **Code coverage** tracking
2. **Complexity analysis**
3. **Duplication detection**
4. **Style guide compliance**
5. **Security vulnerability scanning**

#### Quality Reports

```bash
# Sample quality report:
Code Coverage: 85% (170/200 lines)
Cyclomatic Complexity: Average 2.3 per method
Code Duplication: 2% (5 lines)
Style Violations: 0
Security Issues: 0
```

## 📱 App Inventor Integration

### Testing in App Inventor

#### Workflow

1. **Build extension** in AIX Studio
2. **Download .aix file** from `dist/` directory
3. **Open App Inventor** (ai2.appinventor.mit.edu)
4. **Import extension**:
   - Go to Designer tab
   - Click "Extensions" in palette
   - Click "Import Extension"
   - Upload your .aix file
5. **Use extension** in blocks
6. **Test functionality** in Companion app

#### Example Integration Test

```blocks
# In App Inventor Blocks Editor:
# 1. Drag your extension component to screen
# 2. Use blocks like:
when Button1.Click
    call MyFirstExtension.Greet with name TextBox1.Text
    set Label1.Text to result
```

### Publishing Extensions

#### Preparation Steps

1. **Complete testing** in App Inventor
2. **Generate documentation** for users
3. **Create example projects** demonstrating usage
4. **Write clear README** with installation instructions
5. **Test on multiple devices** and Android versions

#### Distribution Options

1. **GitHub Releases**:
   - Tag version (e.g., v1.0.0)
   - Upload .aix file
   - Include release notes

2. **App Inventor Community Forum**:
   - Share with community
   - Get feedback and suggestions

3. **Personal Website**:
   - Host .aix files
   - Provide documentation
   - Offer support

## 🎯 Best Practices

### Project Organization

#### File Structure Guidelines

```
MyExtension/
├── src/
│   └── com/company/extension/
│       ├── MyExtension.java          # Main extension class
│       ├── utils/                    # Utility classes
│       │   └── HelperClass.java
│       └── models/                   # Data models
│           └── DataModel.java
├── test/
│   └── com/company/extension/
│       ├── MyExtensionTest.java      # Main tests
│       └── utils/
│           └── HelperClassTest.java
├── assets/
│   ├── images/                       # Extension icons
│   └── sounds/                       # Audio files
├── docs/                             # Documentation
│   ├── api/                          # Generated API docs
│   └── guides/                       # User guides
└── examples/                         # Example projects
    └── HelloWorld/
        ├── HelloWorld.aia            # Sample App Inventor project
        └── README.md                 # Usage instructions
```

### Code Quality Standards

#### Naming Conventions

```java
// Classes: PascalCase
public class UserAuthenticationExtension { }

// Methods: camelCase with descriptive names
@SimpleFunction
public String authenticateUser(String username, String password) { }

// Properties: camelCase
@SimpleProperty
public String ApiKey() { return apiKey; }

// Constants: UPPER_SNAKE_CASE
private static final String DEFAULT_API_URL = "https://api.example.com";

// Variables: camelCase
String userName = "Alice";
int retryCount = 0;
```

#### Documentation Standards

```java
/**
 * Authenticates a user with username and password.
 * 
 * This method validates user credentials against the authentication server.
 * It handles network errors and provides appropriate error messages.
 * 
 * @param username the user's login name (must not be null or empty)
 * @param password the user's password (must not be null)
 * @return authentication token if successful, null if failed
 * @throws IllegalArgumentException if username or password is invalid
 * @throws NetworkException if server is unreachable
 * 
 * @example
 * <pre>
 * // Successful authentication
 * String token = extension.AuthenticateUser("alice", "secret123");
 * if (token != null) {
 *     // Authentication successful
 * }
 * </pre>
 * 
 * @since 1.2.0
 * @author John Doe
 */
@SimpleFunction(description = "Authenticates a user with username and password")
public String AuthenticateUser(String username, String password) {
    // Implementation here
}
```

### Error Handling

#### Proper Exception Management

```java
@SimpleFunction
public String ProcessData(String input) {
    try {
        // Validate input
        if (input == null) {
            throw new IllegalArgumentException("Input cannot be null");
        }
        
        if (input.isEmpty()) {
            throw new IllegalArgumentException("Input cannot be empty");
        }
        
        // Process data
        return processDataInternal(input);
        
    } catch (IllegalArgumentException e) {
        // Re-throw with context
        throw new IllegalArgumentException("Invalid input: " + e.getMessage(), e);
    } catch (Exception e) {
        // Log error and provide user-friendly message
        Log.e("MyExtension", "Error processing data", e);
        throw new RuntimeException("Failed to process data: " + e.getMessage());
    }
}
```

### Performance Optimization

#### Efficient Coding Practices

```java
// Good: Cache expensive operations
private String cachedApiKey;

@SimpleProperty
public String ApiKey() {
    if (cachedApiKey == null) {
        cachedApiKey = loadApiKeyFromPreferences();
    }
    return cachedApiKey;
}

// Good: Use StringBuilder for string concatenation
@SimpleFunction
public String BuildUrl(String baseUrl, String... params) {
    StringBuilder url = new StringBuilder(baseUrl);
    for (String param : params) {
        url.append("/").append(param);
    }
    return url.toString();
}

// Good: Close resources properly
@SimpleFunction
public String ReadFile(String filename) {
    try (BufferedReader reader = new BufferedReader(new FileReader(filename))) {
        return reader.readLine();
    } catch (IOException e) {
        throw new RuntimeException("Failed to read file", e);
    }
}
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Build Failures

**Problem**: Extension fails to build

**Solutions**:
```bash
# Check for compilation errors
# Look at build output in Builder tab

# Verify Java syntax
# Check for missing semicolons, brackets, etc.

# Ensure all dependencies are present
# Check libs/ directory

# Clean and rebuild
# Builder tab → Clean Build → Build Extension
```

#### 2. Runtime Errors in App Inventor

**Problem**: Extension works in tests but fails in App Inventor

**Solutions**:
```bash
# Check Android permissions
# Add required permissions to extension manifest

# Verify context usage
# Use container.$context() for Android context

# Test with Companion app
# Use AI Companion for real device testing

# Check logcat output
# Use Android Debug Bridge (adb) if needed
```

#### 3. Missing Methods in Blocks

**Problem**: Extension methods don't appear in App Inventor blocks

**Solutions**:
```bash
# Verify @SimpleFunction annotation
# Check method is public
# Ensure proper parameter types

# Rebuild and reimport extension
# Clear browser cache
# Restart App Inventor

# Check for compilation errors
# Fix any build issues first
```

#### 4. Performance Issues

**Problem**: Extension is slow or causes app to freeze

**Solutions**:
```bash
# Move heavy operations to background threads
# Use AsyncTask or Handler for long-running tasks

# Optimize algorithms
# Profile performance with Android tools

# Cache expensive operations
# Avoid repeated calculations

# Limit memory usage
# Release resources when done
```

### Debugging Techniques

#### 1. Logging

```java
import android.util.Log;

@SimpleFunction
public String ProcessData(String input) {
    Log.d("MyExtension", "Processing data: " + input);
    
    try {
        String result = doHeavyProcessing(input);
        Log.d("MyExtension", "Processing completed: " + result);
        return result;
    } catch (Exception e) {
        Log.e("MyExtension", "Error processing data", e);
        throw e;
    }
}
```

#### 2. Debug Builds

```bash
# Enable debug mode in build.xml
# Add debug information to compiled classes
# Use verbose logging during development
```

#### 3. Unit Testing

```bash
# Write comprehensive unit tests
# Test edge cases and error conditions
# Use mocking for external dependencies
# Maintain high code coverage
```

## 🚀 Advanced Development

### Custom Annotations

#### Creating Extension-Specific Annotations

```java
// Custom annotation for validation
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface ValidateInput {
    int maxLength() default 100;
    boolean required() default true;
}

// Using custom annotation
@SimpleFunction
@ValidateInput(maxLength = 50, required = true)
public String ProcessText(String input) {
    // Implementation with automatic validation
}
```

### Event-Driven Architecture

#### Implementing Custom Events

```java
@SimpleEvent(description = "Triggered when data is processed successfully")
public void OnDataProcessed(String result, long timestamp) {
    EventDispatcher.dispatchEvent(this, "OnDataProcessed", result, timestamp);
}

@SimpleEvent(description = "Triggered when an error occurs")
public void OnError(String errorMessage, int errorCode) {
    EventDispatcher.dispatchEvent(this, "OnError", errorMessage, errorCode);
}

// Triggering events from methods
@SimpleFunction
public void ProcessData(String input) {
    try {
        String result = processDataInternal(input);
        OnDataProcessed(result, System.currentTimeMillis());
    } catch (Exception e) {
        OnError(e.getMessage(), 500);
    }
}
```

### Integration with External Services

#### HTTP Client Integration

```java
@SimpleFunction
public void FetchDataFromApi(String url, String apiKey) {
    // Using OkHttp or similar library
    OkHttpClient client = new OkHttpClient();
    Request request = new Request.Builder()
        .url(url)
        .addHeader("Authorization", "Bearer " + apiKey)
        .build();
    
    client.newCall(request).enqueue(new Callback() {
        @Override
        public void onResponse(Call call, Response response) {
            // Handle successful response
            String data = response.body().string();
            OnDataReceived(data);
        }
        
        @Override
        public void onFailure(Call call, IOException e) {
            // Handle failure
            OnError("Network error: " + e.getMessage(), 400);
        }
    });
}
```

## 📈 Productivity Tips

### Keyboard Shortcuts

#### Editor Shortcuts

```bash
Ctrl+S          # Save file
Ctrl+Z          # Undo
Ctrl+Y          # Redo
Ctrl+F          # Find
Ctrl+H          # Replace
Ctrl+D          # Delete line
Ctrl+Shift+D    # Duplicate line
Ctrl+/          # Toggle comment
Alt+↑/↓         # Move line up/down
Ctrl+Shift+K    # Delete line
```

#### Navigation Shortcuts

```bash
Ctrl+P          # Quick open file
Ctrl+Shift+F    # Find in files
F2              # Next error
Shift+F2        # Previous error
Ctrl+G          # Go to line
Ctrl+T          # Go to symbol
```

### Project Templates

#### Quick Project Creation

```bash
# Use templates for common extension types:
# 1. Utility Extension - Helper functions
# 2. Sensor Extension - Hardware integration
# 3. Network Extension - API clients
# 4. UI Extension - Custom components
# 5. Database Extension - Data storage

# Customize templates for your team:
# - Add company branding
# - Include standard dependencies
# - Set up testing framework
# - Configure build settings
```

### Collaboration Features

#### Team Development

```bash
# Version control integration:
# - Git support built-in
# - Branch management
# - Merge conflict resolution
# - Pull request workflows

# Shared development environment:
# - Docker containerization
# - Environment configuration files
# - Dependency lock files
# - Code style configurations
```

## 🎯 Getting Help and Support

### Community Resources

#### Official Documentation

- **App Inventor Documentation**: [appinventor.mit.edu](https://appinventor.mit.edu)
- **AIX Studio Documentation**: This guide and others in `docs/` directory
- **Java Documentation**: [docs.oracle.com/javase](https://docs.oracle.com/javase)
- **Android Documentation**: [developer.android.com](https://developer.android.com)

#### Community Forums

- **App Inventor Community**: [community.appinventor.mit.edu](https://community.appinventor.mit.edu)
- **Stack Overflow**: Tag questions with `app-inventor`
- **GitHub Issues**: For AIX Studio bugs and feature requests

#### Learning Resources

```bash
# Online tutorials:
# - App Inventor official tutorials
# - YouTube video series
# - Blog posts and articles
# - Sample projects and extensions

# Books and courses:
# - "App Inventor 2: Create Your Own Android Apps"
# - Online courses on Udemy, Coursera
# - University course materials
```

### Professional Support

#### Enterprise Features

```bash
# For enterprise users:
# - Priority support tickets
# - Custom feature development
# - Training and consulting
# - SLA guarantees
# - Dedicated account manager

# Contact: support@yourcompany.com
# Response time: 24 hours (business days)
```

## 📱 Mobile Development Best Practices

### Android-Specific Considerations

#### Permissions

```java
// Request Android permissions properly
@SimpleFunction
public void AccessLocation() {
    // Check if permission is granted
    if (container.$form().dispatchPermissionRequest("android.permission.ACCESS_FINE_LOCATION")) {
        // Permission granted, proceed
        getLocationInternal();
    } else {
        // Permission denied, handle gracefully
        OnError("Location permission denied", 403);
    }
}
```

#### Background Processing

```java
@SimpleFunction
public void ProcessLargeFile(String filename) {
    // Use AsyncTask for background processing
    new AsyncTask<String, Void, String>() {
        @Override
        protected String doInBackground(String... params) {
            return processFileInBackground(params[0]);
        }
        
        @Override
        protected void onPostExecute(String result) {
            OnProcessingComplete(result);
        }
        
        @Override
        protected void onCancelled() {
            OnError("Processing cancelled", 499);
        }
    }.execute(filename);
}
```

#### Memory Management

```java
@SimpleFunction
public void LoadLargeData(String filename) {
    try {
        // Use streaming for large files
        try (BufferedReader reader = new BufferedReader(new FileReader(filename))) {
            String line;
            while ((line = reader.readLine()) != null) {
                processLine(line);
            }
        }
    } catch (OutOfMemoryError e) {
        System.gc(); // Suggest garbage collection
        OnError("Not enough memory to load data", 507);
    }
}
```

This usage guide provides comprehensive coverage of AIX Studio features and best practices for developing high-quality App Inventor Extensions. Whether you're a beginner or experienced developer, this guide will help you make the most of AIX Studio's powerful capabilities.
