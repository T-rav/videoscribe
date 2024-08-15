import { createLogger, format, transports } from 'winston';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Function to generate a timestamped log file name
const getLogFileName = () => {
  const timestamp = new Date().toISOString().split('T')[0]; // Get only the date part (YYYY-MM-DD)
  return `${timestamp}.log`;
};

// Get the log level from environment variables or default to 'info'
const logLevel = process.env.LOG_LEVEL || 'info';

const logger = createLogger({
  level: logLevel, // Log level from environment variable or default to 'info'
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'transcription-service' },
  transports: [
    new transports.File({ filename: path.join('logs', getLogFileName()) }), // Log all errors to a timestamped file
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    ),
  }));
}

export default logger;
