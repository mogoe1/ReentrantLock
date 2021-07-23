// file: main.js
import { ReentrantLock } from "../lib/ReentrantLock.js";

const lock = ReentrantLock.create();
const worker = new Worker("./example/worker.js", { type: "module" });

worker.postMessage(lock.buffer);

lock.lockAsync().then(_ => {
    // exclusive access to resource
    console.log("locked!");
    lock.unlock();
    console.log("unlocked");
});
