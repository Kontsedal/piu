import { context } from "./context";

export enum HTTP_METHOD {
  POST = "POST",
  GET = "GET",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
  OPTIONS = "OPTIONS",
  HEAD = "HEAD",
  TRACE = "TRACE",
}
type Handler = () => unknown;
const dynamicParamKey = Symbol("dynamicParam");
type RouteNode = {
  isParam?: boolean;
  name?: string;
  handler?: Handler;
  children: Record<string | symbol, RouteNode>;
};

const [getRouteParams, setRouteParams] = context.createContextGetterSetter<
  Record<string, string>
>(Symbol("route-params"));
export const routerContext = { getRouteParams, setRouteParams };

export const createRouter = () => {
  const routes: {
    simple: Record<string | symbol, Handler>;
    complex: Record<string, RouteNode>;
  } = {
    simple: {},
    complex: {},
  };

  const handle = (method: HTTP_METHOD, url: string, handler: Handler) => {
    const normalizedUrl = normalizeUrl(url);
    const simpleRouteKey = getSimpleRouteKey(method, normalizedUrl);
    const isSimpleRoute = !normalizedUrl.includes(":");
    if (isSimpleRoute) {
      if (routes.simple[simpleRouteKey]) {
        throw new Error("Provided route already exists");
      }
      routes.simple[simpleRouteKey] = handler;
      return;
    }
    const routeArray = normalizedUrl.split("/");
    let previousNode: RouteNode;
    routeArray.forEach((key, index) => {
      const isParam = key.includes(":");
      const routeKey = isParam ? dynamicParamKey : key;
      const node: RouteNode = { isParam, name: key, children: {} };
      const isLastPart = index === routeArray.length - 1;
      if (isLastPart) {
        node.handler = handler;
      }
      if (!previousNode) {
        if (!routes.complex[method]) {
          routes.complex[method] = { children: {} };
        }
        if (routes.complex[method].children[routeKey]) {
          if (isLastPart && routes.complex[method].children[routeKey].handler) {
            throw new Error("Handler for the route is already defined");
          }
          previousNode = routes.complex[method].children[routeKey];
          return;
        }
        routes.complex[method].children[routeKey] = node;
      } else {
        if (previousNode && previousNode.children[routeKey]) {
          if (isLastPart && previousNode.children[routeKey].handler) {
            throw new Error("Handler for the route is already defined");
          }
          previousNode = previousNode.children[routeKey];
          return;
        }
        previousNode.children[routeKey] = node;
      }
      previousNode = node;
    });
  };

  const router = {
    routes,
    middleware: () => convertRouterToHandler(router),
    handle,
    get: (url: string, handler: Handler) =>
      handle(HTTP_METHOD.GET, url, handler),
    post: (url: string, handler: Handler) =>
      handle(HTTP_METHOD.POST, url, handler),
    put: (url: string, handler: Handler) =>
      handle(HTTP_METHOD.PUT, url, handler),
    patch: (url: string, handler: Handler) =>
      handle(HTTP_METHOD.PATCH, url, handler),
    delete: (url: string, handler: Handler) =>
      handle(HTTP_METHOD.DELETE, url, handler),
  };
  return router;
};

function convertRouterToHandler(router: ReturnType<typeof createRouter>) {
  return (next: () => unknown) => {
    const { method, url } = context.getRequestObject();
    if (!method) {
      return next();
    }
    const normalizedUrl = normalizeUrl(url || "");
    const simpleRouteHandler =
      router.routes.simple[getSimpleRouteKey(method, normalizedUrl)];
    if (typeof simpleRouteHandler === "function") {
      return simpleRouteHandler();
    }
    const routeArray = normalizedUrl.split("/");
    try {
      let handler;
      let prevNode = router.routes.complex[method];
      const params: Record<string, string> = {};
      routeArray.forEach((key, index) => {
        if (!prevNode) {
          throw new Error();
        }
        if (index === routeArray.length - 1) {
          handler = (
            prevNode.children[key] || prevNode.children[dynamicParamKey]
          )?.handler;
        }
        const currentNode =
          prevNode.children[key] || prevNode.children[dynamicParamKey];
        if (currentNode && currentNode.isParam && currentNode.name) {
          params[currentNode.name.replace(":", "")] = key;
        }
        prevNode = currentNode;
      });
      routerContext.setRouteParams(params);
      if (typeof handler === "function") {
        // @ts-ignore
        return handler();
      }
      return next();
    } catch (error) {
      return next();
    }
  };
}

function getSimpleRouteKey(method: string, url: string) {
  return `[${method}]${url}`;
}
function normalizeUrl(url: string) {
  return url.replace(/^\//, "").replace(/\/$/, "");
}
