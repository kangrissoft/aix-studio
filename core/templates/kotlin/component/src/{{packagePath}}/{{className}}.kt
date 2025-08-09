package {{package}}

import com.google.appinventor.components.annotations.*
import com.google.appinventor.components.runtime.*
import com.google.appinventor.components.common.*

/**
 * {{description}}
 * 
 * A basic component extension for App Inventor using Kotlin.
 */
@DesignerComponent(
    version = 1,
    description = "{{description}}",
    category = ComponentCategory.EXTENSION,
    nonVisible = true,
    iconName = "images/extension.png"
)
@SimpleObject(external = true)
class {{className}} : AndroidNonvisibleComponent {
    
    /**
     * Creates a new {{className}} component.
     * 
     * @param container the component container
     */
    constructor(container: ComponentContainer) : super(container.$form())
    
    /**
     * Greets a person by name.
     * 
     * @param name the name of the person to greet
     * @return a greeting message
     */
    @SimpleFunction(description = "Greets a person by name")
    fun Greet(name: String): String {
        return "Hello, $name!"
    }
    
    /**
     * Calculates the sum of two integers.
     * 
     * @param a the first integer
     * @param b the second integer
     * @return the sum of a and b
     */
    @SimpleFunction(description = "Calculates the sum of two integers")
    fun AddNumbers(a: Int, b: Int): Int {
        return a + b
    }
    
    /**
     * A sample property that stores a string value.
     * 
     * @return the current value of the property
     */
    @SimpleProperty(description = "A sample property that stores a string value")
    var SampleProperty: String = "Default Value"
        get() = field
        set(value) { field = value }
    
    /**
     * Triggered when data is processed.
     * 
     * @param result the processed result
     */
    @SimpleEvent(description = "Triggered when data is processed")
    fun OnDataProcessed(result: String) {
        EventDispatcher.dispatchEvent(this, "OnDataProcessed", result)
    }
}