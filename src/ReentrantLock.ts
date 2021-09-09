import { Semaphore } from "@mogoe1/semaphore";

/**
 * A ReentrantLock can be used to synchronize async code and/or threads (WebWorkers). Multiple ReentrantLock instances can be grouped, and only one instance at a time can be locked.
 * 
 * An instance can be locked by calling {@link ReentrantLock.lock lock()} on the instance. The call blocks until no other instance inside the group is locked and increments {@link ReentrantLock.holdCount holdCount} by one. After the call returns, the instance is guaranteed to be the only one inside the group that is locked. Since {@link ReentrantLock.lock lock()} is a blocking operation, it is not available on the main thread. See {@link ReentrantLock.lockAsync lockAsync()} for an alternative.
 * 
 * To unlock an instance, {@link ReentrantLock.unlock unlock()} can be called on the instance. The invocation decrements {@link ReentrantLock.holdCount holdCount} of the instance by one if {@link ReentrantLock.holdCount holdCount} is greater than 0. The instance is unlocked if {@link ReentrantLock.holdCount holdCount} reaches zero during the invocation.
 * 
 * Multiple ReentrantLock instances can be grouped by providing TypedArray instances based on the same SharedArrayBuffer instance to the ReentrantLock constructor on creation.
 * 
 * This implementation is based on [@mogoe1/semaphore](https://github.com/mogoe1/semaphore) and uses SharedArrayBuffers and Atomics for synchronization.
 */
export class ReentrantLock {
    /**
     * The underlying [@mogoe1/semaphore](https://github.com/mogoe1/semaphore) used by this lock.
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
     * SharedArrayBuffer used by this ReentrantLocks group.
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
     * Create a new ReentrantLock instance. The given Int32Array should be based on a SharedArrayBuffer. Multiple ReentrantLock instances initialized with the same SharedArrayBuffer are grouped.
     * @param i32Array A TypedArray used to store whether or not any instance inside a group of ReentrantLock instances owns the lock. It has to have a length of one, and it has to be based on a SharedArrayBuffer.
     */
    public constructor(i32Array: Int32Array) {
        this._semaphore = new Semaphore(i32Array);
        this._holdCount = 0;
    }

    /**
     * Locks this ReentrantLock instance and increments {@link ReentrantLock.holdCount holdCount} by one. Blocks until this instance is locked and no other instance inside the group is locked.
     * 
     * If Atomics.wait is not availabe (eg. on the main thread) use {@link ReentrantLock.lockAsync lockAsync()} instead.
     * @returns False if this instance was already locked prior to the function call. True otherwise.
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
     * Locks this ReentrantLock instance and increments {@link ReentrantLock.holdCount holdCount} by one. Immediately returns a promise that resolves once this instance is locked and no other instance inside the group is locked.
     * @returns A promise that resolves to false if the instance was already locked prior to the function call. Otherwise it resolves to true.
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
     * Decrements {@link ReentrantLock.holdCount holdCount} by one. Once {@link ReentrantLock.holdCount holdCount} reaches zero it unlocks this instance.
     * @returns True if tis instances is still locked ({@link ReentrantLock.holdCount holdCount} > 0). False otherwise. 
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
