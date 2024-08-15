import { createLogger, format, transports } from 'winston';
import path from 'path';

// Function to generate a timestamped log file name
const getLogFileName = () => {
  const timestamp = new Date().toISOString().split('T')[0]; // Get only the date part (YYYY-MM-DD)
  return `${timestamp}.log`;
};

const logger = createLogger({
  level: 'error', // Log only errors
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
