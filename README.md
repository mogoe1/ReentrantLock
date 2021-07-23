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
const worker = new Worker("worker.js", {type: "module"});

worker.postMessage(lock.buffer);

lock.lockAsync().then(_=>{
    // exclusive access to resource

	lock.unlock();
});
```

```js
// file: worker.js
import { ReentrantLock } from "@mogoe1/reentrant-lock";

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
```

## Docs
Docs are availabe at https://mogoe1.github.io/reentrant-lock.