package {{package}};

import com.google.appinventor.components.annotations.*;
import com.google.appinventor.components.runtime.*;
import com.google.appinventor.components.common.*;
import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

/**
 * {{description}}
 * 
 * A sensor-based extension for App Inventor that demonstrates
 * integration with Android sensor framework.
 */
@DesignerComponent(
    version = 1,
    description = "{{description}}",
    category = ComponentCategory.EXTENSION,
    nonVisible = true,
    iconName = "images/extension.png"
)
@SimpleObject(external = true)
public class {{className}} extends AndroidNonvisibleComponent implements SensorEventListener {

    private SensorManager sensorManager;
    private Sensor sensor;
    private boolean isRunning = false;
    private float lastX, lastY, lastZ;

    /**
     * Creates a new {{className}} component.
     * 
     * @param container the component container
     */
    public {{className}}(ComponentContainer container) {
        super(container.$form());
        initializeSensor();
    }

    /**
     * Initializes the sensor manager and sensor.
     */
    private void initializeSensor() {
        try {
            sensorManager = (SensorManager) container.$context().getSystemService(Context.SENSOR_SERVICE);
            sensor = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        } catch (Exception e) {
            // Handle initialization error
        }
    }

    /**
     * Starts sensor data collection.
     */
    @SimpleFunction(description = "Starts sensor data collection")
    public void StartSensor() {
        if (sensor != null && !isRunning) {
            sensorManager.registerListener(this, sensor, SensorManager.SENSOR_DELAY_NORMAL);
            isRunning = true;
            OnSensorStarted();
        }
    }

    /**
     * Stops sensor data collection.
     */
    @SimpleFunction(description = "Stops sensor data collection")
    public void StopSensor() {
        if (isRunning) {
            sensorManager.unregisterListener(this);
            isRunning = false;
            OnSensorStopped();
        }
    }

    /**
     * Checks if sensor is currently running.
     * 
     * @return true if sensor is running, false otherwise
     */
    @SimpleFunction(description = "Checks if sensor is currently running")
    public boolean IsSensorRunning() {
        return isRunning;
    }

    /**
     * Gets the last X-axis sensor value.
     * 
     * @return the last X-axis value
     */
    @SimpleProperty(description = "The last X-axis sensor value")
    public float LastX() {
        return lastX;
    }

    /**
     * Gets the last Y-axis sensor value.
     * 
     * @return the last Y-axis value
     */
    @SimpleProperty(description = "The last Y-axis sensor value")
    public float LastY() {
        return lastY;
    }

    /**
     * Gets the last Z-axis sensor value.
     * 
     * @return the last Z-axis value
     */
    @SimpleProperty(description = "The last Z-axis sensor value")
    public float LastZ() {
        return lastZ;
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            lastX = event.values[0];
            lastY = event.values[1];
            lastZ = event.values[2];
            OnSensorDataChanged(lastX, lastY, lastZ);
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // Handle accuracy changes if needed
    }

    /**
     * Triggered when sensor data changes.
     * 
     * @param x the X-axis value
     * @param y the Y-axis value
     * @param z the Z-axis value
     */
    @SimpleEvent(description = "Triggered when sensor data changes")
    public void OnSensorDataChanged(float x, float y, float z) {
        EventDispatcher.dispatchEvent(this, "OnSensorDataChanged", x, y, z);
    }

    /**
     * Triggered when sensor starts.
     */
    @SimpleEvent(description = "Triggered when sensor starts")
    public void OnSensorStarted() {
        EventDispatcher.dispatchEvent(this, "OnSensorStarted");
    }

    /**
     * Triggered when sensor stops.
     */
    @SimpleEvent(description = "Triggered when sensor stops")
    public void OnSensorStopped() {
        EventDispatcher.dispatchEvent(this, "OnSensorStopped");
    }
}