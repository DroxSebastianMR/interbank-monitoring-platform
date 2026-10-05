import { ConsoleLogger, type LogLevel } from '@nestjs/common';

export class CompactConsoleLogger extends ConsoleLogger {
  protected override formatMessage(
    logLevel: LogLevel,
    message: unknown,
    pidMessage: string,
    formattedLogLevel: string,
    contextMessage: string,
    timestampDiff: string,
  ): string {
    const compactLogLevel = ` ${formattedLogLevel.trimStart()}`;

    return super.formatMessage(
      logLevel,
      message,
      pidMessage,
      compactLogLevel,
      contextMessage,
      timestampDiff,
    );
  }
}
