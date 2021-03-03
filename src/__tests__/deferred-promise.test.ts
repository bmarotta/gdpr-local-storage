import { DeferredPromise } from "../index";

test("DeferredPromise true", () => {
    const dp1 = new DeferredPromise<boolean>();
    dp1.resolve(true);
    return dp1.promise.then((value) => expect(value).toBe(true));
});

test("DeferredPromise false", () => {
    const dp1 = new DeferredPromise<boolean>();
    dp1.resolve(false);
    return dp1.promise.then((value) => expect(value).toBe(false));
});

test("DeferredPromise reject", () => {
    const dp3 = new DeferredPromise<boolean>();
    dp3.reject(new Error("Failed"));

    return expect(dp3.promise).rejects.toBeInstanceOf(Error);
});
