"use strict";

const fireplaceLogic = require("../src/fireplace");

test('check observebals', () => {
    const fireplace = fireplaceLogic();
    expect(fireplace.observe).toStrictEqual(["fireplace_fan", "fireplace_temp_bottom"]);
});


test('fan off, below treshold', () => {
    const fireplace = fireplaceLogic();

    fireplace.eval({
        key: "fireplace_fan", value: 0, transaction_id: "ti"
    }) // no callback

    fireplace.eval({
        key: "fireplace_temp_bottom", value: 20, transaction_id: "ti"
    }, (key, value, origin) => {
        expect(key).toBe("fireplace_fan");
        expect(value).toBe(undefined);
        expect(origin).toBe("fireplace_logic_request");
    })
});

test('fan off, at treshold', () => {
    const fireplace = fireplaceLogic();

    fireplace.eval({
        key: "fireplace_fan", value: 0, transaction_id: "ti"
    }) // no callback

    fireplace.eval({
        key: "fireplace_temp_bottom", value: 60, transaction_id: "ti"
    }, (key, value, origin) => {
        expect(key).toBe("fireplace_fan");
        expect(value).toBe(1);
        expect(origin).toBe("fireplace_logic_request");
    })
});

test('fan on, at treshold', () => {
    const fireplace = fireplaceLogic();

    fireplace.eval({
        key: "fireplace_fan", value: 1, transaction_id: "ti"
    }) // no callback

    fireplace.eval({
        key: "fireplace_temp_bottom", value: 60, transaction_id: "ti"
    }, (key, value, origin) => {
        expect(key).toBe("fireplace_fan");
        expect(value).toBe(undefined);
        expect(origin).toBe("fireplace_logic_request");
    })
});


test('fan on, below treshold', () => {
    const fireplace = fireplaceLogic();

    fireplace.eval({
        key: "fireplace_fan", value: 1, transaction_id: "ti"
    }) // no callback

    fireplace.eval({
        key: "fireplace_temp_bottom", value: 49, transaction_id: "ti"
    }, (key, value, origin) => {
        expect(key).toBe("fireplace_fan");
        expect(value).toBe(0);
        expect(origin).toBe("fireplace_logic_request");
    })
});