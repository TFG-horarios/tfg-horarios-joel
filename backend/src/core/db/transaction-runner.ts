import type { DbConnection } from './connection';

export type DbTransaction = Parameters<
  Parameters<DbConnection['transaction']>[0]
>[0];

export type TransactionRunner = <T>(
  work: (tx: DbTransaction) => Promise<T>
) => Promise<T>;
