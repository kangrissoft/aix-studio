# Documentation Generator Guide

Complete guide to generating and managing documentation for App Inventor Extensions using AIX Studio.

## 📚 Overview

AIX Studio includes a powerful documentation generator that automatically creates comprehensive API documentation for your App Inventor Extensions. The documentation system supports multiple formats, search functionality, and integration with your development workflow.

## 🚀 Getting Started

### Generating Documentation

1. Navigate to the **Documentation** tab in AIX Studio
2. Click the **"Generate Docs"** button
3. Wait for the generation process to complete
4. View, preview, or download the generated documentation

### Supported Documentation Elements

The documentation generator automatically extracts information from your code:

- **Class information** and descriptions
- **Method signatures** and parameters
- **Property definitions** and types
- **Event declarations** and parameters
- **Package structure** and organization
- **Inheritance relationships**
- **Annotations and metadata**

## 📋 Documentation Structure

### Generated Documentation Components

```
API Documentation/
├── Classes/
│   ├── MyExtension.html
│   ├── UtilityClass.html
│   └── HelperClass.html
├── Methods/
│   ├── greet.html
│   ├── calculateSum.html
│   └── processData.html
├── Properties/
│   ├── sampleProperty.html
│   └── configuration.html
├── Events/
│   ├── onDataReceived.html
│   └── onError.html
├── Packages/
│   └── com.example.extension/
└── Index/
    ├── all-classes.html
    ├── all-methods.html
    ├── search-index.js
    └── styles.css
```

### Documentation Templates

AIX Studio uses professional templates for documentation generation:

- **HTML Format**: Interactive web-based documentation
- **Markdown**: Plain text documentation
- **PDF**: Printable documentation
- **JSON**: Machine-readable format

## 🔧 Using the Documentation Generator

### Basic Documentation Generation

```java
// Well-documented Java extension
package com.example;

import com.google.appinventor.components.annotations.*;
import com.google.appinventor.components.runtime.*;
import com.google.appinventor.components.common.*;

/**
 * A sample extension that demonstrates documentation capabilities.
 * This extension provides utility functions for string manipulation
 * and mathematical operations.
 */
@DesignerComponent(
    version = 1,
    description = "Sample Extension with Comprehensive Documentation",
    category = ComponentCategory.EXTENSION,
    nonVisible = true,
    iconName = "images/extension.png"
)
@SimpleObject(external = true)
public class SampleExtension extends AndroidNonvisibleComponent {
    
    /**
     * Creates a new SampleExtension component.
     * 
     * @param container the component container
     */
    public SampleExtension(ComponentContainer container) {
        super(container.$form());
    }
    
    /**
     * Greets a person with a personalized message.
     * 
     * @param name the name of the person to greet
     * @return a greeting message
     * @example
     * <pre>
     * call SampleExtension.Greet with name "Alice"
     * // Returns: "Hello, Alice!"
     * </pre>
     */
    @SimpleFunction(description = "Greets a person with a personalized message")
    public String Greet(String name) {
        return "Hello, " + name + "!";
    }
    
    /**
     * Calculates the sum of two integers.
     * 
     * @param a the first integer
     * @param b the second integer
     * @return the sum of a and b
     * @example
     * <pre>
     * call SampleExtension.CalculateSum with a 5 and b 3
     * // Returns: 8
     * </pre>
     */
    @SimpleFunction(description = "Calculates the sum of two integers")
    public int CalculateSum(int a, int b) {
        return a + b;
    }
    
    /**
     * A sample property that stores a string value.
     * 
     * @return the current value of the property
     */
    @SimpleProperty(description = "A sample property that stores a string value")
    public String SampleProperty() {
        return "Default Value";
    }
    
    /**
     * Sets the value of the sample property.
     * 
     * @param value the new value for the property
     */
    @SimpleProperty
    public void SampleProperty(String value) {
        // Set property value
    }
    
    /**
     * Triggered when data is received from an external source.
     * 
     * @param data the received data
     * @param timestamp the time when data was received
     */
    @SimpleEvent(description = "Triggered when data is received from an external source")
    public void OnDataReceived(String data, long timestamp) {
        EventDispatcher.dispatchEvent(this, "OnDataReceived", data, timestamp);
    }
}
```

### Kotlin Documentation Example

```kotlin
/**
 * A sample Kotlin extension that demonstrates documentation capabilities.
 * This extension provides utility functions for string manipulation
 * and mathematical operations.
 */
@DesignerComponent(
    version = 1,
    description = "Sample Kotlin Extension with Comprehensive Documentation",
    category = ComponentCategory.EXTENSION,
    nonVisible = true,
    iconName = "images/extension.png"
)
@SimpleObject(external = true)
class SampleKotlinExtension : AndroidNonvisibleComponent {
    
    /**
     * Creates a new SampleKotlinExtension component.
     * 
     * @param container the component container
     */
    constructor(container: ComponentContainer) : super(container.$form())
    
    /**
     * Greets a person with a personalized message.
     * 
     * @param name the name of the person to greet
     * @return a greeting message
     * @example
     * <pre>
     * call SampleKotlinExtension.Greet with name "Alice"
     * // Returns: "Hello, Alice!"
     * </pre>
     */
    @SimpleFunction(description = "Greets a person with a personalized message")
    fun Greet(name: String): String {
        return "Hello, $name!"
    }
}
```

## 🔍 Search Functionality

### Documentation Search

AIX Studio provides powerful search capabilities:

1. **Keyword Search**: Search by method names, class names, or descriptions
2. **Parameter Search**: Find methods by parameter types
3. **Category Search**: Filter by component categories
4. **Package Search**: Navigate by package structure

### Search Examples

```bash
# Search for methods containing "greet"
Search: greet

# Search for methods with specific parameters
Search: String, int

# Search within specific packages
Search: com.example.utils

# Search for properties
Search: property:sample
```

## 📤 Export Options

### HTML Documentation

The default output format with full interactivity:

- **Navigation sidebar** with class hierarchy
- **Search functionality** within the documentation
- **Code highlighting** for method signatures
- **Cross-references** between related elements
- **Responsive design** for all devices

### Markdown Documentation

Plain text format suitable for README files:

```markdown
# SampleExtension

A sample extension that demonstrates documentation capabilities.

## Methods

### Greet(String name): String

Greets a person with a personalized message.

**Parameters:**
- name: the name of the person to greet

**Returns:**
- a greeting message

**Example:**
```java
call SampleExtension.Greet with name "Alice"
// Returns: "Hello, Alice!"
```
```

### PDF Documentation

Printable format for offline reference:

- **Professional layout** with headers and footers
- **Table of contents** with page numbers
- **Index** for quick reference
- **Bookmarks** for easy navigation

### JSON Documentation

Machine-readable format for integration:

```json
{
  "classes": [
    {
      "name": "SampleExtension",
      "package": "com.example",
      "description": "Sample Extension with Comprehensive Documentation",
      "methods": [
        {
          "name": "Greet",
          "returnType": "String",
          "parameters": [
            {
              "name": "name",
              "type": "String",
              "description": "the name of the person to greet"
            }
          ],
          "description": "Greets a person with a personalized message"
        }
      ]
    }
  ]
}
```

## 🎨 Customization

### Documentation Themes

AIX Studio supports multiple themes:

- **Light Theme**: Clean, professional appearance
- **Dark Theme**: Eye-friendly for low-light environments
- **High Contrast**: Accessibility-focused design
- **Custom CSS**: Upload your own styles

### Custom Templates

Create custom documentation templates:

1. Go to **Settings** → **Documentation**
2. Upload custom HTML templates
3. Modify CSS styles
4. Add custom JavaScript functionality

### Branding

Add your branding to documentation:

```html
<!-- Custom header -->
<div class="branding">
    <img src="logo.png" alt="Your Company Logo">
    <h1>Your Extension Documentation</h1>
</div>

<!-- Custom footer -->
<div class="footer">
    <p>© 2024 Your Company. All rights reserved.</p>
    <p>Generated by AIX Studio</p>
</div>
```

## 📊 Analytics and Statistics

### Documentation Metrics

AIX Studio provides insights into your documentation:

- **Coverage Percentage**: How much of your code is documented
- **Class Count**: Number of documented classes
- **Method Count**: Number of documented methods
- **Property Count**: Number of documented properties
- **Event Count**: Number of documented events

### Quality Reports

Generate quality reports:

```bash
# Documentation Quality Report
Classes: 5 (100% documented)
Methods: 23 (87% documented)
Properties: 8 (100% documented)
Events: 3 (67% documented)
Overall Coverage: 89%
```

## 🔧 Advanced Features

### Cross-Reference Generation

Automatically creates links between related elements:

- **Method references** in descriptions
- **Class inheritance** diagrams
- **Package relationships** visualization
- **External library** linking

### Example Code Integration

Include example code in documentation:

```java
/**
 * Demonstrates the use of the Greet method.
 * 
 * @example
 * <pre>
 * // Initialize the extension
 * SampleExtension extension = new SampleExtension(container);
 * 
 * // Call the Greet method
 * String greeting = extension.Greet("World");
 * // Result: "Hello, World!"
 * </pre>
 */
@SimpleFunction
public String Greet(String name) {
    return "Hello, " + name + "!";
}
```

### Version History

Track documentation changes:

```markdown
## Version History

### v1.2.0 (2024-01-15)
- Added new CalculateSum method
- Updated Greet method documentation
- Fixed typos in property descriptions

### v1.1.0 (2023-12-10)
- Initial documentation release
- Basic method documentation
- Property and event documentation
```

## 🔄 Integration with Development Workflow

### Continuous Documentation

Set up automatic documentation generation:

1. **Pre-commit hook**: Generate docs before each commit
2. **CI/CD integration**: Generate docs in build pipeline
3. **Scheduled generation**: Update docs regularly
4. **Trigger-based**: Generate on code changes

### Documentation Validation

Validate documentation quality:

```bash
# Check documentation coverage
aix docs validate --coverage 80%

# Check for broken links
aix docs validate --links

# Check formatting consistency
aix docs validate --format
```

## 🎯 Best Practices

### 1. Comprehensive Documentation

Document everything:

```java
/**
 * Calculates the factorial of a given number.
 * 
 * This method uses an iterative approach to calculate the factorial,
 * which is more memory-efficient than recursive approaches for large numbers.
 * 
 * @param n the number to calculate factorial for (must be non-negative)
 * @return the factorial of n
 * @throws IllegalArgumentException if n is negative
 * @since 1.2.0
 * @author John Doe
 * 
 * @example
 * <pre>
 * int result = extension.Factorial(5);
 * // result = 120
 * </pre>
 * 
 * @see #Permutation(int, int)
 * @see #Combination(int, int)
 */
@SimpleFunction
public int Factorial(int n) {
    if (n < 0) {
        throw new IllegalArgumentException("n must be non-negative");
    }
    // Implementation here
}
```

### 2. Consistent Formatting

Use consistent documentation style:

```java
/**
 * [Brief description - one line]
 * 
 * [Detailed description - multiple lines if needed]
 * 
 * @param [parameter name] [parameter description]
 * @return [return value description]
 * @throws [exception type] [when thrown]
 * 
 * @example
 * [code example]
 * 
 * @since [version]
 * @author [author name]
 * @deprecated [reason and alternative]
 */
```

### 3. Regular Updates

Keep documentation current:

- **Update when code changes**
- **Review before releases**
- **Add examples for new features**
- **Remove deprecated content**

### 4. User-Focused Content

Write for your audience:

```java
// Good - user-focused
/**
 * Sends a notification to the user's device.
 * 
 * This method displays a popup notification that the user can see
 * even when the app is not in the foreground.
 * 
 * @param message the text to display in the notification
 * @param title the title of the notification (optional)
 */

// Avoid - too technical
/**
 * Calls NotificationManager.notify() with specified parameters.
 * 
 * @param message CharSequence
 * @param title CharSequence
 */
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Missing Documentation

```bash
# Check for undocumented methods
aix docs validate --missing

# Add missing Javadoc comments
/**
 * [Add description here]
 */
@SimpleFunction
public String MyMethod() { ... }
```

#### 2. Broken Links

```bash
# Validate documentation links
aix docs validate --links

# Fix broken @see references
// Before: @see NonExistentClass
// After: @see ExistingClass
```

#### 3. Formatting Issues

```bash
# Check formatting consistency
aix docs validate --format

# Ensure proper Javadoc structure
/**
 * Proper format:
 * - Brief description first
 * - Blank line
 * - Detailed description
 * - Parameter descriptions
 * - Return value description
 */
```

### Performance Optimization

For large projects:

```bash
# Generate incremental documentation
aix docs generate --incremental

# Exclude test classes
aix docs generate --exclude "**/*Test.java"

# Parallel processing
aix docs generate --parallel
```

## 📱 App Inventor Specific Features

### Component Documentation

Special handling for App Inventor components:

```java
@DesignerComponent(
    version = 1,
    description = "Extension for handling user notifications",
    category = ComponentCategory.EXTENSION,
    nonVisible = true,
    iconName = "images/notification.png"
)
@SimpleObject(external = true)
public class NotificationExtension extends AndroidNonvisibleComponent {
    
    /**
     * Shows a notification to the user.
     * 
     * This block displays a notification that appears in the notification
     * area of the device. Users can tap the notification to open your app.
     * 
     * @param title the notification title
     * @param message the notification message
     * @param icon the notification icon (optional)
     * 
     * @block
     * notifier.ShowNotification with title "Hello" and message "World"
     */
    @SimpleFunction(description = "Shows a notification to the user")
    public void ShowNotification(String title, String message, String icon) {
        // Implementation
    }
}
```

### Block Documentation

Document App Inventor blocks:

```java
/**
 * Calculates the distance between two points.
 * 
 * @param x1 the x-coordinate of the first point
 * @param y1 the y-coordinate of the first point
 * @param x2 the x-coordinate of the second point
 * @param y2 the y-coordinate of the second point
 * @return the distance between the two points
 * 
 * @block
 * math.Distance between point x1 y1 and point x2 y2
 */
@SimpleFunction
public double Distance(double x1, double y1, double x2, double y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
```

## 🤝 Team Collaboration

### Shared Documentation

Work with team members:

1. **Export documentation** for sharing
2. **Version control** documentation files
3. **Review changes** in pull requests
4. **Maintain consistency** across team members

### Documentation Reviews

Establish review processes:

```bash
# Documentation review checklist
- [ ] All public methods are documented
- [ ] Parameter descriptions are clear
- [ ] Return values are explained
- [ ] Examples are provided
- [ ] Links are working
- [ ] Formatting is consistent
```

## 🎯 Advanced Documentation Features

### Interactive Examples

Create interactive documentation:

```html
<div class="interactive-example">
    <h4>Try it yourself:</h4>
    <input type="text" id="nameInput" placeholder="Enter your name">
    <button onclick="greetUser()">Greet</button>
    <div id="result"></div>
    
    <script>
    function greetUser() {
        const name = document.getElementById('nameInput').value;
        const result = "Hello, " + name + "!";
        document.getElementById('result').innerText = result;
    }
    </script>
</div>
```

### API Comparison

Compare different versions:

```bash
# Generate diff between versions
aix docs diff --from v1.0.0 --to v1.1.0

# Show breaking changes
aix docs validate --breaking-changes
```

### Localization

Support multiple languages:

```java
/**
 * @lang.en Greets a person with a personalized message
 * @lang.es Saluda a una persona con un mensaje personalizado
 * @lang.fr Salue une personne avec un message personnalisé
 */
@SimpleFunction
public String Greet(String name) {
    return "Hello, " + name + "!";
}
```

This documentation guide helps you create professional, comprehensive documentation for your App Inventor Extensions using AIX Studio's integrated documentation generator.
