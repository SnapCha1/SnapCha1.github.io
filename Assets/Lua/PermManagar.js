class PermissionManager {
  constructor() {
    this.granted = new Set();
  }

  async request(permission) {
    if (this.granted.has(permission)) return true;

    const allowed = confirm(`Allow script to use ${permission}?`);

    if (allowed) this.granted.add(permission);

    return allowed;
  }

  has(permission) {
    return this.granted.has(permission);
  }
}
