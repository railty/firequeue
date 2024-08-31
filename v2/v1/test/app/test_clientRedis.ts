import { assert } from "chai";
import Redis from "ioredis";
import * as sinon from "sinon";
import Client from "../../src/app/client";
import Worker from "../../src/app/worker";
import { AsyncResult } from "../../src/app/result";
import { CeleryConf } from "../../src/app/conf";

describe("celery functional tests", () => {
  const client = new Client(
    "redis://localhost:6379/0",
    "redis://localhost:6379/0"
  );
  const worker = new Worker(
    "redis://localhost:6379/0",
    "redis://localhost:6379/0"
  );

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

    const redis = new Redis();
    redis.flushdb().then(() => redis.quit());
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

  describe("result handling with redis backend", () => {
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

    describe("when the the result has previously resolved", () => {
      it("should immediately resolve when the task was previously resolved", done => {
        const getTaskMetaSpy = sinon.spy(client.backend, 'getTaskMeta');

        const result = client.createTask("tasks.add").applyAsync([1, 2]);

        result
          .get()
          .then(() => {
            // await the result a second time
            return result.get();
          })
          .then(() => {
            // the backend should not have been invoked more than once
            assert.strictEqual(getTaskMetaSpy.callCount, 1);
          })
          .then(done)
          .catch(done);
      });
    });
  });

  describe("timeout handing with the redis backend", () => {
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
