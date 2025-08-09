package com.example.sample;

import com.google.appinventor.components.annotations.*;
import com.google.appinventor.components.runtime.*;
import com.google.appinventor.components.common.*;
import android.util.Log;
import java.util.Random;

/**
 * A sample extension that demonstrates common App Inventor Extension patterns.
 * 
 * This extension provides utility functions for string manipulation,
 * mathematical operations, and event handling.
 * 
 * @author AIX Studio Team
 * @version 1.0.0
 */
@DesignerComponent(
    version = 1,
    description = "A sample extension demonstrating App Inventor Extension best practices",
    category = ComponentCategory.EXTENSION,
    nonVisible = true,
    iconName = "images/extension.png"
)
@SimpleObject(external = true)
public class SampleExtension extends AndroidNonvisibleComponent {
    
    private static final String LOG_TAG = "SampleExtension";
    private String sampleProperty = "Default Value";
    private int counter = 0;
    private Random random = new Random();
    
    /**
     * Creates a new SampleExtension component.
     * 
     * @param container the component container
     */
    public SampleExtension(ComponentContainer container) {
        super(container.$form());
        Log.d(LOG_TAG, "SampleExtension initialized");
    }
    
    /**
     * Greets a person with a personalized message.
     * 
     * @param name the name of the person to greet
     * @return a greeting message
     * 
     * @example
     * <pre>
     * call SampleExtension.Greet with name "Alice"
     * // Returns: "Hello, Alice!"
     * </pre>
     */
    @SimpleFunction(description = "Greets a person with a personalized message")
    public String Greet(String name) {
        Log.d(LOG_TAG, "Greeting: " + name);
        return "Hello, " + name + "!";
    }
    
    /**
     * Calculates the sum of two integers.
     * 
     * @param a the first integer
     * @param b the second integer
     * @return the sum of a and b
     * 
     * @example
     * <pre>
     * call SampleExtension.CalculateSum with a 5 and b 3
     * // Returns: 8
     * </pre>
     */
    @SimpleFunction(description = "Calculates the sum of two integers")
    public int CalculateSum(int a, int b) {
        int result = a + b;
        Log.d(LOG_TAG, "CalculateSum: " + a + " + " + b + " = " + result);
        return result;
    }
    
    /**
     * Processes and transforms text by converting to uppercase and adding prefix.
     * 
     * @param text the text to process
     * @return the processed text
     * 
     * @example
     * <pre>
     * call SampleExtension.ProcessText with text "hello world"
     * // Returns: "PROCESSED: HELLO WORLD"
     * </pre>
     */
    @SimpleFunction(description = "Processes and transforms text")
    public String ProcessText(String text) {
        if (text == null) {
            OnError("Text cannot be null", 400);
            return "";
        }
        
        try {
            String processed = "PROCESSED: " + text.toUpperCase();
            Log.d(LOG_TAG, "Processed text: " + processed);
            OnDataProcessed(processed, System.currentTimeMillis());
            return processed;
        } catch (Exception e) {
            Log.e(LOG_TAG, "Error processing text", e);
            OnError("Failed to process text: " + e.getMessage(), 500);
            return "";
        }
    }
    
    /**
     * Generates a random number between min and max (inclusive).
     * 
     * @param min the minimum value
     * @param max the maximum value
     * @return a random number between min and max
     * 
     * @example
     * <pre>
     * call SampleExtension.GenerateRandomNumber with min 1 and max 10
     * // Returns: random number between 1 and 10
     * </pre>
     */
    @SimpleFunction(description = "Generates a random number between min and max")
    public int GenerateRandomNumber(int min, int max) {
        if (min > max) {
            OnError("Min value cannot be greater than max value", 400);
            return 0;
        }
        
        int result = random.nextInt(max - min + 1) + min;
        Log.d(LOG_TAG, "Generated random number: " + result);
        return result;
    }
    
    /**
     * A sample property that stores a string value.
     * 
     * @return the current value of the property
     */
    @SimpleProperty(description = "A sample property that stores a string value")
    public String SampleProperty() {
        Log.d(LOG_TAG, "Getting SampleProperty: " + sampleProperty);
        return sampleProperty;
    }
    
    /**
     * Sets the value of the sample property.
     * 
     * @param value the new value for the property
     */
    @SimpleProperty
    public void SampleProperty(String value) {
        Log.d(LOG_TAG, "Setting SampleProperty: " + value);
        this.sampleProperty = value;
    }
    
    /**
     * A counter property that increments each time it's accessed.
     * 
     * @return the current counter value
     */
    @SimpleProperty(description = "A counter property that increments each time it's accessed")
    public int Counter() {
        counter++;
        Log.d(LOG_TAG, "Counter incremented: " + counter);
        return counter;
    }
    
    /**
     * Resets the counter to zero.
     */
    @SimpleFunction(description = "Resets the counter to zero")
    public void ResetCounter() {
        counter = 0;
        Log.d(LOG_TAG, "Counter reset");
    }
    
    /**
     * Triggered when data is processed successfully.
     * 
     * @param result the processed result
     * @param timestamp the time when processing completed
     */
    @SimpleEvent(description = "Triggered when data is processed successfully")
    public void OnDataProcessed(String result, long timestamp) {
        Log.d(LOG_TAG, "Dispatching OnDataProcessed event");
        EventDispatcher.dispatchEvent(this, "OnDataProcessed", result, timestamp);
    }
    
    /**
     * Triggered when an error occurs.
     * 
     * @param errorMessage the error message
     * @param errorCode the error code
     */
    @SimpleEvent(description = "Triggered when an error occurs")
    public void OnError(String errorMessage, int errorCode) {
        Log.e(LOG_TAG, "Dispatching OnError event: " + errorMessage + " (" + errorCode + ")");
        EventDispatcher.dispatchEvent(this, "OnError", errorMessage, errorCode);
    }
}