package {{package}};

import com.google.appinventor.components.annotations.*;
import com.google.appinventor.components.runtime.*;
import com.google.appinventor.components.common.*;
import android.view.View;
import android.widget.TextView;
import android.widget.LinearLayout;
import android.graphics.Color;
import android.util.TypedValue;

/**
 * {{description}}
 * 
 * A UI component extension for App Inventor that demonstrates
 * custom view creation and manipulation.
 */
@DesignerComponent(
    version = 1,
    description = "{{description}}",
    category = ComponentCategory.EXTENSION,
    nonVisible = false,
    iconName = "images/extension.png"
)
@SimpleObject(external = true)
public class {{className}} extends AndroidViewComponent {

    private TextView textView;
    private String text = "Hello World";
    private int textColor = Color.BLACK;
    private int textSize = 16;

    /**
     * Creates a new {{className}} component.
     * 
     * @param container the component container
     */
    public {{className}}(ComponentContainer container) {
        super(container);
        initializeView();
    }

    /**
     * Initializes the custom view.
     */
    private void initializeView() {
        textView = new TextView(container.$context());
        textView.setText(text);
        textView.setTextColor(textColor);
        textView.setTextSize(TypedValue.COMPLEX_UNIT_SP, textSize);
        
        // Set the view for the component
        view = textView;
    }

    /**
     * Sets the text to display.
     * 
     * @param text the text to display
     */
    @SimpleProperty
    public void Text(String text) {
        this.text = text;
        if (textView != null) {
            textView.setText(text);
        }
    }

    /**
     * Gets the current text.
     * 
     * @return the current text
     */
    @SimpleProperty(description = "The text to display")
    public String Text() {
        return text;
    }

    /**
     * Sets the text color.
     * 
     * @param color the text color
     */
    @SimpleProperty
    public void TextColor(int color) {
        this.textColor = color;
        if (textView != null) {
            textView.setTextColor(color);
        }
    }

    /**
     * Gets the text color.
     * 
     * @return the text color
     */
    @SimpleProperty(description = "The text color")
    public int TextColor() {
        return textColor;
    }

    /**
     * Sets the text size.
     * 
     * @param size the text size in SP
     */
    @SimpleProperty
    public void TextSize(int size) {
        this.textSize = size;
        if (textView != null) {
            textView.setTextSize(TypedValue.COMPLEX_UNIT_SP, size);
        }
    }

    /**
     * Gets the text size.
     * 
     * @return the text size in SP
     */
    @SimpleProperty(description = "The text size in SP")
    public int TextSize() {
        return textSize;
    }

    /**
     * Updates the text and triggers an event.
     * 
     * @param newText the new text
     */
    @SimpleFunction(description = "Updates the text and triggers an event")
    public void UpdateText(String newText) {
        Text(newText);
        OnTextChanged(newText);
    }

    /**
     * Triggered when text changes.
     * 
     * @param newText the new text
     */
    @SimpleEvent(description = "Triggered when text changes")
    public void OnTextChanged(String newText) {
        EventDispatcher.dispatchEvent(this, "OnTextChanged", newText);
    }

    @Override
    public View getView() {
        return textView;
    }
}