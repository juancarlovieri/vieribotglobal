const winston = require('winston');

const { format, transports } = winston;

const logFormat = format.printf(
  ({ level, message, timestamp }) => `${timestamp} ${level}: ${message}`,
);

const logger = winston.createLogger({
  transports: [
    new transports.Console({
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        format.cli(),
        logFormat,
      ),
    }),
    new transports.File({
      filename: 'combined.log',
      format: format.combine(format.timestamp(), format.json()),
    }),
  ],
});

module.exports = { logger };
