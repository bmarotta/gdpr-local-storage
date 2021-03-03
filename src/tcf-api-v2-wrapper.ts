import { DeferredPromise } from "./deferred-promise";

enum LoadStatus {
    NotLoaded = 0,
    Loading = 1,
    Loaded = 2,
    Failed = 3
}

/**
 * A Typescript Wrapper for TCF API v2
 */
export class TcfApiV2Wrapper {
    private defferedPromise: DeferredPromise<boolean>;
    public consentNeeded: boolean | null = null;
    public consentToCookies: boolean | null = null;

    constructor(private tcfApiTimeout: number) {
        this.defferedPromise = new DeferredPromise();
        this.defferedPromise.promise
            // Avoid uncatched promies
            .catch((reason) => console.warn("Failed TCF API: " + reason));
        this.subscribeToTcfApi();
    }

    get promise(): Promise<boolean> {
        return this.defferedPromise.promise;
    }

    private hasTcfApi() {
        return (<any>window).__tcfapi && !(<any>window).__uspFailed;
    }

    private subscribeToTcfApi() {
        if (!this.hasTcfApi()) {
            this.defferedPromise.reject(new Error((<any>window).__uspFailed ? "TCF API timeout" : "TCF API not available"));
        } else {
            setTimeout(() => {
                if (!this.hasTcfApi()) {
                    this.defferedPromise.reject(new Error((<any>window).__uspFailed ? "TCF API timeout" : "Failed loading TCF API"));
                }
            }, this.tcfApiTimeout);

            window.addEventListener("usp-failed", () => {
                if (!this.hasTcfApi()) {
                    this.defferedPromise.reject(
                        new Error((<any>window).__uspFailed ? "TCF API loading failed or timed-out" : "Failed loading TCF API")
                    );
                }
            });

            (<any>window).__tcfapi("addEventListener", 2, (tcData: any, success: boolean) => {
                if (success) {
                    this.consentNeeded = tcData.gdprApplies;
                    if (!this.consentNeeded) {
                        this.consentToCookies = true;
                        this.defferedPromise.resolve(true);
                    }
                    if (this.consentNeeded && (tcData.eventStatus === "tcloaded" || tcData.eventStatus === "useractioncomplete")) {
                        const oldValue = this.consentToCookies;
                        const userConsentedToCookies =
                            tcData.purpose.consents != undefined && tcData.purpose.consents[1] != undefined && tcData.purpose.consents[1];
                        this.consentToCookies = userConsentedToCookies;
                        if (oldValue != tcData.purpose.consents[1]) {
                            document.dispatchEvent(new CustomEvent("cookie-consent-changed", { detail: this.consentToCookies }));
                        }
                        this.defferedPromise.resolve(userConsentedToCookies);
                        // if (!this.consentToCookies) {
                        //     // TO DO
                        // }
                    }
                } else {
                    this.defferedPromise.reject(new Error("Failed adding event listener to TCF API"));
                }
            });
        }
    }
}
