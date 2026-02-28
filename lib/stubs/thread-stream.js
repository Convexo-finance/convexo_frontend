// Browser stub for thread-stream (Node.js worker thread library).
// pino/lib/transport.js requires this on Node.js but it's never used in the browser.
module.exports = class ThreadStream {
  constructor() {}
  write() {}
  end() {}
  destroy() {}
};
