import { getDBConnection } from '../config/database';

export const addUser = async (name, email) => {
    console.log(name, email);
    
  const db = await getDBConnection();
  const query = `INSERT INTO users (name, email) VALUES (?, ?)`;
  await db.executeSql(query, [name, email]);
};

export const getAllUsers = async () => {
  const db = await getDBConnection();
  const results = await db.executeSql(`SELECT * FROM users`);
  let users = [];
  results.forEach(result => {
    for (let i = 0; i < result.rows.length; i++) {
      users.push(result.rows.item(i));
    }
  });
  return users;
};

export const updateUser = async (id, name, email) => {
  const db = await getDBConnection();
  const query = `UPDATE users SET name=?, email=? WHERE id=?`;
  await db.executeSql(query, [name, email, id]);
};

export const deleteUser = async (id) => {
  const db = await getDBConnection();
  const query = `DELETE FROM users WHERE id=?`;
  await db.executeSql(query, [id]);
};
