package {{package}};

import com.google.appinventor.components.annotations.*;
import com.google.appinventor.components.runtime.*;
import com.google.appinventor.components.common.*;
import java.util.Random;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.ArrayList;
import java.util.Collections;

/**
 * {{description}}
 * 
 * A utility extension for App Inventor that provides common
 * helper functions and utilities.
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

    private Random random = new Random();

    /**
     * Creates a new {{className}} component.
     * 
     * @param container the component container
     */
    public {{className}}(ComponentContainer container) {
        super(container.$form());
    }

    /**
     * Generates a random number between min and max (inclusive).
     * 
     * @param min the minimum value
     * @param max the maximum value
     * @return a random number between min and max
     */
    @SimpleFunction(description = "Generates a random number between min and max")
    public int RandomNumber(int min, int max) {
        if (min > max) {
            throw new IllegalArgumentException("Min cannot be greater than max");
        }
        return random.nextInt(max - min + 1) + min;
    }

    /**
     * Generates a random string of specified length.
     * 
     * @param length the length of the string to generate
     * @return a random string
     */
    @SimpleFunction(description = "Generates a random string of specified length")
    public String RandomString(int length) {
        if (length <= 0) {
            return "";
        }
        
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder(length);
        
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        
        return sb.toString();
    }

    /**
     * Gets the current timestamp.
     * 
     * @return the current timestamp in milliseconds
     */
    @SimpleFunction(description = "Gets the current timestamp")
    public long CurrentTimestamp() {
        return System.currentTimeMillis();
    }

    /**
     * Formats a timestamp as a readable string.
     * 
     * @param timestamp the timestamp to format
     * @return the formatted date string
     */
    @SimpleFunction(description = "Formats a timestamp as a readable string")
    public String FormatTimestamp(long timestamp) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        return sdf.format(new Date(timestamp));
    }

    /**
     * Reverses a string.
     * 
     * @param input the string to reverse
     * @return the reversed string
     */
    @SimpleFunction(description = "Reverses a string")
    public String ReverseString(String input) {
        if (input == null) {
            return null;
        }
        return new StringBuilder(input).reverse().toString();
    }

    /**
     * Converts a string to uppercase.
     * 
     * @param input the string to convert
     * @return the uppercase string
     */
    @SimpleFunction(description = "Converts a string to uppercase")
    public String ToUpperCase(String input) {
        return input != null ? input.toUpperCase() : null;
    }

    /**
     * Converts a string to lowercase.
     * 
     * @param input the string to convert
     * @return the lowercase string
     */
    @SimpleFunction(description = "Converts a string to lowercase")
    public String ToLowerCase(String input) {
        return input != null ? input.toLowerCase() : null;
    }

    /**
     * Joins a list of strings with a separator.
     * 
     * @param list the list of strings to join
     * @param separator the separator to use
     * @return the joined string
     */
    @SimpleFunction(description = "Joins a list of strings with a separator")
    public String JoinList(List<String> list, String separator) {
        if (list == null || list.isEmpty()) {
            return "";
        }
        return String.join(separator, list);
    }

    /**
     * Splits a string into a list using a separator.
     * 
     * @param input the string to split
     * @param separator the separator to use
     * @return the list of split strings
     */
    @SimpleFunction(description = "Splits a string into a list using a separator")
    public List<String> SplitString(String input, String separator) {
        if (input == null || separator == null) {
            return new ArrayList<>();
        }
        List<String> result = new ArrayList<>();
        String[] parts = input.split(separator);
        Collections.addAll(result, parts);
        return result;
    }

    /**
     * Checks if a string contains another string.
     * 
     * @param input the string to search in
     * @param search the string to search for
     * @return true if input contains search, false otherwise
     */
    @SimpleFunction(description = "Checks if a string contains another string")
    public boolean Contains(String input, String search) {
        if (input == null || search == null) {
            return false;
        }
        return input.contains(search);
    }

    /**
     * Gets the length of a string.
     * 
     * @param input the string to measure
     * @return the length of the string
     */
    @SimpleFunction(description = "Gets the length of a string")
    public int StringLength(String input) {
        return input != null ? input.length() : 0;
    }
}