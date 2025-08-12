import React, { useEffect, useState } from 'react';
import { isSupabaseConfigured, logCalculation, getRecentHistory, checkCalcHistoryAccessible } from '../lib/supabaseClient';

/**
 * Utility helpers for math operations
 */
function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatNumber(value) {
  // Limit to reasonable precision and remove trailing zeros
  const str = String(value);
  if (!str.includes('.')) return str;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n.toString() : str;
}

function computeBinary(a, b, op) {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '×':
    case '*': return a * b;
    case '÷':
    case '/': return b === 0 ? NaN : a / b;
    case '^': return Math.pow(a, b);
    default: return b;
  }
}

// PUBLIC_INTERFACE
export default function Calculator() {
  /** Scientific Calculator component providing UI, keyboard input and operations. */

  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [angleMode, setAngleMode] = useState('DEG'); // DEG | RAD
  const [history, setHistory] = useState([]);
  const [sbReady, setSbReady] = useState(isSupabaseConfigured());

  const toRadians = (deg) => (deg * Math.PI) / 180;
  const fromAngleInput = (x) => (angleMode === 'DEG' ? toRadians(x) : x);

  useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
      if (sbReady) {
        // Verify that calc_history is exposed and accessible via REST.
        const ok = await checkCalcHistoryAccessible();
        if (!ok) {
          if (isMounted) setSbReady(false);
          return;
        }
        const rows = await getRecentHistory(10);
        if (isMounted) setHistory(rows);
      }
    }
    loadHistory();
    return () => { isMounted = false; };
  }, [sbReady]);

  // Keyboard support
  useEffect(() => {
    function onKeyDown(e) {
      const key = e.key;
      if ((/\d/).test(key)) {
        handleDigit(key);
        return;
      }
      if (key === '.') { handleDecimal(); return; }
      if (['+', '-', '*', '/', '^'].includes(key)) { handleOperator(key); return; }
      if (key === 'Enter' || key === '=') { e.preventDefault(); handleEquals(); return; }
      if (key === 'Backspace') { handleDelete(); return; }
      if (key === 'Escape') { handleClear(); return; }
      if (key.toLowerCase() === 'p') { handleConstant('PI'); return; }
      if (key.toLowerCase() === 'e') { handleConstant('E'); return; }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [display, prevValue, operator, waitingForOperand, angleMode]);

  function pushHistory(expression, result) {
    setHistory((h) => [{ expression, result, created_at: new Date().toISOString() }, ...h].slice(0, 10));
  }

  async function persistHistory(expression, result) {
    if (!sbReady) return;
    const { error } = await logCalculation(expression, result);
    if (error) {
      // On failure, mark Supabase as not ready to avoid repeated errors
      setSbReady(false);
    }
  }

  function handleDigit(d) {
    setDisplay((curr) => {
      if (waitingForOperand) {
        setWaitingForOperand(false);
        return d;
      }
      if (curr === '0') return d;
      return curr + d;
    });
  }

  function handleDecimal() {
    setDisplay((curr) => {
      if (waitingForOperand) {
        setWaitingForOperand(false);
        return '0.';
      }
      if (!curr.includes('.')) return curr + '.';
      return curr;
    });
  }

  function handleOperator(nextOp) {
    const inputValue = toNumber(display);
    if (prevValue == null) {
      setPrevValue(inputValue);
    } else if (!waitingForOperand) {
      const result = computeBinary(prevValue, inputValue, operator);
      setPrevValue(result);
      setDisplay(formatNumber(result));
    }
    setOperator(nextOp);
    setWaitingForOperand(true);
  }

  function handleEquals() {
    if (operator == null || prevValue == null) return;
    const a = prevValue;
    const b = toNumber(display);
    const result = computeBinary(a, b, operator);
    const expr = `${formatNumber(a)} ${operator} ${formatNumber(b)}`;
    setDisplay(String(formatNumber(result)));
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(true);
    pushHistory(expr, String(result));
    persistHistory(expr, String(result));
  }

  function handleClear() {
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  }

  function handleDelete() {
    setDisplay((curr) => {
      if (waitingForOperand) return curr;
      if (curr.length <= 1) return '0';
      const next = curr.slice(0, -1);
      return next === '-' ? '0' : next;
    });
  }

  function handlePlusMinus() {
    setDisplay((curr) => {
      if (curr === '0') return '0';
      return curr.startsWith('-') ? curr.slice(1) : '-' + curr;
    });
  }

  function handlePercent() {
    const n = toNumber(display);
    setDisplay(formatNumber(n / 100));
  }

  function handleConstant(name) {
    if (name === 'PI') setDisplay(formatNumber(Math.PI));
    if (name === 'E') setDisplay(formatNumber(Math.E));
    setWaitingForOperand(false);
  }

  function applyUnary(fn) {
    const x = toNumber(display);
    let y = x;

    switch (fn) {
      case 'sin': y = Math.sin(fromAngleInput(x)); break;
      case 'cos': y = Math.cos(fromAngleInput(x)); break;
      case 'tan': y = Math.tan(fromAngleInput(x)); break;
      case 'log': y = Math.log10(Math.abs(x)); break;
      case 'ln': y = Math.log(Math.abs(x)); break;
      case 'sqrt': y = x < 0 ? NaN : Math.sqrt(x); break;
      case 'x2': y = x * x; break;
      case '1/x': y = x === 0 ? NaN : 1 / x; break;
      case 'exp': y = Math.exp(x); break;
      case '|x|': y = Math.abs(x); break;
      default: break;
    }

    const expr = `${fn}(${formatNumber(x)})`;
    setDisplay(formatNumber(y));
    setWaitingForOperand(true);
    pushHistory(expr, String(y));
    persistHistory(expr, String(y));
  }

  const functionButtons = [
    { label: 'sin', action: () => applyUnary('sin') },
    { label: 'cos', action: () => applyUnary('cos') },
    { label: 'tan', action: () => applyUnary('tan') },
    { label: 'log', action: () => applyUnary('log') },
    { label: 'ln', action: () => applyUnary('ln') },
    { label: '√', action: () => applyUnary('sqrt') },
    { label: 'x²', action: () => applyUnary('x2') },
    { label: '1/x', action: () => applyUnary('1/x') },
    { label: 'EXP', action: () => applyUnary('exp') },
    { label: '|x|', action: () => applyUnary('|x|') },
    { label: 'π', action: () => handleConstant('PI') },
    { label: 'e', action: () => handleConstant('E') },
  ];

  const operatorButtons = [
    { label: '÷', value: '/' },
    { label: '×', value: '*' },
    { label: '−', value: '-' },
    { label: '+', value: '+' },
    { label: '^', value: '^' },
  ];

  const digitButtons = [
    '7','8','9',
    '4','5','6',
    '1','2','3',
    '0','.'
  ];

  return (
    <div className="calc-wrapper">
      <div className="calc-panel" role="region" aria-label="Scientific calculator">
        <div className="display" aria-live="polite" aria-atomic="true" data-testid="display">
          {display}
        </div>

        <div className="top-row">
          <button className="btn btn-secondary" onClick={handleClear} aria-label="Clear">C</button>
          <button className="btn btn-secondary" onClick={handleDelete} aria-label="Delete last">DEL</button>
          <button className="btn btn-secondary" onClick={handlePlusMinus} aria-label="Toggle sign">±</button>
          <button className="btn btn-secondary" onClick={handlePercent} aria-label="Percent">%</button>
          <button
            className="btn btn-toggle"
            onClick={() => setAngleMode((m) => (m === 'DEG' ? 'RAD' : 'DEG'))}
            aria-label="Toggle angle mode"
            title="Toggle angle mode (DEG/RAD)"
          >
            {angleMode}
          </button>
        </div>

        <div className="keypad">
          <div className="functions">
            {functionButtons.map((b) => (
              <button key={b.label} className="btn btn-func" onClick={b.action}>{b.label}</button>
            ))}
          </div>
          <div className="digits-ops">
            <div className="digits">
              {digitButtons.map((d) =>
                d === '.'
                  ? <button key={d} className="btn" onClick={handleDecimal}>.</button>
                  : <button key={d} className="btn" onClick={() => handleDigit(d)}>{d}</button>
              )}
            </div>
            <div className="ops">
              {operatorButtons.map((op) => (
                <button key={op.label} className="btn btn-operator" onClick={() => handleOperator(op.value)}>
                  {op.label}
                </button>
              ))}
              <button className="btn btn-equal" onClick={handleEquals} aria-label="Equals">=</button>
            </div>
          </div>
        </div>
      </div>

      <div className="history-panel" aria-live="polite">
        <div className="history-header">
          <span>History</span>
          <span className={`badge ${sbReady ? 'ok' : 'off'}`}>{sbReady ? 'Supabase Connected' : 'Offline'}</span>
        </div>
        {history.length === 0 ? (
          <div className="history-empty">No history yet.</div>
        ) : (
          <ul className="history-list">
            {history.map((h, idx) => (
              <li key={idx}>
                <span className="expr">{h.expression}</span>
                <span className="eq">=</span>
                <span className="res">{h.result}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
