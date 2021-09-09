// file: worker.js
import { ReentrantLock } from "../lib/ReentrantLock.js";

self.addEventListener("message", message => {
    const buffer = message.data;
    const lock = new ReentrantLock(new Int32Array(buffer));

    lock.lock(); // this blocks the worker thread untill the main thread unlocks it's ReentrantLock instance!
    const newlyLocked = lock.lock(); // lock can be called multiple times without blocking more than once
    console.log(newlyLocked); // false, because this instance was locked prior to the previous line

    // exclusive access to resource

    let stillOwned = lock.unlock();
    console.log(stillOwned); // true, because lock was called twice without unlock
    stillOwned = lock.unlock();
    console.log(stillOwned); // false, because unlock was called as often as lock
});
