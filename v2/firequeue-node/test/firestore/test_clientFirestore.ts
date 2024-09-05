import "mocha";
import { assert } from "chai";
import * as sinon from "sinon";
import { AsyncResult } from "../../src/app/result";
import { getClient, getWorker } from "../testlib";

console.log("file test_clientFirestore");

describe("celery functional tests", function() {
  const client = getClient();
  const worker = getWorker();

  before(() => {
    console.log("---------------------------------- test_clientFirestore started");
    worker.register("tasks.add", (a, b) => a + b);
    worker.register(
      "tasks.delayed",
      (result, delay) =>
        new Promise(resolve => {
          setTimeout(() => resolve(result), delay);
        })
    );
    worker.start();
  });

  afterEach(async () => {
    sinon.restore();
    await worker.whenCurrentJobsFinished();
  });

  after(async () => {
    await client.disconnect();
    await worker.disconnect();
    console.log("---------------------------------- test_clientFirestore finished");
  });

  describe("initialization", () => {
    it("should create a valid redis client without error", done => {
      client.isReady().then(() => done());
    });
  });

  describe("Basic task calls", () => {
    it("should call a task without error", async () => {
      const result = await client.createTask("tasks.add").delay([1, 0]);
      const sum = await result.get();
      console.log("sum=", sum);
    });
  });

  describe("result handling with firestore backend", () => {
    it("should return a task result", async () => {
      const result = await client.createTask("tasks.add").applyAsync([1, 1]);
      assert.instanceOf(result, AsyncResult);
      const sum = await result.get();
      console.log("sum=", sum);
    });

    it("should resolve with the message", async () => {
      const result = await client.createTask("tasks.add").applyAsync([1, 2]);
      assert.instanceOf(result, AsyncResult);

      const message = await result.get();
      assert.equal(message, 3);
    });

    describe("when the the result has previously resolved", () => {
      it("should immediately resolve when the task was previously resolved", async () => {
        const getTaskMetaSpy = sinon.spy(client.backend, 'getTaskMeta');

        const result = await client.createTask("tasks.add").applyAsync([2, 2]);
        //get has a timeout optional parameter and an interval parameter, it will try every interval until timeout. default interval is 500 ms
        await result.get();
        const ct1 = getTaskMetaSpy.callCount;
        //ct1 could be 1, 3, or 10, depend how slow the worker is, and what the interval and timeout is, meaning before the timeour or the gettaskmeta success, how many times it call the gettaskmeta
        await result.get(); //should use cache instead of call getTaskMeta
        const ct2 = getTaskMetaSpy.callCount;
        assert.strictEqual(ct1, ct2);
      });
    });
  });

  describe("timeout handing with the firestore backend", () => {
    it("should reject with a TIMEOUT error", async () => {
      const result = await client.createTask("tasks.delayed").applyAsync(["5", 1000]);
      try{
        const x = await result.get(500);
      }
      catch(ex){
        assert.strictEqual(ex.message, "TIMEOUT");
      }
      await result.get();
    });
  });

  describe("List tasks", () => {
    it("should list all the pending tasks", async() => {
      const result = await client.createTask("tasks.add").delay([1, 5]);
      const result2 = await client.createTask("tasks.add").delay([1, 6]);
      const ts = await client.listTasks();
      const tasks = ts.map((t)=>JSON.parse(t));
      console.log("tasks = ", tasks.length);

      assert.strictEqual(tasks.length, 2);
      await client.deleteTasks([ts[0], ts[1]]);

      const ts2 = await client.listTasks();
      const tasks2 = ts2.map((t)=>JSON.parse(t));
      assert.strictEqual(tasks2.length, 0);
      console.log("tasks = ", tasks2.length);
    });
  });

  describe("List results", () => {
    it("should list all the completed results", async() => {
      const results = await client.listResults();
      console.log(results.length);

      const toBeDeleted = [results[1].id];
      console.log(toBeDeleted);

      await client.deleteResults(toBeDeleted);

      const results2 = await client.listResults();
      console.log(results2.length);

    });
  });

});
