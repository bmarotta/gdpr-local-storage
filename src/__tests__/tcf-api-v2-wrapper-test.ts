import { TcfApiV2Wrapper } from "../index";

beforeEach(() => {
    (<any>window).__uspFailed = undefined;
    (<any>window).__tcfapi = undefined;
});

afterEach(() => {
    (<any>window).__uspFailed = undefined;
    (<any>window).__tcfapi = undefined;
});

test("Test TCF API not available", () => {
    const wrapper = new TcfApiV2Wrapper(100);
    return expect(wrapper.promise).rejects.toBeInstanceOf(Error);
});

test("Test TCF API timeout", () => {
    const listeners = [];
    (<any>window).__tcfapi = function (command: string, version: number, callback: () => void, parameter: any) {
        if (command == "addEventListener") {
            listeners.push(callback);
        }
    };

    const wrapper = new TcfApiV2Wrapper(100);

    // Flag as failed
    (<any>window).__uspFailed = true;
    return expect(wrapper.promise).rejects.toBeInstanceOf(Error);
});

test("Test TCF API Gdpr doesnt apply", () => {
    const listeners: ((tcData: any, success: boolean) => void)[] = [];
    (<any>window).__uspFailed = undefined;
    (<any>window).__tcfapi = function (command: string, version: number, callback: (tcData: any, success: boolean) => void, parameter: any) {
        if (command == "addEventListener") {
            listeners.push(callback);
        }
    };

    const wrapper = new TcfApiV2Wrapper(5000);
    for (const listener of listeners) {
        // First the UI is shown
        listener({ eventStatus: "tcloaded", gdprApplies: false }, true);
    }

    return expect(wrapper.promise).resolves.toBe(true);
});

test("Test TCF API GDPR consented", () => {
    const listeners: ((tcData: any, success: boolean) => void)[] = [];
    (<any>window).__uspFailed = undefined;
    (<any>window).__tcfapi = function (command: string, version: number, callback: (tcData: any, success: boolean) => void, parameter: any) {
        if (command == "addEventListener") {
            listeners.push(callback);
        }
    };

    const wrapper = new TcfApiV2Wrapper(5000);
    for (const listener of listeners) {
        // First the UI is shown
        listener({ eventStatus: "cmpuishown", gdprApplies: true }, true);
        // The the user answers
        listener({ eventStatus: "useractioncomplete", gdprApplies: true, purpose: { consents: { "1": true } } }, true);
    }

    return expect(wrapper.promise).resolves.toBe(true);
});
