const display = document.querySelector("#display");
const history = document.querySelector("#history");
const keys = document.querySelector(".keys");

const operatorSymbols = {
  add: "+",
  subtract: "\u2212",
  multiply: "\u00d7",
  divide: "\u00f7",
};

const calculations = {
  add: (first, second) => first + second,
  subtract: (first, second) => first - second,
  multiply: (first, second) => first * second,
  divide: (first, second) => {
    if (second === 0) {
      return null;
    }

    return first / second;
  },
};

const state = {
  displayValue: "0",
  firstOperand: null,
  operator: null,
  waitingForSecondOperand: false,
  justCalculated: false,
  historyText: "",
  errorText: "",
};

function updateDisplay() {
  display.textContent = state.errorText || formatDisplayValue(state.displayValue);

  if (state.historyText) {
    history.textContent = state.historyText;
  } else if (state.firstOperand !== null && state.operator) {
    history.textContent = `${formatDisplayValue(toRawNumber(state.firstOperand))} ${operatorSymbols[state.operator]}`;
  } else {
    history.textContent = "\u00a0";
  }
}

function inputDigit(digit) {
  if (state.errorText) {
    resetCalculator();
  }

  if (state.waitingForSecondOperand || state.justCalculated) {
    state.displayValue = digit;
    state.waitingForSecondOperand = false;
    state.justCalculated = false;
    state.historyText = "";
    updateDisplay();
    return;
  }

  const visibleLength = state.displayValue.replace("-", "").replace(".", "").length;

  if (state.displayValue === "0") {
    state.displayValue = digit;
  } else if (visibleLength < 14) {
    state.displayValue += digit;
  }

  updateDisplay();
}

function inputDecimal() {
  if (state.errorText) {
    resetCalculator();
  }

  if (state.waitingForSecondOperand || state.justCalculated) {
    state.displayValue = "0.";
    state.waitingForSecondOperand = false;
    state.justCalculated = false;
    state.historyText = "";
    updateDisplay();
    return;
  }

  if (!state.displayValue.includes(".")) {
    state.displayValue += ".";
  }

  updateDisplay();
}

function chooseOperator(nextOperator) {
  if (state.errorText) {
    resetCalculator();
  }

  const inputValue = Number(state.displayValue);
  state.historyText = "";

  if (state.operator && state.waitingForSecondOperand) {
    state.operator = nextOperator;
    updateDisplay();
    return;
  }

  if (state.firstOperand === null) {
    state.firstOperand = inputValue;
  } else if (state.operator) {
    const result = calculations[state.operator](state.firstOperand, inputValue);

    if (result === null) {
      showError();
      return;
    }

    state.displayValue = toRawNumber(result);
    state.firstOperand = result;
  }

  state.operator = nextOperator;
  state.waitingForSecondOperand = true;
  state.justCalculated = false;
  updateDisplay();
}

function calculate() {
  if (state.errorText || state.operator === null || state.firstOperand === null) {
    return;
  }

  const secondOperand = Number(state.displayValue);
  const result = calculations[state.operator](state.firstOperand, secondOperand);

  if (result === null) {
    showError();
    return;
  }

  state.historyText = [
    formatDisplayValue(toRawNumber(state.firstOperand)),
    operatorSymbols[state.operator],
    formatDisplayValue(toRawNumber(secondOperand)),
    "=",
  ].join(" ");
  state.displayValue = toRawNumber(result);
  state.firstOperand = null;
  state.operator = null;
  state.waitingForSecondOperand = false;
  state.justCalculated = true;
  updateDisplay();
}

function deleteDigit() {
  if (state.errorText || state.waitingForSecondOperand || state.justCalculated) {
    state.displayValue = "0";
    state.errorText = "";
    state.justCalculated = false;
    state.historyText = "";
    updateDisplay();
    return;
  }

  if (state.displayValue.length <= 1 || (state.displayValue.length === 2 && state.displayValue.startsWith("-"))) {
    state.displayValue = "0";
  } else {
    state.displayValue = state.displayValue.slice(0, -1);
  }

  updateDisplay();
}

function toggleSign() {
  if (state.errorText || state.displayValue === "0") {
    return;
  }

  state.displayValue = state.displayValue.startsWith("-")
    ? state.displayValue.slice(1)
    : `-${state.displayValue}`;
  updateDisplay();
}

function resetCalculator() {
  state.displayValue = "0";
  state.firstOperand = null;
  state.operator = null;
  state.waitingForSecondOperand = false;
  state.justCalculated = false;
  state.historyText = "";
  state.errorText = "";
  updateDisplay();
}

function showError() {
  state.displayValue = "0";
  state.firstOperand = null;
  state.operator = null;
  state.waitingForSecondOperand = false;
  state.justCalculated = false;
  state.historyText = "";
  state.errorText = "Cannot divide by zero";
  updateDisplay();
}

function toRawNumber(value) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return Number.parseFloat(value.toPrecision(12)).toString();
}

function formatDisplayValue(value) {
  if (value === "-") {
    return value;
  }

  const sign = value.startsWith("-") ? "-" : "";
  const absoluteValue = sign ? value.slice(1) : value;
  const [integerPart, decimalPart] = absoluteValue.split(".");
  const groupedInteger = Number(integerPart || "0").toLocaleString("en-US");

  if (decimalPart !== undefined) {
    return `${sign}${groupedInteger}.${decimalPart}`;
  }

  return `${sign}${groupedInteger}`;
}

function handleAction(action) {
  if (action === "clear") {
    resetCalculator();
    return;
  }

  if (action === "delete") {
    deleteDigit();
    return;
  }

  if (action === "toggle-sign") {
    toggleSign();
    return;
  }

  if (action === "decimal") {
    inputDecimal();
    return;
  }

  if (action === "calculate") {
    calculate();
  }
}

keys.addEventListener("click", (event) => {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  const { number, operator, action } = button.dataset;

  if (number !== undefined) {
    inputDigit(number);
  }

  if (operator) {
    chooseOperator(operator);
  }

  if (action) {
    handleAction(action);
  }
});

document.addEventListener("keydown", (event) => {
  const key = event.key;

  if (/^\d$/.test(key)) {
    inputDigit(key);
    return;
  }

  if (key === ".") {
    inputDecimal();
    return;
  }

  if (key === "+" || key === "-") {
    chooseOperator(key === "+" ? "add" : "subtract");
    return;
  }

  if (key === "*" || key.toLowerCase() === "x") {
    chooseOperator("multiply");
    return;
  }

  if (key === "/") {
    event.preventDefault();
    chooseOperator("divide");
    return;
  }

  if (key === "Enter" || key === "=") {
    calculate();
    return;
  }

  if (key === "Backspace") {
    deleteDigit();
    return;
  }

  if (key === "Escape") {
    resetCalculator();
  }
});

resetCalculator();
