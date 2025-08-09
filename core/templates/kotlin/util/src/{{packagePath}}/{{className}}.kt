package {{package}}

import com.google.appinventor.components.annotations.*
import com.google.appinventor.components.runtime.*
import com.google.appinventor.components.common.*
import java.util.*
import kotlin.random.Random

/**
 * {{description}}
 * 
 * A utility extension for App Inventor using Kotlin that provides common
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
class {{className}} : AndroidNonvisibleComponent {
    
    private val random = Random(System.currentTimeMillis())
    
    /**
     * Creates a new {{className}} component.
     * 
     * @param container the component container
     */
    constructor(container: ComponentContainer) : super(container.$form())
    
    /**
     * Generates a random number between min and max (inclusive).
     * 
     * @param min the minimum value
     * @param max the maximum value
     * @return a random number between min and max
     */
    @SimpleFunction(description = "Generates a random number between min and max")
    fun RandomNumber(min: Int, max: Int): Int {
        require(min <= max) { "Min cannot be greater than max" }
        return random.nextInt(max - min + 1) + min
    }
    
    /**
     * Generates a random string of specified length.
     * 
     * @param length the length of the string to generate
     * @return a random string
     */
    @SimpleFunction(description = "Generates a random string of specified length")
    fun RandomString(length: Int): String {
        if (length <= 0) return ""
        
        val chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        return (1..length)
            .map { chars[random.nextInt(chars.length)] }
            .joinToString("")
    }
    
    /**
     * Gets the current timestamp.
     * 
     * @return the current timestamp in milliseconds
     */
    @SimpleFunction(description = "Gets the current timestamp")
    fun CurrentTimestamp(): Long {
        return System.currentTimeMillis()
    }
    
    /**
     * Formats a timestamp as a readable string.
     * 
     * @param timestamp the timestamp to format
     * @return the formatted date string
     */
    @SimpleFunction(description = "Formats a timestamp as a readable string")
    fun FormatTimestamp(timestamp: Long): String {
        val date = Date(timestamp)
        val formatter = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
        return formatter.format(date)
    }
    
    /**
     * Reverses a string.
     * 
     * @param input the string to reverse
     * @return the reversed string
     */
    @SimpleFunction(description = "Reverses a string")
    fun ReverseString(input: String?): String? {
        return input?.reversed()
    }
    
    /**
     * Converts a string to uppercase.
     * 
     * @param input the string to convert
     * @return the uppercase string
     */
    @SimpleFunction(description = "Converts a string to uppercase")
    fun ToUpperCase(input: String?): String? {
        return input?.uppercase()
    }
    
    /**
     * Converts a string to lowercase.
     * 
     * @param input the string to convert
     * @return the lowercase string
     */
    @SimpleFunction(description = "Converts a string to lowercase")
    fun ToLowerCase(input: String?): String? {
        return input?.lowercase()
    }
    
    /**
     * Joins a list of strings with a separator.
     * 
     * @param list the list of strings to join
     * @param separator the separator to use
     * @return the joined string
     */
    @SimpleFunction(description = "Joins a list of strings with a separator")
    fun JoinList(list: List<String>, separator: String): String {
        return list.joinToString(separator)
    }
    
    /**
     * Splits a string into a list using a separator.
     * 
     * @param input the string to split
     * @param separator the separator to use
     * @return the list of split strings
     */
    @SimpleFunction(description = "Splits a string into a list using a separator")
    fun SplitString(input: String?, separator: String?): List<String> {
        return when {
            input == null || separator == null -> emptyList()
            separator.isEmpty() -> listOf(input)
            else -> input.split(separator)
        }
    }
    
    /**
     * Checks if a string contains another string.
     * 
     * @param input the string to search in
     * @param search the string to search for
     * @return true if input contains search, false otherwise
     */
    @SimpleFunction(description = "Checks if a string contains another string")
    fun Contains(input: String?, search: String?): Boolean {
        return input?.contains(search ?: "") ?: false
    }
    
    /**
     * Gets the length of a string.
     * 
     * @param input the string to measure
     * @return the length of the string
     */
    @SimpleFunction(description = "Gets the length of a string")
    fun StringLength(input: String?): Int {
        return input?.length ?: 0
    }
}