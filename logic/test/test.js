"use strict";

const fireplaceLogic = require("../src/fireplace");

test('check observebals', () => {
    const fireplace = fireplaceLogic();
    expect(fireplace.observe).toStrictEqual(["fireplace_fan", "fireplace_temp_bottom", "fireplace_fan_button"]);
});


test('fan off, below treshold', () => {
    const fireplace = fireplaceLogic();

    fireplace.eval({
        key: "fireplace_fan", value: 0, transaction_id: "ti"
    }, (key, value, origin) => {
        expect(key).toBe(undefined);
        expect(value).toBe(undefined);
    })

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
    }, (key, value, origin) => {
        expect(key).toBe(undefined);
        expect(value).toBe(undefined);
    })

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
    }, (key, value, origin) => {
        expect(key).toBe(undefined);
        expect(value).toBe(undefined);
    })

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
    }, (key, value, origin) => {
        expect(key).toBe(undefined);
        expect(value).toBe(undefined);
    })

    fireplace.eval({
        key: "fireplace_temp_bottom", value: 49, transaction_id: "ti"
    }, (key, value, origin) => {
        expect(key).toBe("fireplace_fan");
        expect(value).toBe(0);
        expect(origin).toBe("fireplace_logic_request");
    })
});


test('fan on, and off', () => {
    const fireplace = fireplaceLogic();

    fireplace.eval({
        key: "fireplace_fan", value: 0, transaction_id: "ti"
    }, (key, value, origin) => {
        expect(key).toBe(undefined);
        expect(value).toBe(undefined);
    })

    fireplace.eval({
        key: "fireplace_temp_bottom", value: 60, transaction_id: "ti"
    }, (key, value, origin) => {
        expect(key).toBe("fireplace_fan");
        expect(value).toBe(1);
        expect(origin).toBe("fireplace_logic_request");
    })

    // after the request the new value shoud be returned.
    fireplace.eval({
        key: "fireplace_fan", value: 1, transaction_id: "ti"
    }, (key, value, origin) => {
        expect(key).toBe(undefined);
        expect(value).toBe(undefined);
    })

    fireplace.eval({
        key: "fireplace_temp_bottom", value: 50, transaction_id: "ti"
    }, (key, value, origin) => {
        expect(key).toBe("fireplace_fan");
        expect(value).toBe(undefined);
        expect(origin).toBe("fireplace_logic_request");
    })

    fireplace.eval({
        key: "fireplace_temp_bottom", value: 49, transaction_id: "ti"
    }, (key, value, origin) => {
        expect(key).toBe("fireplace_fan");
        expect(value).toBe(0);
        expect(origin).toBe("fireplace_logic_request");
    })

    // after the request the new value shoud be returned.
    fireplace.eval({
        key: "fireplace_fan", value: 0, transaction_id: "ti"
    }, (key, value, origin) => {
        expect(key).toBe(undefined);
        expect(value).toBe(undefined);
    })

    fireplace.eval({
        key: "fireplace_temp_bottom", value: 40, transaction_id: "ti"
    }, (key, value, origin) => {
        expect(key).toBe("fireplace_fan");
        expect(value).toBe(undefined);
        expect(origin).toBe("fireplace_logic_request");
    })
});