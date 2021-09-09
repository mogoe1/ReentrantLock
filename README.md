# ReentrantLock
A lock designed for multi-threaded browser environments.

## Installing
<strike> `npm install @mogoe1/reentrant-lock` </strike> (we are not on npm yet)

	npm install --save git+https://github.com/mogoe1/reentrant-lock.git

## Notes
* The implementation relies on SharedArrayBuffers. Make sure your site meets the [security requirements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements).
* The implementation relies on Atomics.waitAsync which is implemented by [v8](https://v8.dev/features/atomics) but not documented at mdn yet. You might want to proivide a [polyfill](https://github.com/tc39/proposal-atomics-wait-async/blob/master/polyfill.js).

## Quickstart
The following example shows how a reentrant-lock can be used to make sure only one thrad at a time has access to a shared ressource.

```js
// file: main.js
import { ReentrantLock } from "@mogoe1/reentrant-lock";

const lock = ReentrantLock.create();
const worker = new Worker("worker.js", { type: "module" });

lock.lockAsync().then(_ => {
    worker.postMessage(lock.buffer);

    // exclusive access to resource
    console.log("locked!");
    lock.unlock();
    console.log("unlocked");
});
```

```js
// file: worker.js
import { ReentrantLock } from "@mogoe1/reentrant-lock";

self.addEventListener("message", message => {
    const buffer = message.data;
    const lock = new ReentrantLock(new Int32Array(buffer));

    let newlyLocked = lock.lock(); // this blocks the worker thread untill the main thread unlocks it's ReentrantLock instance!
    console.log(newlyLocked); // true
    newlyLocked =  lock.lock(); // lock can be called multiple times without blocking more than once
    console.log(newlyLocked); // false

    // exclusive access to resource here

    let stillOwned = lock.unlock();
    console.log(stillOwned); // true, because lock was called twice without unlock
    stillOwned = lock.unlock();
    console.log(stillOwned); // false, because unlock was called as often as lock
});
```

## API
The API is documented at https://mogoe1.github.io/reentrant-lock/classes/ReentrantLock.html.