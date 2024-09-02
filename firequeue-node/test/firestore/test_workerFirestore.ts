import "mocha";
import { assert } from "chai";
import { createClient, createWorker } from "../../src/index";
import { getClient, getWorker } from "../testlib";

console.log("file test_workertFirestore");

describe("node celery worker with firestore broker", async function(){
  this.timeout(30000);

  const client = getClient();
  const worker = getWorker();

  before(async () => {
    console.log("---------------------------------- test_workerFirestore started");

    worker.register("tasks.add", (a, b) => a + b);
    worker.register("tasks.add_kwargs", ({ a, b }) => a + b);
    worker.register("tasks.add_mixed", (a, b, { c, d }) => a + b + c + d);
    worker.start();
  });

  afterEach(async () => {
    await worker.whenCurrentJobsFinished();
  });

  after(async () => {
    await client.disconnect();
    await worker.disconnect();
    console.log("---------------------------------- test_workerFirestore finished");
  });

  describe("worker running", function(){
    this.timeout(10000);
    it("tasks.add", async () => {
      
      const result = await client.sendTask("tasks.add", [1, 2]);
      const data = await result.get();
      assert.equal(data, 3);
      await client.disconnect()
    });

    it("tasks.add_kwargs", async () => {
      const result = await client.sendTask("tasks.add_kwargs", [], { a: 1, b: 2 });
      const data = await result.get();
      assert.equal(data, 3);
      await client.disconnect();
    });

    it("tasks.add_mixed", async () => {
      const result = await client.sendTask("tasks.add_mixed", [3, 4], { c: 1, d: 2 });

      const data = await result.get()
      assert.equal(data, 10);

      await client.disconnect();
    });
  });
});

describe("node celery worker with firestore broker", function(){
  this.timeout(20000);
  const client = getClient();
  const worker = getWorker();

  before(() => {
    worker.register("tasks.add", (a, b) => a + b);
    worker.register("tasks.add_kwargs", ({ a, b }) => a + b);
    worker.register("tasks.add_mixed", (a, b, { c, d }) => a + b + c + d);
    worker.start();
  });

  afterEach(() => {
    return worker.whenCurrentJobsFinished();
  });

  after(() => {
    worker.disconnect();
  });

  describe("worker running with firestore broker", () => {
    this.timeout(10000);
    it("tasks.add amqp", async () => {
      const result = await client.sendTask("tasks.add", [1, 2]);

      const data = await result.get()
      assert.equal(data, 3);

      await client.disconnect();
    });

    it("tasks.add_kwargs amqp", async () => {
      const result = await client.sendTask("tasks.add_kwargs", [], { a: 1, b: 2 });

      const data = await result.get()
      assert.equal(data, 3);

      await client.disconnect();
    });

    it("tasks.add_mixed amqp", async () => {
      const result = await client.sendTask("tasks.add_mixed", [3, 4], { c: 1, d: 2 });

      const data = await result.get()
      assert.equal(data, 10);

      await client.disconnect();
    });
  });

});
