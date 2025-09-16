// src/utils/Logger.js
export default class Logger {
  static info(message, ...args) {
    console.log(`ℹ️ [INFO] ${message}`, ...args);
  }

  static warn(message, ...args) {
    console.warn(`⚠️ [WARN] ${message}`, ...args);
  }

  static error(message, error = null) {
    if (error) {
      console.error(`❌ [ERROR] ${message}`, error.message, error.stack);
    } else {
      console.error(`❌ [ERROR] ${message}`);
    }
  }
}
