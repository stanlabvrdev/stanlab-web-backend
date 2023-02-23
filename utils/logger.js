const envConfig = require("../config/env");

const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");

const getDailyRotateFileTransport = (type, level) => {
    return new DailyRotateFile({
        filename: `./logs/%DATE%/${type}.log`,
        datePattern: "YYYY-MM-DD",
        level,
    });
};

const env = envConfig.getAll();

// Define your severity levels.
// With them, You can create log files,
// see or hide levels based on the running ENV.
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// This method set the current severity based on
// the current NODE_ENV: show all the log levels
// if the server was run in development mode; otherwise,
// if it was run in production, show only warn and error messages.
const level = () => {
    const currentEnv = env.environment || "development";
    const isDevelopment = currentEnv === "development";
    return isDevelopment ? "debug" : "info";
};

// Define different colors for each level.
// Colors make the log message more visible,
// adding the ability to focus or ignore messages.
const colors = {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "white",
};

// Tell winston that you want to link the colors
// defined above to the severity levels.
winston.addColors(colors);

// Custom print
const customPrint = winston.format.printf((info) => {
            const { level, ...rest } = info;
            let rtn = `[${info.timestamp}] [${level}]:`;
            if (rest.stack) {
                rtn = `${rtn} ${rest.message.replace(rest.stack.split("\n")[0].substr(7), "")}
[${info.timestamp}] [${level}]:    ${rest.stack.replace(/\n/g, `\n[${info.timestamp}] [${level}]:\t`)}`;
  } else {
    rtn = `${rtn} ${rest.message}`;
  }
  return rtn;
});

// Chose the aspect of your log customizing the log format.
const format = winston.format.combine(
  // Align the logs
  winston.format.align(),
  // Use simple format for the logs
  winston.format.simple(),
  // Log error stack track
  winston.format.errors({ stack: true }),
  // Add the message timestamp with the preferred format
  winston.format.timestamp({ format: "DD-MMM-YYYY HH:mm:ss:ms" }),
  // Define the format of the message showing the timestamp, the level and the message
  customPrint
);

// Define which transports the Logger must use to print out messages.
// In this example, we are using three different transports
const transports = [
  // Allow to print all the error level messages inside the error.log file
  getDailyRotateFileTransport("error", "error"),
  // Allow to print all the warning level messages inside the warning.log file
  getDailyRotateFileTransport("warning", "warning"),
  // Allow to print all the error message inside the all.log file
  // (also the error log that are also printed inside the error.log(
  getDailyRotateFileTransport("all"),
  getDailyRotateFileTransport("api", "http"),
];

// Create the Logger instance that has to be exported
// and used to log messages.
const Logger = winston.createLogger({
  level: level(),
  exitOnError: false,
  levels,
  format,
  transports,
  exceptionHandlers: [getDailyRotateFileTransport("exception")],
  // @ts-ignore
  rejectionHandlers: [getDailyRotateFileTransport("rejection")],
});

// If we're not in production then log to the `console`
// if (env.environment !== "production")
//Logger.add(new winston.transports.Console({
Logger.add(
  new winston.transports.Console({
    format: winston.format.combine(
      // Align the logs
      winston.format.align(),
      // Use simple format for the logs
      winston.format.simple(),
      // Log error stack track
      winston.format.errors({ stack: true }),
      // Add the message timestamp with the preferred format
      winston.format.timestamp({ format: "DD-MMM-YYYY HH:mm:ss:ms" }),
      // Define the format of the message showing the timestamp, the level and the message
      winston.format.colorize({ all: true }),
      customPrint
    ),
  })
);

// Handle node warning, unhandledRejection and uncaughtException
process.on("unhandledRejection", (reason, promise) => Logger.debug(reason));
process.on("uncaughtException", (err) => Logger.debug(err));
process.on("warning", (e) => Logger.warn(e.stack));

module.exports = Logger;