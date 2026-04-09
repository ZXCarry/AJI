require('dotenv').config();
const knex = require('knex');

const db = knex({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
});

(async () => {
  try {
    const r = await db.raw('SELECT 1+1 AS ok');
    console.log('DB OK:', r[0]);
  } catch (e) {
    console.error('DB ERROR:', e.message);
  } finally {
    await db.destroy();
  }
})();
