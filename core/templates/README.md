# AIX Studio Templates

A collection of templates for creating App Inventor Extensions with AIX Studio.

## 📋 Template Categories

### Java Templates

1. **Component Extension** - Basic extension with methods, properties, and events
2. **Sensor Extension** - Integration with Android sensor framework
3. **UI Extension** - Custom user interface components
4. **Utility Extension** - Helper functions and utilities

### Kotlin Templates

1. **Component Extension** - Basic extension using Kotlin syntax
2. **Sensor Extension** - Sensor integration with Kotlin features
3. **Utility Extension** - Utility functions using Kotlin

## 🚀 Using Templates

### Creating Projects

```bash
# Create project with specific template
aix init my-project --template java-component

# List available templates
aix template list

# Create custom template
aix template create my-custom-template

Template Structure 

Each template includes: 

    build.xml - Ant build configuration
    src/ - Source code with proper package structure
    assets/ - Images and resources
    libs/ - Dependencies (managed automatically)
    README.md - Project documentation
    template.json - Template configuration
     

🎨 Custom Templates 
Creating Custom Templates 

    Use aix template create <template-name> to create a new template
    Customize the template files
    Update template.json with proper metadata
    Use variables like {{projectName}}, {{package}}, etc.
     

Template Variables 

Available variables for customization: 

    {{projectName}} - Project name
    {{package}} - Package name
    {{packagePath}} - Package path (com/example/project)
    {{className}} - Main class name
    {{description}} - Project description
    {{author}} - Author name
     

📦 Dependencies 

Templates automatically include required dependencies: 
Java Templates 

    appinventor-components.jar
     

Kotlin Templates 

    appinventor-components.jar
    kotlin-stdlib-1.8.0.jar
    kotlin-compiler-1.8.0.jar
     

🧪 Testing Templates 

Test templates are provided for both Java and Kotlin: 

    Java Test Template - JUnit 4 test structure
    Kotlin Test Template - Kotlin test structure with kotlin.test
     

🏗️ Build Templates 

Standard build configurations: 

    Java Build - Standard Java compilation with Ant
    Kotlin Build - Kotlin compilation with Ant and Kotlin plugin
     

🤝 Contributing Templates 

To contribute templates to the community: 

    Create your template following the standard structure
    Test thoroughly with AIX Studio
    Submit a pull request to the AIX Studio repository
    Include proper documentation and examples