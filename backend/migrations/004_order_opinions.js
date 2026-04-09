exports.up = async (knex) => {
  // 1) Dodajemy user_login do orders (żeby wiedzieć kto złożył)
  await knex.schema.alterTable('orders', (t) => {
    t.string('user_login', 100).nullable().index(); // login z JWT
  });

  // 2) Tabela opinii (1 opinia na zamówienie)
  await knex.schema.createTable('order_opinions', (t) => {
    t.increments('id').primary();

    t.integer('order_id').unsigned().notNullable()
      .references('id').inTable('orders').onDelete('CASCADE');

    t.integer('rating').notNullable(); // 1-5 (zwalidujemy w API)
    t.text('content').notNullable();

    t.dateTime('created_at').notNullable().defaultTo(knex.fn.now());

    t.unique(['order_id']);
    t.index(['order_id']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('order_opinions');
  await knex.schema.alterTable('orders', (t) => {
    t.dropColumn('user_login');
  });
};
