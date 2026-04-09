exports.up = async (knex) => {
  await knex.schema.createTable('users', (t) => {
    t.increments('id').primary();
    t.string('login', 100).notNullable().unique();
    t.string('password_hash', 255).notNullable();
    t.enu('role', ['KLIENT', 'PRACOWNIK']).notNullable();
    t.dateTime('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('refresh_tokens', (t) => {
    t.increments('id').primary();
    t.integer('user_id').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE');

    t.string('token_hash', 64).notNullable().unique();

    t.dateTime('expires_at').notNullable();
    t.dateTime('revoked_at').nullable();
    t.string('replaced_by_token_hash', 64).nullable();

    t.dateTime('created_at').notNullable().defaultTo(knex.fn.now());

    t.index(['user_id']);
    t.index(['expires_at']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('refresh_tokens');
  await knex.schema.dropTableIfExists('users');
};
