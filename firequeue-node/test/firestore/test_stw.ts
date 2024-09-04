import "mocha";
import { assert } from "chai";
import { AsyncResult } from "../../src/app/result";
import { getClient, getWorker, getSTWorker } from "../testlib";

console.log("file test_stw");

describe("celery functional tests", function() {
  const client = getClient();
  const worker = getSTWorker();

  before(() => {
    worker.register("tasks.delayed", (result, delay) =>
        new Promise(resolve => {
          setTimeout(() => resolve(result), delay);
        })
    );
    worker.start();
  });

  afterEach(async () => {
    console.log("after each");
  });

  after(async () => {
    console.log("after");
    await client.disconnect();
    await worker.disconnect();
  });

  describe("timeout handing with the firestore backend", () => {
    it("should reject with a TIMEOUT error", async () => {
      const t0 = (new Date).getTime();
      const result1 = await client.createTask("tasks.delayed").applyAsync(["1", 5000]);
      const result2 = await client.createTask("tasks.delayed").applyAsync(["2", 5000]);
      const result3 = await client.createTask("tasks.delayed").applyAsync(["3", 5000]);
      const result4 = await client.createTask("tasks.delayed").applyAsync(["4", 5000]);
      const t1 = (new Date).getTime();
      console.log("t10 = ", t1 - t0);
      try{
        const r1 = await result1.get();
        const r2 = await result2.get();
        const r3 = await result3.get();
        const r4 = await result4.get();

        const t2 = (new Date).getTime();
        console.log("t21 = ", t2 - t1);
      }
      catch(ex){
        const t3 = (new Date).getTime();
        console.log("t31 = ", t3 - t1);
        assert.strictEqual(ex.message, "TIMEOUT");
      }
      await result1.get();
    });
  });

});
