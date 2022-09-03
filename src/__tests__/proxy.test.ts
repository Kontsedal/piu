import { createReadonlyProxy, createSuperProxy } from "../utils/proxy";

describe("proxy", () => {
  it("super proxy should track all sets and function calls", () => {
    const result = createSuperProxy();
    result.proxy.a.b.c = 1;
    result.proxy.z.f.d[99] = 12;
    result.proxy.z.ee.g(1, 2, 3);
    result.proxy.z.ee.g(3);
    result.proxy.z.ee[33].g(4, 2);
    expect(result.changes.sets).toMatchObject({
      "a.b.c": 1,
      "z.f.d.99": 12,
    });
    expect(result.changes.calls).toMatchObject({
      "z.ee.g": [[1, 2, 3], [3]],
      "z.ee.33.g": [[4, 2]],
    });
  });
  it("readonly proxy should allow to read and should store sets", () => {
    const obj = { test: 1 };
    const result = createReadonlyProxy(obj);
    result.proxy.test = 100;
    result.proxy.another = "sup";
    expect(obj.test).toBe(1);
    expect((obj as any).another).toBe(undefined);
    expect(result.changes.test).toBe(100);
    expect(result.changes.another).toBe("sup");
  });
});
