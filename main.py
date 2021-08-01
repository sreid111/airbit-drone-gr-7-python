def failSafe():
    global throttle, yaw, pitch, roll, arm
    if input.running_time() > failSafeCounter + 1000:
        throttle = 30
        yaw = 0
        pitch = 0
        roll = 0
    if input.running_time() > failSafeCounter + 5000:
        arm = 0
def lowBattery():
    global arm, throttle, batteryEmpty
    if batteryEmpty:
        iconBatteryDead()
    elif batteryMilliVolt > lowBatteryLimit - 50:
        iconBatteryLow()
    elif batteryMilliVolt > lowBatteryLimit - 60:
        if input.running_time() % 1000 < 500:
            iconBatteryLow()
    else:
        arm = 0
        throttle = 0
        batteryEmpty = True
        iconBatteryDead()

def on_received_value_deprecated(name, value):
    global pitch, arm, roll, throttle, yaw, failSafeCounter
    autoPilot = False
    if autoPilot == False:
        if name == "P":
            pitch = value
        if name == "A":
            arm = value
        if name == "R":
            roll = value
        if name == "T":
            throttle = value
        if name == "Y":
            yaw = value
    failSafeCounter = input.running_time()
radio.on_received_value_deprecated(on_received_value_deprecated)

def iconBatteryCharging():
    basic.show_leds("""
        . . # . .
        . # . # .
        . # . # .
        . # . # .
        . # # # .
        """)
    basic.show_leds("""
        . . # . .
        . # . # .
        . # . # .
        . # # # .
        . # # # .
        """)
    basic.show_leds("""
        . . # . .
        . # . # .
        . # # # .
        . # # # .
        . # # # .
        """)
    basic.show_leds("""
        . . # . .
        . # # # .
        . # # # .
        . # # # .
        . # # # .
        """)
def mainScreen():
    basic.clear_screen()
    if arm == 1:
        if input.running_time() % 500 > 250:
            led.plot(0, 0)
    led.plot(0, (100 - throttle) / 25)
    led.plot((45 + roll) / 18, (45 + pitch) / 18)
    led.plot(Math.map(yaw, -30, 30, 1, 3), 4)
    if batteryMilliVolt > 100:
        if arm == 1:
            AirBit.plot_yline(4,
                Math.round(Math.map(batteryMilliVolt, 3400, 3900, 4, 0)),
                4)
        else:
            AirBit.plot_yline(4,
                Math.round(Math.map(batteryMilliVolt, 3700, 4200, 4, 0)),
                4)
    else:
        if input.running_time() % 500 > 250:
            led.plot(4, 4)
def iconBatteryDead():
    basic.show_leds("""
        . # # # .
        # . # . #
        # # # # #
        . # . # .
        . # . # .
        """)
def calculateBatteryVoltage():
    global batteryMilliVolt
    batteryMilliVolt = Math.round(pins.analog_read_pin(AnalogPin.P0) * batteryFactor * 0.05 + batteryMilliVolt * 0.95)
def iconBatteryLow():
    basic.show_leds("""
            . . # . .
            . # # # .
            . # . # .
            . # . # .
            . # # # .
            """,
        0)

def on_gesture_screen_down():
    global arm
    arm = 0
input.on_gesture(Gesture.SCREEN_DOWN, on_gesture_screen_down)

buzzer = 0
arm = 0
roll = 0
pitch = 0
yaw = 0
throttle = 0
failSafeCounter = 0
batteryEmpty = False
batteryMilliVolt = 0
lowBatteryLimit = 0
batteryFactor = 0
radioGroup = 7
basic.show_number(radioGroup)
radio.set_group(radioGroup)
batteryFactor = 4.42
lowBatteryLimit = 3400
batteryMilliVolt = 3700
batteryEmpty = False
serial.redirect(SerialPin.P1, SerialPin.P8, BaudRate.BAUD_RATE115200)

def on_forever():
    global buzzer, arm
    calculateBatteryVoltage()
    led.toggle(4, 0)
    # basic.clearScreen()
    if pins.analog_read_pin(AnalogPin.P0) < 600 and pins.analog_read_pin(AnalogPin.P0) >= 400:
        iconBatteryCharging()
    elif batteryEmpty or batteryMilliVolt < lowBatteryLimit and pins.analog_read_pin(AnalogPin.P0) > 300:
        lowBattery()
    else:
        mainScreen()
        buzzer = 0
    # failSafe()
    if batteryEmpty:
        arm = 0
    failSafe()
    AirBit.flight_control(throttle, yaw, pitch, roll, arm, 0, 0)
    radio.send_value("B", batteryMilliVolt)
    radio.send_value("A", pins.analog_read_pin(AnalogPin.P0))
    radio.send_value("G", input.acceleration(Dimension.Z))
basic.forever(on_forever)
