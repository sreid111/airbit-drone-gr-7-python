function failSafe () {
    if (input.runningTime() > failSafeCounter + 1000) {
        throttle = 30
        yaw = 0
        pitch = 0
        roll = 0
    }
    if (input.runningTime() > failSafeCounter + 5000) {
        arm = 0
    }
}
function lowBattery () {
    if (batteryEmpty) {
        iconBatteryDead()
    } else if (batteryMilliVolt > lowBatteryLimit - 50) {
        iconBatteryLow()
    } else if (batteryMilliVolt > lowBatteryLimit - 60) {
        if (input.runningTime() % 1000 < 500) {
            iconBatteryLow()
        }
    } else {
        arm = 0
        throttle = 0
        batteryEmpty = true
        iconBatteryDead()
    }
}
radio.onReceivedValueDeprecated(function (name, value) {
    let autoPilot = false
    if (autoPilot == false) {
        if (name == "P") {
            pitch = value
        }
        if (name == "A") {
            arm = value
        }
        if (name == "R") {
            roll = value
        }
        if (name == "T") {
            throttle = value
        }
        if (name == "Y") {
            yaw = value
        }
    }
    failSafeCounter = input.runningTime()
})
function iconBatteryCharging () {
    basic.showLeds(`
        . . # . .
        . # . # .
        . # . # .
        . # . # .
        . # # # .
        `)
    basic.showLeds(`
        . . # . .
        . # . # .
        . # . # .
        . # # # .
        . # # # .
        `)
    basic.showLeds(`
        . . # . .
        . # . # .
        . # # # .
        . # # # .
        . # # # .
        `)
    basic.showLeds(`
        . . # . .
        . # # # .
        . # # # .
        . # # # .
        . # # # .
        `)
}
function mainScreen () {
    basic.clearScreen()
    if (arm == 1) {
        if (input.runningTime() % 500 > 250) {
            led.plot(0, 0)
        }
    }
    led.plot(0, (100 - throttle) / 25)
    led.plot((45 + roll) / 18, (45 + pitch) / 18)
    led.plot(Math.map(yaw, -30, 30, 1, 3), 4)
    if (batteryMilliVolt > 100) {
        if (arm == 1) {
            AirBit.plotYLine(4, Math.round(Math.map(batteryMilliVolt, 3400, 3900, 4, 0)), 4)
        } else {
            AirBit.plotYLine(4, Math.round(Math.map(batteryMilliVolt, 3700, 4200, 4, 0)), 4)
        }
    } else if (input.runningTime() % 500 > 250) {
        led.plot(4, 4)
    }
}
function iconBatteryDead () {
    basic.showLeds(`
        . # # # .
        # . # . #
        # # # # #
        . # . # .
        . # . # .
        `)
}
function calculateBatteryVoltage () {
    batteryMilliVolt = Math.round(pins.analogReadPin(AnalogPin.P0) * batteryFactor * 0.05 + batteryMilliVolt * 0.95)
}
function iconBatteryLow () {
    basic.showLeds(`
            . . # . .
            . # # # .
            . # . # .
            . # . # .
            . # # # .
            `, 0)
}
input.onGesture(Gesture.ScreenDown, function () {
    arm = 0
})
let buzzer = 0
let arm = 0
let roll = 0
let pitch = 0
let yaw = 0
let throttle = 0
let failSafeCounter = 0
let batteryEmpty = false
let batteryMilliVolt = 0
let lowBatteryLimit = 0
let batteryFactor = 0
let radioGroup = 11
basic.showNumber(radioGroup)
radio.setGroup(radioGroup)
batteryFactor = 4.42
lowBatteryLimit = 3400
batteryMilliVolt = 3700
batteryEmpty = false
serial.redirect(
SerialPin.P1,
SerialPin.P8,
BaudRate.BaudRate115200
)
basic.forever(function () {
    calculateBatteryVoltage()
    led.toggle(4, 0)
    // basic.clearScreen()
    if (pins.analogReadPin(AnalogPin.P0) < 600 && pins.analogReadPin(AnalogPin.P0) >= 400) {
        iconBatteryCharging()
    } else if (batteryEmpty || batteryMilliVolt < lowBatteryLimit && pins.analogReadPin(AnalogPin.P0) > 300) {
        lowBattery()
    } else {
        mainScreen()
        buzzer = 0
    }
    // failSafe()
    if (batteryEmpty) {
        arm = 0
    }
    failSafe()
    AirBit.FlightControl(
    throttle,
    yaw,
    pitch,
    roll,
    arm,
    0,
    0
    )
    radio.sendValue("B", batteryMilliVolt)
    radio.sendValue("A", pins.analogReadPin(AnalogPin.P0))
    radio.sendValue("G", input.acceleration(Dimension.Z))
})
