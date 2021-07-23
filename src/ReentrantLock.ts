import { Semaphore } from "@mogoe1/semaphore";

/**
 * A ReentrantLock can be used to gain exclusive access to a shared ressource among multiple threads.
 * Multiple ReentrantLock instances can be based on the same SharedArray and are called a lock-group.
 * 
 * Once {@link ReentrantLock.lock lock()} on an instance inside a lock-group has been called,
 * that instance owns the lock untill {@link ReentrantLock.unlock unlock()} gets called on the same instance.
 * Calls to {@link ReentrantLock.lock lock()} block untill the lock is no longer owned by any other instance inside the lock-group.
 * 
 * Calls to {@link ReentrantLock.lock lock()} do not block if the instance already owns the lock. Instead they increase the {@link ReentrantLock.holdCount holdCount} by one.
 * Each call to {@link ReentrantLock.unlock unlock()} on an instance decrements the {@link ReentrantLock.holdCount holdCount} of that instance by one.
 * If the {@link ReentrantLock.holdCount holdCount} reaches zero, the lock gets releasead and is no longer owned by the instance.
 */
export class ReentrantLock {
    /**
     * The underlying semaphore used by this lock.
     */
    private _semaphore: Semaphore;

    /**
     * How often {@link ReentrantLock.lock lock()} has been called without a later call to {@link ReentrantLock.unlock unlock()}.
     */
    private _holdCount: number;

    /**
     * How often {@link ReentrantLock.lock lock()} has been called without a later call to {@link ReentrantLock.unlock unlock()}.
     */
    public get holdCount(): number {
        return this._holdCount;
    }

    /**
     * SharedArrayBuffer used by this lock.
     */
    public get buffer(): SharedArrayBuffer {
        return this._semaphore.buffer;
    }

    /**
    * Whether or not the instance owns the lock.
    */
    public get isLocked(): boolean {
        return this._semaphore.acquiredPermits > 0;
    }

    /**
     * Create a new ReentrantLock instance. The given Int32Array should be based on a SharedArrayBuffer. Multiple ReentrantLock instances initialized with the same SharedArrayBuffer are inside the same lock-group.
     * @param i32Array A typed array used to store whether or not the lock is currently owned by an instance inside the lock-group. It has to have length of one and it has to be based on a SharedArrayBuffer.
     */
    private constructor(i32Array: Int32Array) {
        this._semaphore = new Semaphore(i32Array);
        this._holdCount = 0;
    }

    /**
     * Take ownership of the lock and increments {@link ReentrantLock.holdCount holdCount} by one. Blocks untill the lock is no longer owned by another instance and then takes ownership.
     * 
     * If Atomics.wait is not availabe (eg. on the main thread) use {@link ReentrantLock.lockAsync lockAsync()} instead.
     * @returns False if the lock was already owned by this instance prior to the function call. True otherwise.
     */
    public lock(): boolean {
        if (this.isLocked) {
            this._holdCount++;
            return false;
        }
        this._semaphore.acquire();
        this._holdCount++;
        return true;
    }

    /**
     * Take ownership of the lock and increments {@link ReentrantLock.holdCount holdCount} by one. Immediately returns a promise that resolves once the lock is no longer owned by another and ownership was successfully claimed by this instance.
     * @returns A promise that resolves to false if the lock was already owned by this instance prior to the function call. Otherwise it resolves to true.
     */
    public async lockAsync(): Promise<boolean> {
        if (this.isLocked) {
            this._holdCount++;
            return false;
        }
        await this._semaphore.acquireAsync();
        this._holdCount++;
        return true;
    }

    /**
     * Dncrements {@link ReentrantLock.holdCount holdCount} by one. Once {@link ReentrantLock.holdCount holdCount} reaches zero the lock is no longer owned by this instance.
     * @returns True if the lock is still owned by this instance ({@link ReentrantLock.holdCount holdCount} > 0). False otherwise. 
     */
    public unlock(): boolean {
        if (!this.isLocked) {
            return false;
        }

        this._holdCount--;
        if (this._holdCount === 0) {
            this._semaphore.release();
            return false;
        } else {
            return true;
        }
    }

    /**
     * Creates a new SharedArrayBuffer and a new ReentrantLock instance based on the created buffer.
     * @returns The new ReentrantLock instance.
     */
    public static create(): ReentrantLock {
        const sab = new SharedArrayBuffer(4);
        const i32 = new Int32Array(sab);
        i32[0] = 1;
        return new ReentrantLock(i32);
    }
}
