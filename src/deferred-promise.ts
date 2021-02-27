export class DeferredPromise<T> {
    private _resolve: ((value: T) => void) | null = null;
    private _reject: ((reason?: Error) => void) | null = null;

    private _promise: Promise<T> = new Promise<T>((resolve, reject) => {
        this._reject = reject;
        this._resolve = resolve;
    });

    public get promise(): Promise<T> {
        return this._promise;
    }

    public resolve(value: T): void {
        if (this._resolve) {
            this._resolve(value);
        }        
    }

    public reject(reason?: Error): void {
        if (this._reject) {
            this._reject(reason);
        }        
    }
}
