Experimental nodejs library with next goals:
- never mutate request object or context object as express and koa does
- avoid middlewares and preform most operations such as body parsing only when it's needed

### How it's achieved:
We create a "context" object for each request, keys of this object are unique symbols so they can't be overwritten. 
We store there request object, response body, response headers response status etc. We don't store response object there, so it can be accessed only by the library itself.

Each request gets wrapped into [AsyncLocalStorage](https://nodejs.org/api/async_context.html#asynclocalstoragerunstore-callback-args) and we can get/set data fields of the context object from any part of our code.
It allows to create isolated libraries with no conflicts and overheads.

Library router uses this approach by storing route parameters in the context:
```typescript
import { createServer, context, router } from '@kontsedal/piu';

const app = createServer();
const routes = router.createRouter();

routes.patch('/api/user/:id', async () => {
  const body = await context.requestBody.json();
  const { id } = router.getRouteParams();
  
  context.respondJson({body, id}, 200)
});

app.use(routes.middleware());
app.httpServer.listen(80)
```

