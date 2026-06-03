import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, varchar } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';

const subjectGroupsTable = pgTable('sg', { id: varchar('id') });
const subjectsTable = pgTable('s', { id: varchar('id') });

const db = drizzle({} as any);

function test(hasJoin: boolean) {
  let query = db.select({ sg: subjectGroupsTable }).from(subjectGroupsTable).$dynamic();
  if (hasJoin) {
    query = query.innerJoin(subjectsTable, eq(subjectGroupsTable.id, subjectsTable.id));
  }
  return query;
}
