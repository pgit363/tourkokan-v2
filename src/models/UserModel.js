import { getDBConnection } from '../config/database';

export const createUserTable = async () => {
  const db = await getDBConnection();
  await db.executeSql(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT
    );`
  );
};

export const dropUserTable = async () => {
  const db = await getDBConnection();
  await db.executeSql(`DROP TABLE IF EXISTS users`);
};
