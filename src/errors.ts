/**
 * Thrown by {@link rruleToText} when the input rule cannot be parsed or
 * turned into text. Never thrown by {@link tryRruleToText}, which instead
 * returns `null`.
 */
export class RRuleTextError extends Error {
  /** The value that could not be converted, when available. */
  public readonly cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'RRuleTextError';
    if (options && 'cause' in options) {
      this.cause = options.cause;
    }
    // Restore the prototype chain (needed when targeting ES5/ES2015 downlevel output).
    Object.setPrototypeOf(this, RRuleTextError.prototype);
  }
}
