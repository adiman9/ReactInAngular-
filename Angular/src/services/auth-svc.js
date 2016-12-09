var SHA = window.jsSHA;
var localStorage = window.localStorage;
var _ = window._;

const auth_key = 'auth';

class AuthConfig {
  constructor() {
    let config_str = localStorage.getItem(auth_key);
    if (config_str) {
      let config = JSON.parse(config_str);
      this.default_lease_index = config.default_lease_index;
      this.leases = config.leases;
    } else {
      this.default_lease_index = -1;
      this.leases = [];
    }
  }

  default_lease() {
    if (this.default_lease_index >= 0)
      return this.leases[this.default_lease_index];
    return null;
  }

  is_default(lease) {
    return this.default_lease() === lease;
  }

  set_default(lease) {
    let matching_lease = this.leases.find(
      (l) => l.user_id === lease.user_id &&
        l.secret_api_key === lease.secret_api_key);
    this.default_lease_index = this.leases.indexOf(matching_lease);
    this.save();
  }

  add_leases(new_leases) {
    for (let lease of new_leases)
      this.add_lease(lease);
  }

  add_lease(new_lease) {
    let existing_lease = this.leases.find((lease) => {
      return lease.user_id === new_lease.user_id &&
        lease.secret_api_key === new_lease.secret_api_key;
    });
    if (existing_lease) {
      // Already authenticated to this lease.
      // Set it as default.
      this.default_lease_index = this.leases.indexOf(existing_lease);
    } else {
      this.leases.push(new_lease);
      this.default_lease_index = this.leases.length - 1;
    }
    this.save();
  }

  delete_all_leases() {
    localStorage.clear(auth_key);
  }

  save() {
    // Save
    localStorage.setItem(auth_key, JSON.stringify({
      default_lease_index: this.default_lease_index,
      leases: this.leases
    }));
  }
}

class AuthSvc {
  constructor() {
    this.auth_config = new AuthConfig();
    this.user_infos = {};
    this.auth_choice_is_open = false;
  }

  sign(secret_api_key, message) {
    var sha = new SHA("SHA-256", "TEXT");
    sha.setHMACKey(secret_api_key, "TEXT");
    sha.update(message);
    return sha.getHMAC("HEX");
  }

  is_default(lease) {
    return this.auth_config.is_default(lease);
  }

  add_leases(leases) {
    this.auth_config.add_leases(leases);
  }

  set_user_info(user_id, user_info) {
    this.user_infos[user_id] = user_info;
  }

  has_auths(at_least=1) {
    return this.auth_config.leases &&
           this.auth_config.leases.length >= at_least;
  }

  default_username() {
    return this.get_username(this.auth_config.default_lease());
  }

  default_user_org() {
    return this.get_user_org(this.auth_config.default_lease());
  }

  default_key_name() {
    let lease = this.auth_config.default_lease();
    return lease ? lease.key_name : '';
  }

  get_user_org(lease) {
    if (lease && lease.user_id in this.user_infos)
      return this.user_infos[lease.user_id].org_title;
    return '';
  }

  default_email() {
    return this.get_email(this.auth_config.default_lease());
  }

  get_email(lease) {
    if (lease && lease.user_id in this.user_infos)
      return this.user_infos[lease.user_id].email_address;
    return '';
  }

  get_username(lease) {
    if (lease && lease.user_id in this.user_infos) {
      let uinfo = this.user_infos[lease.user_id];
      if (uinfo.name) return uinfo.name;
      if (uinfo.email_address) return uinfo.email_address;
    }
    return '';
  }

  default_org() {
    return this.get_org(this.auth_config.default_lease());
  }

  get_org(lease) {
    if (lease)
      return lease.key_org_title;
    return '';
  }

  set_default_lease(lease, reload=true) {
    this.auth_config.set_default(lease);
    if (reload)
      window.location.reload();
  }

  logout() {
    this.auth_config.delete_all_leases();
    window.location.reload();
  }

  open_auth_choice() {
    this.auth_choice_is_open = true;
  }

  close_auth_choice() {
    this.auth_choice_is_open = false;
  }

  other_leases() {
    return _.filter(this.auth_config.leases, (l) => !this.is_default(l));
  }
}

export {AuthSvc};
