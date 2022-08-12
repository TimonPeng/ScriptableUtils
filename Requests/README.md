# Scriptable Utils

Utility libraries for Scriptable.

## Requests

### Basic usage

```javascript
const Requests = importModule("Requests");

const requests = new Requests("https://api.github.com");

// get json
await requests.get("/user/TimonPeng", { loadMethod: "loadJSON" });

// get image
await requests.get("/captcha", { loadMethod: "loadImage" });

// ...
```

### Cookies keeping

You need to use [cache.js](https://github.com/evandcoleman/scriptable/blob/main/src/lib/cache.js) or something to save the cookies to somewhere.

```javascript
const Requests = importModule("Requests");
const Cache = importModule("Cache");

const cookiesCache = new Cache("Cookies");

class RequestsWithCookies extends Requests {
  toCookiesString(cookies) {
    const array = [];

    for (const [key, value] of Object.entries(cookies)) {
      array.push(`${key}=${value}`);
    }

    return array.join("; ");
  }

  async beforeRequest(request) {
    const host = request.url.split("/")[2];
    const cookies = (await cookiesCache.read(host)) || {};

    request.headers = {
      ...{ Cookie: this.toCookiesString(cookies) },
      ...request.headers,
    };
  }

  async afterRequest(request, response) {
    // console.log(
    //   `${request.url} -> data: ${JSON.stringify(
    //     response
    //   )} response: ${JSON.stringify(request.response)}`
    // );

    const cookies = {};

    for (const cookie of request.response.cookies || []) {
      const { domain, name, value } = cookie;
      cookies[name] = value;
      cookiesCache.write(domain, cookies);
    }
  }
}
```
