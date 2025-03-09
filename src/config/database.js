import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

let db;

export const getDBConnection = async () => {
  if (!db) {
    db = await SQLite.openDatabase({name: 'appDB.db', location: 'default'});
  }
  return db;
};

export const closeDBConnection = async () => {
  if (db) {
    await db.close();
    db = null;
  }
};
