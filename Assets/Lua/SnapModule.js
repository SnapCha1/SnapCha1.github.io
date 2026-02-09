class SnapLua {
  constructor(api = {}) {
    this.vars = {};
    this.funcs = {};
    this.events = {};
    this.api = api;
  }

  run(code) {
    this.lines = code.split("\n");
    this.i = 0;

    while (this.i < this.lines.length) {
      const line = this.clean(this.lines[this.i]);
      if (line) this.execute(line);
      this.i++;
    }
  }

  clean(line) {
    return line.split("--")[0].trim();
  }

  execute(line) {

    // ===== FUNCTION =====
    if (line.startsWith("function")) {
      const [, name, args] = line.match(/function (\w+)\((.*?)\)/);
      const body = [];

      this.i++;
      while (!this.lines[this.i].trim().startsWith("end")) {
        body.push(this.lines[this.i]);
        this.i++;
      }

      this.funcs[name] = { args: args.split(",").map(a => a.trim()).filter(Boolean), body };
      return;
    }

    // ===== EVENT =====
    if (line.startsWith("on")) {
      const name = line.slice(2).trim();
      const body = [];

      this.i++;
      while (!this.lines[this.i].trim().startsWith("end")) {
        body.push(this.lines[this.i]);
        this.i++;
      }

      this.events[name] = body;
      return;
    }

    // ===== IF / ELSE =====
    if (line.startsWith("if")) {
      const condition = line.match(/if (.*) then/)[1];
      const ifBlock = [];
      const elseBlock = [];
      let inElse = false;

      this.i++;
      while (!this.lines[this.i].trim().startsWith("end")) {
        const l = this.clean(this.lines[this.i]);
        if (l === "else") {
          inElse = true;
        } else {
          (inElse ? elseBlock : ifBlock).push(this.lines[this.i]);
        }
        this.i++;
      }

      if (this.evalCond(condition)) {
        this.run(ifBlock.join("\n"));
      } else {
        this.run(elseBlock.join("\n"));
      }
      return;
    }

    // ===== RETURN =====
    if (line.startsWith("return")) {
      throw { return: this.eval(line.replace("return", "").trim()) };
    }

    // ===== FUNCTION CALL =====
    const callMatch = line.match(/(\w+)\((.*?)\)/);
    if (callMatch && this.funcs[callMatch[1]]) {
      const { args, body } = this.funcs[callMatch[1]];
      const values = callMatch[2].split(",").map(v => this.eval(v.trim()));

      const oldVars = { ...this.vars };
      args.forEach((a, i) => this.vars[a] = values[i]);

      try {
        this.run(body.join("\n"));
      } catch (e) {
        if (e.return !== undefined) return e.return;
      }

      this.vars = oldVars;
      return;
    }

    // ===== API CALL =====
    if (this.api[line]) {
      this.api[line]();
      return;
    }

    // ===== ASSIGNMENT =====
    if (line.includes("=")) {
      const [k, v] = line.split("=");
      this.vars[k.trim()] = this.eval(v.trim());
    }
  }

  evalCond(c) {
    return Function("v", `with(v){ return ${c.replace("~=", "!=")} }`)(this.vars);
  }

  eval(v) {
    if (v === "true") return true;
    if (v === "false") return false;
    if (v === "nil") return null;

    if (v.startsWith("{")) {
      return JSON.parse(v.replace(/(\w+)\s*=/g, '"$1":'));
    }

    if (!isNaN(v)) return Number(v);
    if (v.startsWith('"') || v.startsWith("'")) return v.slice(1, -1);
    if (this.vars[v] !== undefined) return this.vars[v];

    return Function("v", `with(v){ return ${v.replace("..", "+")} }`)(this.vars);
  }

  trigger(event) {
    if (this.events[event]) {
      this.run(this.events[event].join("\n"));
    }
  }
}
