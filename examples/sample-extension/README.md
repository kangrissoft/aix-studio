# Sample Extension

A demonstration extension for AIX Studio that showcases common App Inventor Extension patterns and best practices.

## 📋 Overview

This sample extension demonstrates:

- Basic extension structure with `@DesignerComponent` annotation
- Simple functions with `@SimpleFunction`
- Properties with `@SimpleProperty`
- Events with `@SimpleEvent`
- Unit testing with JUnit
- Documentation generation
- Build configuration with Apache Ant

## 🚀 Features

### Methods

- `Greet(String name)` - Returns a personalized greeting
- `CalculateSum(int a, int b)` - Adds two integers
- `ProcessText(String text)` - Processes and transforms text
- `GenerateRandomNumber(int min, int max)` - Generates random number in range

### Properties

- `SampleProperty` - A sample string property
- `Counter` - An integer counter property

### Events

- `OnDataProcessed` - Triggered when data processing completes
- `OnError` - Triggered when an error occurs

## 🧪 Testing

The extension includes comprehensive unit tests:

```bash
# Run tests
ant test

# Run tests with coverage
ant test-coverage