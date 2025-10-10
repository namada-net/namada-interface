import { TransactionPair } from "lib/query";

export class TransactionError<T> extends Error {
  public cause: { originalError: unknown; context: TransactionPair<T> };
  constructor(
    public message: string,
    options: {
      cause: { originalError: unknown; context: TransactionPair<T> };
    }
  ) {
    super(message);
    this.cause = options.cause;
  }
}
