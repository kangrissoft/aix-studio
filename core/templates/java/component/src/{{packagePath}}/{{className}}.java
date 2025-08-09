package {{package}};

import com.google.appinventor.components.annotations.*;
import com.google.appinventor.components.runtime.*;
import com.google.appinventor.components.common.*;

/**
 * {{description}}
 * 
 * A basic component extension for App Inventor.
 */
@DesignerComponent(
    version = 1,
    description = "{{description}}",
    category = ComponentCategory.EXTENSION,
    nonVisible = true,
    iconName = "images/extension.png"
)
@SimpleObject(external = true)
public class {{className}} extends AndroidNonvisibleComponent {

    /**
     * Creates a new {{className}} component.
     * 
     * @param container the component container
     */
    public {{className}}(ComponentContainer container) {
        super(container.$form());
    }

    /**
     * Greets a person by name.
     * 
     * @param name the name of the person to greet
     * @return a greeting message
     */
    @SimpleFunction(description = "Greets a person by name")
    public String Greet(String name) {
        return "Hello, " + name + "!";
    }

    /**
     * Calculates the sum of two integers.
     * 
     * @param a the first integer
     * @param b the second integer
     * @return the sum of a and b
     */
    @SimpleFunction(description = "Calculates the sum of two integers")
    public int AddNumbers(int a, int b) {
        return a + b;
    }
}