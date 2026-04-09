const bcrypt = require('bcrypt');

exports.seed = async (knex) => {
  await knex('refresh_tokens').del();
  await knex('users').del();

  const clientPass = await bcrypt.hash('client123', 10);
  const workerPass = await bcrypt.hash('worker123', 10);

  await knex('users').insert([
    { login: 'klient', password_hash: clientPass, role: 'KLIENT' },
    { login: 'pracownik', password_hash: workerPass, role: 'PRACOWNIK' },
  ]);
};
