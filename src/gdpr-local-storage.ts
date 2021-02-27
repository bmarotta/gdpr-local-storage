import { TcfApiV2Wrapper } from "./tcf-api-v2-wrapper";
import { GdprLocalStorageOptions } from "./gdpr-local-storage-options";
import { LocalStorageWrapper } from "./local-storage-wrapper";

export class GdprLocalStorage {
    private tcfApiWrapper: TcfApiV2Wrapper | null = null;
    private localStorageWrapper: LocalStorageWrapper;

    /**
     * Install the GDPR local storage. Should be called in the very beginning of your code
     * @param options Behaviour options
     * @param tcfApiTimeoutMs Timeout to wait for the TcfApi
     */
    constructor(private options: GdprLocalStorageOptions | null, private _cookieConsented: Promise<boolean>) {
        if (!this.options) {
            this.options = new GdprLocalStorageOptions();
        }

        if (this.options.usesTcfApi) {
            this.tcfApiWrapper = new TcfApiV2Wrapper(this.options.tcfApiTimeoutMs);
            this._cookieConsented = this.tcfApiWrapper.promise;
        } else if (!this._cookieConsented) {
            throw new Error("You should either use TCF API or specify your own consent promise");
        }

        // Create the local storage wrapper
        this.localStorageWrapper = new LocalStorageWrapper(true);

        this._cookieConsented.then((value) => {
            if (value) {
                // User consented to cookie. Release the local storage
                this.localStorageWrapper.release();
            }
        });
    }

    getCookieConsented(): Promise<boolean> {
        return this._cookieConsented;
    }
}