import "mocha";
import { assert } from "chai";
import Redis from "ioredis";
import Client from "../../src/app/client";
import Worker from "../../src/app/worker";

describe("node celery worker with redis broker", () => {
  const worker = new Worker(
    "redis://localhost:6379/0",
    "redis://localhost:6379/0"
  );

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
    const redis = new Redis();
    redis.flushdb().then(() => redis.quit());
  });

  describe("worker running", () => {
    it("tasks.add", async () => {
      const client = new Client(
        "redis://localhost:6379/0",
        "redis://localhost:6379/0"
      );
      const result = await client.sendTask("tasks.add", [1, 2]);
      const data = await result.get();
      assert.equal(data, 3);

      await client.disconnect();
    });

    it("tasks.add_kwargs", async () => {
      const client = new Client(
        "redis://localhost:6379/0",
        "redis://localhost:6379/0"
      );
      const result = await client.sendTask("tasks.add_kwargs", [], { a: 1, b: 2 });

      const data  = await result.get()
      assert.equal(data, 3);

      await client.disconnect();
    });

    it("tasks.add_mixed", async () => {
      const client = new Client(
        "redis://localhost:6379/0",
        "redis://localhost:6379/0"
      );
      const result = await client.sendTask("tasks.add_mixed", [3, 4], { c: 1, d: 2 });

      const data = await result.get()
      assert.equal(data, 10);

      await client.disconnect();
    });
  });
});

describe("node celery worker with redis broker", () => {
  const worker = new Worker(
    "redis://localhost:6379/0",
    "redis://localhost:6379/0"
  );

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

  describe("worker running with amqp broker", () => {
    it("tasks.add amqp", async () => {
      const client = new Client(
        "redis://localhost:6379/0",
        "redis://localhost:6379/0"
      );
      const result = await client.sendTask("tasks.add", [1, 2]);
      const data = await result.get();
      assert.equal(data, 3);

      await client.disconnect();
    });

    it("tasks.add_kwargs amqp", async () => {
      const client = new Client(
        "redis://localhost:6379/0",
        "redis://localhost:6379/0"
      );
      const result = await client.sendTask("tasks.add_kwargs", [], { a: 1, b: 2 });

      const data = await result.get();
      assert.equal(data, 3);

      await client.disconnect();
    });

    it("tasks.add_mixed amqp", async() => {
      const client = new Client(
        "redis://localhost:6379/0",
        "redis://localhost:6379/0"
      );
      const result = await client.sendTask("tasks.add_mixed", [3, 4], { c: 1, d: 2 });

      const data = await result.get();
      assert.equal(data, 10);

      await client.disconnect();
    });
  });
});
