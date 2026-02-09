class SnapLua {
  constructor(api = {}, permissionManager = null, abuseDetector = null) {
    // ===== Environment =====
    this.vars = {};            // variables / tables
    this.funcs = {};           // functions
    this.events = {};          // event handlers
    this.api = api;            // allowed APIs

    // ===== Permissions =====
    this.permissionManager = permissionManager || {
      granted: new Set(),
      has: (perm) => this.permissionManager.granted.has(perm),
      request: async (perm) => {
        if (this.permissionManager.granted.has(perm)) return true;
        const allowed = confirm(`Allow script to use ${perm}?`);
        if (allowed) this.permissionManager.granted.add(perm);
        return allowed;
      }
    };

    // ===== Abuse Detection =====
    this.abuse = abuseDetector || {
      calls: {},
      score: 0,
      startTime: Date.now(),
      track: (apiName) => {
        if (!this.abuse.calls[apiName]) this.abuse.calls[apiName] = 0;
        this.abuse.calls[apiName]++;
        if (this.abuse.calls[apiName] > 5) this.abuse.score += 2;
        if (this.abuse.score > 5) throw { abuse: `Too much suspicious activity on ${apiName}` };
      },
      checkTime: () => {
        if (Date.now() - this.abuse.startTime > 2000) {
          throw { abuse: "Script running too long" };
        }
      }
    };

    // ===== Loop Control =====
    this.loopControl = null;   // used for break / continue in loops

    // ===== Timers =====
    this.timers = [];
  }
}
