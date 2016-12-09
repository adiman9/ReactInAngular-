//
// The start of the headspin JS api. This basically wraps a single websocket
// connection to the uiend service.
//

class UiendSvc {
  constructor(urls_svc, auth_svc, monitor_svc) {
    this.auth_svc = auth_svc;
    this.monitor_svc = monitor_svc;
    this._url = urls_svc.get_uiend_url();
    this._socket = null;
    this._resolve_connected_promise = null;
    this._already_connecting = false;
    this._connected_promise = new Promise(
      (resolve) => this._resolve_connected_promise = resolve);
    this._id = 0;
    this._callbacks = {};
  }

  when_connected() {
    if (this._already_connecting)
      return this._connected_promise;

    this._already_connecting = true;

    this._socket = new window.WebSocket(this._url);

    this._socket.onopen = () => {
      console.log("HeadSpin socket open.");
      this._resolve_connected_promise();
    };

    this._socket.onclose = () => {
      // Reset the promise
      this._connected_promise = new Promise(
        (resolve) => this._resolve_connected_promise = resolve);
      console.log("HeadSpin socket close.");
    };

    this._socket.onmessage = (evt) =>
      this._recv_message(JSON.parse(evt.data));

    return this._connected_promise;
  }

  _recv_message(message) {
    var callback = this._callbacks[message.id];
    if (message.status === 'next') {
      callback(message.body, null, null);
    }
    else if (message.status === 'error') {
      callback(null, message.body, null);
      delete this._callbacks[message.id];
    }
    else if (message.status === 'complete') {
      callback(null, null, true);
      delete this._callbacks[message.id];
    }
    this.monitor_svc.digest();
  }

  _send_message(type, key, args, callback, checkauth) {
    let lease = this.auth_svc.auth_config.default_lease();
    let user_id = null;
    let sig = null;
    if (lease) {
      user_id = lease.user_id;
      sig = this.auth_svc.sign(lease.secret_api_key, key);
    }
    if (typeof callback !== 'function') {
      console.warn('uiend: Callback is required.');
      return;
    }
    var id = this._id++;
    this._callbacks[id] = (msg, error, complete) => {
      if (complete !== null || error !== null)
        delete this._callbacks[id];
      callback(msg, error, complete);
    };
    var message = {
      type: type,
      checkauth: !!checkauth,
      user_id: user_id,
      sig: sig,
      key: key,
      args: args,
      id: id
    };
    this._socket.send(JSON.stringify(message));
  }

  once(key, args, callback, checkauth=false) {
    this._send_message('once', key, args, callback, checkauth);
  }

  subscribe(key, args, callback, checkauth=false) {
    this._send_message('subscribe', key, args, callback, checkauth);
  }

  post(key, args, callback, checkauth=false) {
    this._send_message('post', key, args, callback, checkauth);
  }

  can_once(key, args, callback) {
    this.once(key, args, callback, true);
  }

  can_subscribe(key, args, callback) {
    this.subscribe(key, args, callback, true);
  }

  can_post(key, args, callback) {
    this.post(key, args, callback, true);
  }
}


export {UiendSvc};
