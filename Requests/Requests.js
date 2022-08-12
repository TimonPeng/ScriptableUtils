// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: laptop-code;
// NOTE: This script was written by TimonPeng: https://github.com/TimonPeng/ScriptableUtils

class Requests {
  constructor(baseUrl, defaultHeaders = {}) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = defaultHeaders;
  }

  get(path, options = {}) {
    return this.request("GET", path, options);
  }

  post(path, options = {}) {
    return this.request("POST", path, options);
  }

  async request(
    method,
    path,
    {
      headers = {},
      body = null,
      timeoutInterval = null,
      loadMethod = "load",
    } = {}
  ) {
    // https://docs.scriptable.app/request/
    const url = `${this.baseUrl}${path}`;
    const request = new Request(url);

    request.method = method;
    request.headers = {
      ...this.defaultHeaders,
      ...headers,
    };
    if (body) request.body = body;
    if (timeoutInterval) request.timeoutInterval = timeoutInterval;

    await this.beforeRequest(request);

    const response = await request[loadMethod]();

    await this.afterRequest(request, response);

    return this.processResponse(request, response);
  }

  async beforeRequest(request) {}

  async afterRequest(request, response) {}

  processResponse(request, response) {
    return [request, response];
  }
}

module.exports = Requests;
