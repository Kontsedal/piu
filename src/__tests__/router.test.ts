import { createRouter, routerContext } from "../router";
import { createServer } from "../server";
import request from "supertest";
import { context, respondJson } from "../context";

describe("router", () => {
  it("should support simple routes", async () => {
    const handler = jest.fn();

    const server = createServer();
    const router = createRouter();
    router.get("/api/user", handler);
    server.use(router.middleware());
    await request(server.httpServer).get("/api/user").send();

    expect(handler).toHaveBeenCalled();
  });
  it("should support parametric routes", async () => {
    const handler = jest.fn();

    const server = createServer();
    const router = createRouter();
    router.get("/api/user/:id/:age/status", handler);
    server.use(router.middleware());
    await request(server.httpServer).get("/api/user/234412/12/status").send();

    expect(handler).toHaveBeenCalled();
  });
  it("should not mix up simple and parametric routed", async () => {
    const handler = jest.fn();
    const otherHandler = jest.fn();

    const server = createServer();
    const router = createRouter();
    router.get("/api/user/info", handler);
    router.get("/api/user/:id/:age/status", handler);
    server.use(router.middleware());
    await request(server.httpServer).get("/api/user/info").send();

    expect(handler).toHaveBeenCalled();
    expect(otherHandler).not.toHaveBeenCalled();
  });
  it("should not allow same the simple routes", async () => {
    const router = createRouter();
    expect(() => {
      router.get("/api/user/info", () => {});
      router.get("/api/user/info", () => {});
    }).toThrow();
  });
  it("should not allow same the parametric routes", async () => {
    const router = createRouter();
    expect(() => {
      router.get("/api/user/:id/:status", () => {});
      router.get("/api/user/:status/:id", () => {});
    }).toThrow();
  });
  it("should respect a request method", async () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    const handler3 = jest.fn();
    const handler4 = jest.fn();

    const server = createServer();
    const router = createRouter();
    router.get("/api/user/info", handler1);
    router.post("/api/user/info", handler2);
    router.get("/api/user/:age/:id", handler3);
    router.post("/api/user/:age/:id", handler4);
    server.use(router.middleware());

    await request(server.httpServer).post("/api/user/info").send();
    await request(server.httpServer).post("/api/user/22/12222").send();

    expect(handler2).toHaveBeenCalled();
    expect(handler4).toHaveBeenCalled();
    expect(handler1).not.toHaveBeenCalled();
    expect(handler3).not.toHaveBeenCalled();
  });

  it("should allow to get dynamic request params", async () => {
    const server = createServer();
    const router = createRouter();
    router.get("/api/user/:id/:name/:age", () => {
      context.respondJson(routerContext.getRouteParams(), 200);
    });
    server.use(router.middleware());
    const response = await request(server.httpServer)
      .get("/api/user/666/bob/22")
      .send();
    expect(response.body).toMatchObject({
      id: "666",
      name: "bob",
      age: "22",
    });
  });
});
