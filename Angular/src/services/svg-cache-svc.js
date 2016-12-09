// A service that holds on to downloaded SVGs so they
// are not downloaded multiple times.

class SvgCacheSvc {
  constructor() {
    // mapping of URL to SVG
    this.cache = {};
    // mapping of URL to a list of callbacks waiting
    // for that URL to load
    this.callbacks = {};
  }

  put_svg(url, svg) {
    this.cache[url] = svg;
  }

  get_svg(url, callback) {
    if (typeof callback !== 'function')
      return;
    if (url in this.cache) {
      // cache hit
      callback(this.cache[url]);
      return;
    }
    if (url in this.callbacks) {
      // SVG currently downloading. Add to the
      // callback list
      this.callbacks[url].push(callback);
      return;
    }
    // Add to the callback list and download the SVG
    this.callbacks[url] = [callback];
    var r = new window.XMLHttpRequest();
    r.onload = () => {
      this.put_svg(url, r.response);
      // Invoke all the callbacks and delete them from
      // the list.
      this.callbacks[url].forEach(function(callback) {
        callback(r.response);
      });
      delete this.callbacks[url];
    };
    r.open("GET", url);
    r.send();
  }
}

export {SvgCacheSvc};
