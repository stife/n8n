const levels = ["debug", "info", "warn", "error"];
const levelPriority = levels.reduce((acc, name, index) => {
  acc[name] = index;
  return acc;
}, {});

const envLevel = process.env.LOG_LEVEL ? process.env.LOG_LEVEL.toLowerCase() : "info";
const currentLevel = levels.includes(envLevel) ? envLevel : "info";

function shouldLog(level) {
  return levelPriority[level] >= levelPriority[currentLevel];
}

function formatMessage(level, message, meta) {
  const base = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };

  if (meta && Object.keys(meta).length > 0) {
    base.meta = meta;
  }

  return base;
}

function emit(level, message, meta = undefined) {
  if (!levelPriority[level]) {
    level = "info";
  }
  if (!shouldLog(level)) {
    return;
  }

  const payload = formatMessage(level, message, meta);
  const serialized = JSON.stringify(payload);

  if (level === "error") {
    console.error(serialized);
  } else if (level === "warn") {
    console.warn(serialized);
  } else {
    console.log(serialized);
  }
}

module.exports = {
  debug: (message, meta) => emit("debug", message, meta),
  info: (message, meta) => emit("info", message, meta),
  warn: (message, meta) => emit("warn", message, meta),
  error: (message, meta) => emit("error", message, meta),
};
