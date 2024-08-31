import { assert } from "chai";
import Redis from "ioredis";
import * as sinon from "sinon";
import Client from "../../src/app/client";
import Worker from "../../src/app/worker";
import { AsyncResult } from "../../src/app/result";
import { CeleryConf } from "../../src/app/conf";
import serviceAccount from "../firequeue.sa";

describe("celery functional tests", function() {
  const client = new Client("firestore://", "firestore://");
  (client.conf.CELERY_BACKEND_OPTIONS as any).sa = serviceAccount;
  (client.conf.CELERY_BROKER_OPTIONS as any).sa = serviceAccount;
  const worker = new Worker("firestore://", "firestore://");
  (worker.conf.CELERY_BACKEND_OPTIONS as any).sa = serviceAccount;
  (worker.conf.CELERY_BROKER_OPTIONS as any).sa = serviceAccount;

  before(() => {
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

  afterEach(() => {
    sinon.restore();
    return worker.whenCurrentJobsFinished();
  });

  after(() => {
    Promise.all([client.disconnect(), worker.disconnect()]);
  });

  describe("initialization", () => {
    it("should create a valid redis client without error", done => {
      client.isReady().then(() => done());
    });
  });

  describe("Basic task calls", () => {
    it("should call a task without error", done => {
      client.createTask("tasks.add").delay([1, 2]);
      done();
    });
  });

  describe("result handling with firestore backend", () => {
    it("should return a task result", done => {
      const result = client.createTask("tasks.add").applyAsync([1, 2]);

      assert.instanceOf(result, AsyncResult);

      result.get().then(() => done());
    });

    it("should resolve with the message", done => {
      const result = client.createTask("tasks.add").applyAsync([1, 2]);

      assert.instanceOf(result, AsyncResult);

      result.get().then(message => {
        assert.equal(message, 3);
        done();
      });
    });

    describe("when the the result has previously resolved", async () => {
      it("should immediately resolve when the task was previously resolved", async () => {
        const getTaskMetaSpy = sinon.spy(client.backend, 'getTaskMeta');

        const result = client.createTask("tasks.add").applyAsync([1, 2]);
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
    it("should reject with a TIMEOUT error", done => {
      const result = client
        .createTask("tasks.delayed")
        .applyAsync(["foo", 1000]);

      result
        .get(500)
        .then(() => {
          assert.fail("should not get here");
        })
        .catch(error => {
          assert.strictEqual(error.message, "TIMEOUT");
          done();
        })
    });
  });

  describe("List tasks", async () => {
    it("should list all the pending tasks", async() => {
      client.createTask("tasks.add").delay([1, 2]);
      const ts = await client.listTasks();
      const tasks = ts.map((t)=>JSON.parse(t));
      console.log("tasks = ", tasks.length);

      if (tasks.length > 4){
        await client.deleteTasks([ts[1], ts[2], ts[3]]);
      }

      const ts2 = await client.listTasks();
      const tasks2 = ts2.map((t)=>JSON.parse(t));
      console.log("tasks = ", tasks2.length);
    });
  });

  describe("List results", async () => {
    it("should list all the completed results", async() => {
      const results = await client.listResults();
      console.log(results.length);

      const toBeDeleted = [results[1].id, results[3].id, results[5].id];
      console.log(toBeDeleted);

      await client.deleteResults(toBeDeleted);

      const results2 = await client.listResults();
      console.log(results2.length);

    });
  });

});
