
class UrlsSvc {
  get_uiend_url() {
    var protocol = 'wss:';
    if (window.location.protocol === 'http:')
      protocol = 'ws:';
    if (window.location.hostname === "ui.headspin.io") {
      return protocol + "//uiend.headspin.io";
    } else if (window.location.hostname === "ui-dev.headspin.io" ||
               window.location.hostname === "dev.headspin.io") {
      return protocol + "//uiend-dev.headspin.io";
    } else if (window.location.hostname === "ui-canary.headspin.io") {
      return protocol + "//uiend-canary.headspin.io";
    } else if (window.location.hostname === "ui-uber.headspin.io") {
      return protocol + "//uiend-uber.headspin.io";
    } else {
      return protocol + "//localhost:8300";
    }
  }

  get_api_url() {
    var protocol = window.location.protocol;
    if (window.location.hostname === 'ui.headspin.io')
      return protocol + '//api.headspin.io';
    else if (window.location.hostname === 'ui-dev.headspin.io' ||
             window.location.hostname === 'dev.headspin.io')
      return protocol + '//api-dev.headspin.io';
    else if (window.location.hostname === 'ui-canary.headspin.io')
      return protocol + '//api-canary.headspin.io';
    else if (window.location.hostname === 'ui-uber.headspin.io')
      return protocol + '//api-uber.headspin.io';
    else
      return protocol + '//localhost:8303';
  }

  get_stf_url(selector, port, jwt, path='') {
    var protocol = 'https',
        base_url = `${protocol}://${selector}.headspin.io:${port}`,
        query_string = `?jwt=${jwt}`;
    return base_url + query_string + path;
  }
}

export {UrlsSvc};
