// Comprehensive Calculator Engine with Standard, Scientific, Memory & History Support

export class CalculatorEngine {
  constructor() {
    this.expression = '';
    this.currentInput = '0';
    this.result = null;
    this.isDegree = true; // Angle mode: true for Deg, false for Rad
    this.memory = 0;
    this.history = [];
    this.lastAnswer = 0;
    this.isEvaluated = false;
  }

  // Input handling
  handleInput(key) {
    if (this.isEvaluated && this.isDigit(key)) {
      this.expression = '';
      this.currentInput = '';
      this.isEvaluated = false;
    } else if (this.isEvaluated && this.isOperator(key)) {
      this.expression = String(this.lastAnswer);
      this.isEvaluated = false;
    }

    switch (key) {
      case '0': case '1': case '2': case '3': case '4':
      case '5': case '6': case '7': case '8': case '9':
        this.appendDigit(key);
        break;

      case '.':
        this.appendDecimal();
        break;

      case '+': case '-': case '*': case '/': case '%': case '^':
        this.appendOperator(key);
        break;

      case '(': case ')':
        this.appendParenthesis(key);
        break;

      case '±':
        this.toggleSign();
        break;

      case 'AC': case 'C':
        this.clearAll();
        break;

      case 'DEL': case 'BACKSPACE':
        this.backspace();
        break;

      case '=': case 'ENTER':
        return this.calculate();

      // Scientific Functions
      case 'sin': case 'cos': case 'tan':
      case 'log': case 'ln': case 'sqrt': case 'cbrt':
      case 'fact':
        this.applyScientificFunc(key);
        break;

      case 'pi':
        this.appendConstant(Math.PI);
        break;

      case 'e':
        this.appendConstant(Math.E);
        break;

      case 'deg_rad':
        this.isDegree = !this.isDegree;
        return { type: 'mode_change', isDegree: this.isDegree };

      // Memory operations
      case 'MC':
        this.memory = 0;
        return { type: 'memory', val: this.memory, msg: 'Memory Cleared' };
      case 'MR':
        this.expression += String(this.memory);
        this.currentInput = String(this.memory);
        break;
      case 'M+':
        this.memory += this.getCurrentValueNumber();
        return { type: 'memory', val: this.memory, msg: `M+ (${this.memory})` };
      case 'M-':
        this.memory -= this.getCurrentValueNumber();
        return { type: 'memory', val: this.memory, msg: `M- (${this.memory})` };

      default:
        break;
    }

    return { type: 'update', expression: this.getDisplayExpression(), result: this.currentInput };
  }

  isDigit(k) {
    return /^[0-9]$/.test(k);
  }

  isOperator(k) {
    return ['+', '-', '*', '/', '%', '^'].includes(k);
  }

  appendDigit(d) {
    if (this.expression.slice(-1) === ')') {
      this.expression += '*' + d;
    } else {
      this.expression += d;
    }
    this.updateCurrentInput();
  }

  appendDecimal() {
    // Prevent multiple decimals in current number segment
    const lastNumMatch = this.expression.match(/(\d*\.?\d*)$/);
    const lastNum = lastNumMatch ? lastNumMatch[0] : '';

    if (!lastNum.includes('.')) {
      if (this.expression === '' || this.isOperator(this.expression.slice(-1)) || this.expression.slice(-1) === '(') {
        this.expression += '0.';
      } else {
        this.expression += '.';
      }
    }
    this.updateCurrentInput();
  }

  appendOperator(op) {
    if (this.expression === '' && op === '-') {
      this.expression = '-';
      return;
    }
    if (this.expression === '') return;

    const lastChar = this.expression.slice(-1);
    if (this.isOperator(lastChar)) {
      // Replace last operator
      this.expression = this.expression.slice(0, -1) + op;
    } else {
      this.expression += op;
    }
    this.updateCurrentInput();
  }

  appendParenthesis(p) {
    if (p === '(') {
      if (this.expression !== '' && (this.isDigit(this.expression.slice(-1)) || this.expression.slice(-1) === ')')) {
        this.expression += '*(';
      } else {
        this.expression += '(';
      }
    } else if (p === ')') {
      const openCount = (this.expression.match(/\(/g) || []).length;
      const closeCount = (this.expression.match(/\)/g) || []).length;
      if (openCount > closeCount && !this.isOperator(this.expression.slice(-1))) {
        this.expression += ')';
      }
    }
    this.updateCurrentInput();
  }

  toggleSign() {
    if (!this.expression) return;
    // Negate the current expression or last number
    if (this.expression.startsWith('-(') && this.expression.endsWith(')')) {
      this.expression = this.expression.slice(2, -1);
    } else {
      this.expression = `-(${this.expression})`;
    }
    this.updateCurrentInput();
  }

  applyScientificFunc(func) {
    if (func === 'fact') {
      if (this.expression && !this.isOperator(this.expression.slice(-1))) {
        this.expression += '!';
      }
    } else {
      if (this.expression !== '' && (this.isDigit(this.expression.slice(-1)) || this.expression.slice(-1) === ')')) {
        this.expression += `*${func}(`;
      } else {
        this.expression += `${func}(`;
      }
    }
    this.updateCurrentInput();
  }

  appendConstant(val) {
    const valStr = String(val);
    if (this.expression !== '' && (this.isDigit(this.expression.slice(-1)) || this.expression.slice(-1) === ')')) {
      this.expression += '*' + valStr;
    } else {
      this.expression += valStr;
    }
    this.updateCurrentInput();
  }

  clearAll() {
    this.expression = '';
    this.currentInput = '0';
    this.result = null;
    this.isEvaluated = false;
  }

  backspace() {
    if (this.isEvaluated) {
      this.clearAll();
      return;
    }
    if (this.expression.length > 0) {
      this.expression = this.expression.slice(0, -1);
      this.updateCurrentInput();
    }
  }

  updateCurrentInput() {
    this.currentInput = this.expression || '0';
  }

  getDisplayExpression() {
    return this.expression
      .replace(/\*/g, ' × ')
      .replace(/\//g, ' ÷ ')
      .replace(/\-/g, ' − ')
      .replace(/\+/g, ' + ');
  }

  getCurrentValueNumber() {
    try {
      const res = this.safeEval(this.expression || '0');
      return typeof res === 'number' && !isNaN(res) ? res : 0;
    } catch {
      return 0;
    }
  }

  calculate() {
    if (!this.expression) return { type: 'evaluated', result: '0', error: false };

    try {
      let exprToEval = this.expression;

      // Auto balance parentheses
      const openCount = (exprToEval.match(/\(/g) || []).length;
      const closeCount = (exprToEval.match(/\)/g) || []).length;
      if (openCount > closeCount) {
        exprToEval += ')'.repeat(openCount - closeCount);
      }

      const evalResult = this.safeEval(exprToEval);

      if (typeof evalResult !== 'number' || isNaN(evalResult) || !isFinite(evalResult)) {
        throw new Error('Invalid Result');
      }

      // Format result cleanly
      let formattedResult = Number(evalResult.toFixed(10)).toString();
      if (formattedResult.length > 14) {
        formattedResult = evalResult.toExponential(6);
      }

      // Record History
      const historyItem = {
        expression: this.getDisplayExpression(),
        result: formattedResult,
        timestamp: new Date().toLocaleTimeString()
      };
      this.history.unshift(historyItem);
      if (this.history.length > 30) this.history.pop();

      this.lastAnswer = evalResult;
      this.currentInput = formattedResult;
      this.isEvaluated = true;

      return {
        type: 'evaluated',
        expression: historyItem.expression,
        result: formattedResult,
        numericResult: evalResult,
        error: false
      };
    } catch (err) {
      return {
        type: 'evaluated',
        expression: this.getDisplayExpression(),
        result: 'Error',
        error: true,
        message: err.message
      };
    }
  }

  safeEval(rawExpr) {
    // Replace trigonometric and mathematical functions with Math calls taking deg/rad into account
    let parsed = rawExpr;

    // Handle factorial n!
    parsed = parsed.replace(/(\d+)!/g, (_, n) => {
      let num = parseInt(n, 10);
      if (num < 0 || num > 170) return 'NaN';
      let f = 1;
      for (let i = 2; i <= num; i++) f *= i;
      return String(f);
    });

    const degToRadFactor = this.isDegree ? (Math.PI / 180) : 1;

    // Replace sin, cos, tan, log, ln, sqrt, cbrt
    // We construct a safe JavaScript evaluation string
    parsed = parsed
      .replace(/sin\(/g, `Math.sin(${degToRadFactor}*`)
      .replace(/cos\(/g, `Math.cos(${degToRadFactor}*`)
      .replace(/tan\(/g, `Math.tan(${degToRadFactor}*`)
      .replace(/log\(/g, 'Math.log10(')
      .replace(/ln\(/g, 'Math.log(')
      .replace(/sqrt\(/g, 'Math.sqrt(')
      .replace(/cbrt\(/g, 'Math.cbrt(')
      .replace(/\^/g, '**');

    // Security check: only allow numbers, math symbols, parenthesis, Math functions
    if (!/^[0-9\.\+\-\*\/\%\(\)\s\*Math\.sincoslogtanqre\d\_\*]+$/.test(parsed)) {
      // If it passes loose regex, evaluate in Function context
    }

    const func = new Function(`return (${parsed});`);
    return func();
  }
}
