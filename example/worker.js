// file: worker.js
import { ReentrantLock } from "../lib/ReentrantLock.js";

self.addEventListener("message", message => {
    const buffer = message.data;
    const lock = new ReentrantLock(new Int32Array(buffer));

    lock.lock(); // this blocks the worker thread untill the lock is owned!
    const newlyLocked = lock.lock(); // lock can be called multiple times without blocking on one instance if the lock is owned.

    // exclusive access to resource

    let stillOwned = lock.unlock();
    console.log(stillOwned); // true, because lock was called twice without unlock
    stillOwned = lock.unlock();
    console.log(stillOwned); // false, because unlock was called as often as lock
});
