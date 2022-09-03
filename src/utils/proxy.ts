function createNestedProxy({
  paths,
  setCb,
  callCb,
}: {
  paths?: string[];
  setCb: (params: { paths: string[]; value: any }) => unknown;
  callCb: (params: { paths: string[]; args: any[] }) => unknown;
}): any {
  return new Proxy(() => {}, {
    get(target, path) {
      let localPaths = paths || [];
      localPaths.push(path as string);
      return createNestedProxy({ paths: localPaths, setCb, callCb });
    },
    set(target, path, value) {
      setCb({ paths: [...(paths || []), path as string], value });
      return true;
    },
    apply(target, thisArg, argArray) {
      callCb({ paths: paths as string[], args: argArray });
    },
  });
}
export type SuperProxyResult = {
  calls: Record<string, any[]>;
  sets: Record<string, any>;
};
export function createSuperProxy() {
  const result: SuperProxyResult = {
    calls: {},
    sets: {},
  };
  const proxy = createNestedProxy({
    setCb: ({ paths, value }) => {
      const key = paths.join(".");
      result.sets[key] = value;
    },
    callCb: ({ paths, args }) => {
      const key = paths.join(".");
      if (!result.calls[key]) {
        result.calls[key] = [];
      }
      result.calls[key].push(args);
    },
  });
  return {
    proxy,
    changes: result,
  };
}

export function createReadonlyProxy<T extends object>(target: T) {
  const result: Record<string, any> = {};
  const proxy = new Proxy(target, {
    set(target: T, p: string, newValue: any, receiver: any): boolean {
      result[p] = newValue;
      return true;
    },
    get(target: any, p: string, receiver: any): any {
      if (p in result) {
        return result[p];
      }
      if (p in target) {
        return target[p];
      }
    },
  });
  return {
    proxy,
    changes: result,
  };
}
