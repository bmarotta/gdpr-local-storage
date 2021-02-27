export class GdprLocalStorageOptions {
    public usesTcfApi = true;
    public tcfApiTimeoutMs = 6000;

    public sanitize(): void {
        this.usesTcfApi = this.usesTcfApi == undefined ? true : this.usesTcfApi;
        this.tcfApiTimeoutMs = this.tcfApiTimeoutMs == undefined || !isNaN(this.tcfApiTimeoutMs) ? 6000 : this.tcfApiTimeoutMs;
    }
}
