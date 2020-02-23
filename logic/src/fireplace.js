"use strict";

function fireplaceLogic() {
    const observe = ["fireplace_fan", "fireplace_temp_bottom"];
    const origin = "fireplace_logic_request"

    const starttemperature = 60;
    const mintemperature = 50;

    let temperature = 0;
    let fan = 0;

    function logic() {
        if (temperature >= starttemperature && fan == 0) {
            return 1;
        }

        if (temperature < mintemperature && fan == 1) {
            return 0;
        }
    }

    return {
        observe: observe,
        eval: (data, send) => {

            if (data.key === "fireplace_temp_bottom") {
                temperature = data.value;
                let decision = logic();
                send("fireplace_fan", decision, origin)
            }
            if (data.key === "fireplace_fan") {
                fan = data.value;
            }
        }
    }
}

module.exports = fireplaceLogic;