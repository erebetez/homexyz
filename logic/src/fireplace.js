"use strict";

function fireplaceLogic() {
    const observe = ["fireplace_fan", "fireplace_temp_bottom", "fireplace_fan_button"];
    const origin = "fireplace_logic_request"

    const starttemperature = 60;
    const mintemperature = 50;

    let temperature = 0;
    let fan = 0;
    let logicOn = true;

    function logic() {
        if (temperature >= starttemperature) {
            return 1;
        }

        if (temperature < mintemperature) {
            return 0;
        }
    }

    return {
        observe: observe,
        eval: (data, send) => {

            if (data.key === "fireplace_temp_bottom") {
                temperature = data.value;

                let decision = logic();

                if (fan === decision) {
                    send("fireplace_fan", undefined, origin);
                } else {
                    send("fireplace_fan", decision, origin);
                }
                return
            }
            if (data.key === "fireplace_temp_bottom") {
                logicOn = false;
            }
            if (data.key === "fireplace_fan") {
                fan = data.value;
            }
            send(undefined, undefined, origin);
        }
    }
}

module.exports = fireplaceLogic;