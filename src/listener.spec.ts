import { createListener } from "./listener";
import request from "supertest";
import { respondJson } from "./context";

describe("listener", () => {
  it("should respond 404 with no middlewares", async () => {
    const listener = createListener();
    const response = await request(listener.httpServer).get("/").send();
    expect(response.statusCode).toBe(404);
    expect(response.body).toMatchObject({ message: "Not found" });
  });

  it("should respond with a middleware answer", async () => {
    const responseObj = { test: 1 };
    const listener = createListener();
    listener.use(() => {
      respondJson(responseObj, 201);
    });
    const response = await request(listener.httpServer).get("/").send();
    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject(responseObj);
  });

  it("should respond with 500 on error", async () => {
    let error = "Ooopsie";
    const listener = createListener();
    listener.use(() => {
      throw new Error(error);
    });
    const response = await request(listener.httpServer).get("/").send();
    expect(response.statusCode).toBe(500);
    expect(response.body).toMatchObject({ message: error });
  });

  it("should respect a custom error handler", async () => {
    const customError = { error: "Custom error" };
    const listener = createListener({
      onError: (error) => {
        respondJson({ error: "Custom error" }, 501);
      },
    });
    listener.use(() => {
      throw new Error("???why");
    });
    const response = await request(listener.httpServer).get("/").send();
    expect(response.statusCode).toBe(501);
    expect(response.body).toMatchObject(customError);
  });
});
