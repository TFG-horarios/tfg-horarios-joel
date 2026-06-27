export type DbTransaction = any;

export type TransactionRunner = <T>(
  work: (tx: DbTransaction) => Promise<T>
) => Promise<T>;
