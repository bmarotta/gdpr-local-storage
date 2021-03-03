/**
 * Fallback class in the case that the local storage is not accessible at all (e.g. Private Mode)
 */
class LocalStorageFallback {
    // When true, write all directly to the local storage
    static passThrough = true;

    static initialize() {
        if (!LocalStorageFallback.passThrough) {
            console.warn("LocalStorageFallback already initialized");
            return;
        }

        // Try to get all local storage items (if accessible)
        try {
            const keys = Object.keys(localStorage);
            let i = keys.length;

            while (i--) {
                const value = localStorage.getItem(keys[i]);
                if (value != null) {
                    LocalStorageFallback.setItem(keys[i], value);
                }
            }
        } catch {
            // do nothing
        }

        // Override the existing methods
        Storage.prototype._getItem = Storage.prototype.getItem;
        Storage.prototype.getItem = LocalStorageFallback.getItem;
        Storage.prototype._setItem = Storage.prototype.setItem;
        Storage.prototype.setItem = LocalStorageFallback.setItem;
        Storage.prototype._removeItem = Storage.prototype.removeItem;
        Storage.prototype.removeItem = LocalStorageFallback.removeItem;

        LocalStorageFallback.passThrough = false;
    }

    // internal object to hold data
    static storage: any = {};
    /**
     * Returns the number of key/value pairs currently present in the list associated with the object.
     */
    static storageLength = 0;
    /**
     * Empties the list associated with the object of all key/value pairs, if there are any.
     */
    public static clear(): void {
        LocalStorageFallback.storage = {};
    }

    /**
     * Returns the current value associated with the given key, or null if the given key does not exist in the list associated with the object.
     */
    public static getItem(key: string): string | null {
        if (LocalStorageFallback.passThrough) {
            return window.localStorage.getItem(key);
        }
        if (Object.prototype.hasOwnProperty.call(LocalStorageFallback.storage, key)) {
            return LocalStorageFallback.storage[key];
        }
        return null;
    }
    /**
     * Returns the name of the nth key in the list, or null if n is greater than or equal to the number of key/value pairs in the object.
     */
    public static key(index: number): string | null {
        if (LocalStorageFallback.passThrough) {
            return window.localStorage.key(index);
        }
        const props = Object.getOwnPropertyNames(LocalStorageFallback.storage);
        if (index < props.length) {
            return props[index];
        }
        return null;
    }
    /**
     * Removes the key/value pair with the given key from the list associated with the object, if a key/value pair with the given key exists.
     */
    public static removeItem(key: string): void {
        if (LocalStorageFallback.passThrough) {
            window.localStorage.removeItem(key);
        } else {
            if (Object.prototype.hasOwnProperty.call(LocalStorageFallback.storage, key)) {
                delete LocalStorageFallback.storage[key];
                LocalStorageFallback.storageLength--;
            }
        }
    }
    /**
     * Sets the value of the pair identified by key to value, creating a new key/value pair if none existed for key previously.
     *
     * Throws a "QuotaExceededError" DOMException exception if the new value couldn't be set. (Setting could fail if, e.g., the user has disabled storage for the site, or if the quota has been exceeded.)
     */
    public static setItem(key: string, value: string): void {
        if (LocalStorageFallback.passThrough) {
            window.localStorage.setItem(key, value);
        } else {
            LocalStorageFallback.storage[key] = String(value);
            LocalStorageFallback.storageLength = Object.getOwnPropertyNames(LocalStorageFallback.storage).length;
        }
    }

    /**
     * Saves all the variables to the real local storage and activate passthrough mode
     */
    public static release() {
        if (!window.localStorage._setItem || !LocalStorageFallback.passThrough) {
            // Fallback not installed
            console.warn("LocalStorageWrapper not initialized");
            return;
        }
        // Save all items to the local storage
        try {
            const props = Object.getOwnPropertyNames(LocalStorageFallback.storage);
            for (let i = 0; i < props.length; i++) {
                const key = props[i];
                window.localStorage._setItem(key, LocalStorageFallback.storage[props[i]]);
            }
        } catch (ex) {
            // do nothing
            console.warn("Error releasing local storage fallback: " + ex);
            return;
        }

        LocalStorageFallback.passThrough = true;

        // Restore methods
        Storage.prototype.getItem = Storage.prototype._getItem;
        Storage.prototype._getItem = undefined;
        Storage.prototype.setItem = Storage.prototype._setItem;
        Storage.prototype._setItem = undefined;
        Storage.prototype.removeItem = Storage.prototype._removeItem;
        Storage.prototype._removeItem = undefined;
    }
}

/**
 * A wrapper to the Browser Local Storage
 */
export class LocalStorageWrapper {
    constructor(defferSaving: boolean) {
        if (defferSaving) {
            this.installLocalStorageFallback();
        } else {
            this.installFallbackIfLocalStorageNotAccessible();
        }
    }

    private tryGetWindowLocalStorage(): any {
        try {
            return window.localStorage;
        } catch (ex) {
            console.warn("Cannot get localStorage: " + ex);
        }
        return null;
    }

    public get usingLocalStorageFallback(): boolean {
        if (!this.tryGetWindowLocalStorage()) {
            this.installLocalStorageFallback();
        }
        return !LocalStorageFallback.passThrough;
    }

    public installFallbackIfLocalStorageNotAccessible(): void {
        const windowLocalStorage = this.tryGetWindowLocalStorage();
        // In Firefox when turning access to local storage off it will return null
        // and won't allow override
        if (!windowLocalStorage) {
            this.installLocalStorageFallback();
        }
        // Safari, in Private Browsing Mode, looks like it supports localStorage but all calls to setItem
        // throw QuotaExceededError. We're going to detect this and just silently drop any calls to setItem
        // to avoid the entire page breaking, without having to do a check at each usage of Storage.
        else if (typeof windowLocalStorage === "object") {
            try {
                windowLocalStorage.setItem("localStorage", "1");
                windowLocalStorage.getItem("localStorage");
                windowLocalStorage.removeItem("localStorage");
            } catch (e) {
                this.installLocalStorageFallback();
            }
        }
    }

    private installLocalStorageFallback() {
        LocalStorageFallback.initialize();
        console.info("Using local storage fallback");
    }

    public release(): void {
        if (!LocalStorageFallback.passThrough && this.tryGetWindowLocalStorage()) {
            LocalStorageFallback.release();
        }
    }

    // public static localStorageGetItem(item: string): string | null {
    //     var windowLocalStorage = Utility.safeGetWindowLocalStorage();
    //     if (!windowLocalStorage || !windowLocalStorage.getItem) {
    //         if (Utility.localStorageFallback) {
    //             return Utility.localStorageFallback.getItem(item);
    //         }
    //     }
    //     try {
    //         return windowLocalStorage.getItem(item);
    //     }
    //     catch (exception) {
    //         console.warn(`Error getting ${item} from localStorage: ${exception}`);
    //         return null;
    //     }
    // }

    // public static localStorageSetItem(item: string, value: string): boolean {
    // var windowLocalStorage = Utility.safeGetWindowLocalStorage();
    //     if (!windowLocalStorage || !windowLocalStorage.setItem) {
    //         if (Utility.localStorageFallback) {
    //             Utility.localStorageFallback.setItem(item, value);
    //         }
    //         return false;
    //     }
    //     try {
    //         windowLocalStorage.setItem(item, value);
    //         return true;
    //     }
    //     catch (exception) {
    //         console.warn(`Error saving ${item} to localStorage: ${exception}`);
    //         return false;
    //     }
    // }
}
