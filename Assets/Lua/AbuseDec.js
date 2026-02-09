class AbuseDetector {
  constructor() {
    this.calls = {};
    this.startTime = Date.now();
    this.score = 0;
  }

  track(apiName) {
    if (!this.calls[apiName]) this.calls[apiName] = 0;
    this.calls[apiName]++;

    // Rate limit example
    if (this.calls[apiName] > 5) {
      this.score += 2;
      console.warn("Spam detected:", apiName);
    }

    if (this.score > 5) {
      throw { abuse: "Too much suspicious activity" };
    }
  }

  checkTime() {
    if (Date.now() - this.startTime > 2000) {
      throw { abuse: "Script running too long" };
    }
  }
}
