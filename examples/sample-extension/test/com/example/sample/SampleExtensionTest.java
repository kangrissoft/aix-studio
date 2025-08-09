package com.example.sample;

import static org.junit.Assert.*;
import org.junit.Test;
import org.junit.Before;
import org.junit.After;

/**
 * Unit tests for SampleExtension class.
 */
public class SampleExtensionTest {
    
    private SampleExtension extension;
    
    @Before
    public void setUp() {
        // Note: In real tests, you would mock ComponentContainer
        // For this sample, we'll test the logic without Android dependencies
        extension = new SampleExtension(null);
    }
    
    @After
    public void tearDown() {
        extension = null;
    }
    
    @Test
    public void testGreetWithValidName() {
        // Arrange
        String name = "Alice";
        String expected = "Hello, Alice!";
        
        // Act
        String result = extension.Greet(name);
        
        // Assert
        assertEquals("Greet should return proper greeting", expected, result);
    }
    
    @Test
    public void testGreetWithEmptyName() {
        // Arrange
        String name = "";
        String expected = "Hello, !";
        
        // Act
        String result = extension.Greet(name);
        
        // Assert
        assertEquals("Greet should handle empty name", expected, result);
    }
    
    @Test
    public void testCalculateSumPositiveNumbers() {
        // Arrange
        int a = 5;
        int b = 3;
        int expected = 8;
        
        // Act
        int result = extension.CalculateSum(a, b);
        
        // Assert
        assertEquals("CalculateSum should add positive numbers correctly", expected, result);
    }
    
    @Test
    public void testCalculateSumWithNegativeNumbers() {
        // Arrange
        int a = -5;
        int b = 3;
        int expected = -2;
        
        // Act
        int result = extension.CalculateSum(a, b);
        
        // Assert
        assertEquals("CalculateSum should handle negative numbers", expected, result);
    }
    
    @Test
    public void testCalculateSumWithZero() {
        // Arrange
        int a = 0;
        int b = 5;
        int expected = 5;
        
        // Act
        int result = extension.CalculateSum(a, b);
        
        // Assert
        assertEquals("CalculateSum should handle zero", expected, result);
    }
    
    @Test
    public void testProcessTextWithValidInput() {
        // Arrange
        String input = "hello world";
        String expected = "PROCESSED: HELLO WORLD";
        
        // Act
        String result = extension.ProcessText(input);
        
        // Assert
        assertEquals("ProcessText should convert to uppercase and add prefix", expected, result);
    }
    
    @Test
    public void testProcessTextWithEmptyInput() {
        // Arrange
        String input = "";
        String expected = "PROCESSED: ";
        
        // Act
        String result = extension.ProcessText(input);
        
        // Assert
        assertEquals("ProcessText should handle empty string", expected, result);
    }
    
    @Test
    public void testSamplePropertyGetterAndSetter() {
        // Arrange
        String initialValue = extension.SampleProperty();
        String newValue = "Test Value";
        
        // Act
        extension.SampleProperty(newValue);
        String updatedValue = extension.SampleProperty();
        
        // Assert
        assertEquals("Initial property value should be default", "Default Value", initialValue);
        assertEquals("Property value should be updated", newValue, updatedValue);
    }
    
    @Test
    public void testCounterProperty() {
        // Arrange
        int initialValue = extension.Counter();
        
        // Act
        int secondValue = extension.Counter();
        int thirdValue = extension.Counter();
        
        // Assert
        assertEquals("First counter value should be 1", 1, initialValue);
        assertEquals("Second counter value should be 2", 2, secondValue);
        assertEquals("Third counter value should be 3", 3, thirdValue);
    }
    
    @Test
    public void testResetCounter() {
        // Arrange
        extension.Counter(); // 1
        extension.Counter(); // 2
        int beforeReset = extension.Counter(); // 3
        
        // Act
        extension.ResetCounter();
        int afterReset = extension.Counter(); // 1
        
        // Assert
        assertEquals("Counter should be 3 before reset", 3, beforeReset);
        assertEquals("Counter should be 1 after reset", 1, afterReset);
    }
    
    @Test
    public void testGenerateRandomNumberInRange() {
        // Arrange
        int min = 1;
        int max = 10;
        
        // Act
        int result = extension.GenerateRandomNumber(min, max);
        
        // Assert
        assertTrue("Random number should be >= min", result >= min);
        assertTrue("Random number should be <= max", result <= max);
    }
    
    @Test
    public void testGenerateRandomNumberSameMinAndMax() {
        // Arrange
        int min = 5;
        int max = 5;
        
        // Act
        int result = extension.GenerateRandomNumber(min, max);
        
        // Assert
        assertEquals("When min equals max, result should equal that value", min, result);
    }
}