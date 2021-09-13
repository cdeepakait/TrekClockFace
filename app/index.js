import clock from "clock";
import { display } from "display";
import { Barometer } from "barometer";
import { HeartRateSensor } from "heart-rate";
import { user } from "user-profile";
import { today } from "user-activity";
import document from "document";
import { preferences } from "user-settings";
import * as util from "../common/utils";
// Fetch UI elements we will need to change
const altitudeLabel = document.getElementById("altitude");
const oxygenLabel = document.getElementById("oxygen");
const curTime = document.getElementById("time");
const heartRate = document.getElementById("hr");
const step = document.getElementById("steps");
const floor = document.getElementById("floors");
const sensors = [];


if (Barometer) {
  const barometer = new Barometer({ frequency: 1 });
  barometer.addEventListener("reading", () => {
    altitudeLabel.text = altitudeFromPressure(barometer.pressure / 100).toPrecision(5) + " ft";
    oxygenLabel.text = oxygenPercentFromAltitude(barometer.pressure) + " (%O2)"
  });
  sensors.push(barometer);
  barometer.start();
}

if (HeartRateSensor) {
  const hrm = new HeartRateSensor();
  hrm.addEventListener("reading", () => {
    let rate = hrm.heartRate
    let zone = user.heartRateZone(rate)
    if (zone == "out-of-range") {
      zone = "Regular"
    }
    heartRate.text = `HR        : ${rate} (${zone})`
  });

  sensors.push(hrm);
  hrm.start();
}

function oxygenPercentFromAltitude(pressure) {
  return ((pressure / 100) - 4.36) / 10
}

// Converts pressure in millibars to altitude in feet
// https://en.wikipedia.org/wiki/Pressure_altitude
function altitudeFromPressure(pressure) {
  return (1 - (pressure / 1013.25) ** 0.190284) * 145366.45;
}
// Update the clock every minute
clock.granularity = "seconds";

// Get a handle on the <text> element


// Update the <text> element every tick with the current time
clock.ontick = (evt) => {
  let tod = evt.date;
  let hours = tod.getHours();
  if (preferences.clockDisplay === "12h") {
    // 12h format
    hours = hours % 12 || 12;
  } else {
    // 24h format
    hours = util.zeroPad(hours);
  }
  let mins = util.zeroPad(tod.getMinutes());
  let seconds = util.zeroPad(tod.getSeconds());
  curTime.text = `${hours}:${mins}:${seconds}`;
  step.text = `Steps  : ${today.adjusted.steps}`;
  floor.text = `Floors : ${today.adjusted.elevationGain}`
}

display.addEventListener("change", () => {
  // Automatically stop all sensors when the screen is off to conserve battery
  display.on ? sensors.map(sensor => sensor.start()) : sensors.map(sensor => sensor.stop());
});
