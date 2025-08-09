package {{package}}

import com.google.appinventor.components.annotations.*
import com.google.appinventor.components.runtime.*
import com.google.appinventor.components.common.*
import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager

/**
 * {{description}}
 * 
 * A sensor-based extension for App Inventor using Kotlin that demonstrates
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
class {{className}} : AndroidNonvisibleComponent, SensorEventListener {
    
    private lateinit var sensorManager: SensorManager
    private var sensor: Sensor? = null
    private var isRunning = false
    private var lastX: Float = 0f
    private var lastY: Float = 0f
    private var lastZ: Float = 0f
    
    /**
     * Creates a new {{className}} component.
     * 
     * @param container the component container
     */
    constructor(container: ComponentContainer) : super(container.$form()) {
        initializeSensor()
    }
    
    /**
     * Initializes the sensor manager and sensor.
     */
    private fun initializeSensor() {
        try {
            sensorManager = container.$context().getSystemService(Context.SENSOR_SERVICE) as SensorManager
            sensor = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        } catch (e: Exception) {
            // Handle initialization error
        }
    }
    
    /**
     * Starts sensor data collection.
     */
    @SimpleFunction(description = "Starts sensor data collection")
    fun StartSensor() {
        sensor?.let {
            if (!isRunning) {
                sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_NORMAL)
                isRunning = true
                OnSensorStarted()
            }
        }
    }
    
    /**
     * Stops sensor data collection.
     */
    @SimpleFunction(description = "Stops sensor data collection")
    fun StopSensor() {
        if (isRunning) {
            sensorManager.unregisterListener(this)
            isRunning = false
            OnSensorStopped()
        }
    }
    
    /**
     * Checks if sensor is currently running.
     * 
     * @return true if sensor is running, false otherwise
     */
    @SimpleFunction(description = "Checks if sensor is currently running")
    fun IsSensorRunning(): Boolean {
        return isRunning
    }
    
    /**
     * Gets the last X-axis sensor value.
     * 
     * @return the last X-axis value
     */
    @SimpleProperty(description = "The last X-axis sensor value")
    fun LastX(): Float {
        return lastX
    }
    
    /**
     * Gets the last Y-axis sensor value.
     * 
     * @return the last Y-axis value
     */
    @SimpleProperty(description = "The last Y-axis sensor value")
    fun LastY(): Float {
        return lastY
    }
    
    /**
     * Gets the last Z-axis sensor value.
     * 
     * @return the last Z-axis value
     */
    @SimpleProperty(description = "The last Z-axis sensor value")
    fun LastZ(): Float {
        return lastZ
    }
    
    override fun onSensorChanged(event: SensorEvent) {
        if (event.sensor.type == Sensor.TYPE_ACCELEROMETER) {
            lastX = event.values[0]
            lastY = event.values[1]
            lastZ = event.values[2]
            OnSensorDataChanged(lastX, lastY, lastZ)
        }
    }
    
    override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {
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
    fun OnSensorDataChanged(x: Float, y: Float, z: Float) {
        EventDispatcher.dispatchEvent(this, "OnSensorDataChanged", x, y, z)
    }
    
    /**
     * Triggered when sensor starts.
     */
    @SimpleEvent(description = "Triggered when sensor starts")
    fun OnSensorStarted() {
        EventDispatcher.dispatchEvent(this, "OnSensorStarted")
    }
    
    /**
     * Triggered when sensor stops.
     */
    @SimpleEvent(description = "Triggered when sensor stops")
    fun OnSensorStopped() {
        EventDispatcher.dispatchEvent(this, "OnSensorStopped")
    }
}