export type TransactionRunner = <T>(
  work: (tx: any) => Promise<T>
) => Promise<T>;
