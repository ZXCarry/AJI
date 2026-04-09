exports.up = async (knex) => {
  await knex.schema.createTable('categories', (t) => {
    t.increments('id').primary();
    t.string('name', 200).notNullable().unique();
  });

  await knex.schema.createTable('order_statuses', (t) => {
    t.increments('id').primary();
    t.string('name', 100).notNullable().unique();
  });

  await knex.schema.createTable('products', (t) => {
    t.increments('id').primary();
    t.string('name', 200).notNullable();
    t.text('description').notNullable();
    t.decimal('unit_price', 10, 2).notNullable();
    t.decimal('unit_weight', 10, 3).notNullable();
    t
      .integer('category_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('categories')
      .onDelete('RESTRICT');

    t.index(['category_id']);
  });

  await knex.schema.createTable('orders', (t) => {
    t.increments('id').primary();
    t.dateTime('approved_at').nullable();

    t
      .integer('status_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('order_statuses')
      .onDelete('RESTRICT');

    t.string('user_name', 200).notNullable();
    t.string('email', 254).notNullable();
    t.string('phone', 50).notNullable();

    t.dateTime('created_at').notNullable().defaultTo(knex.fn.now());

    t.index(['status_id']);
    t.index(['user_name']);
    t.string('address', 255).notNullable().defaultTo('');
  });

  await knex.schema.createTable('order_items', (t) => {
    t.increments('id').primary();

    t
      .integer('order_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('orders')
      .onDelete('CASCADE');

    t
      .integer('product_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('products')
      .onDelete('RESTRICT');

    t.integer('quantity').unsigned().notNullable();
    t.decimal('unit_price', 10, 2).notNullable(); // cena w chwili zamówienia
    t.decimal('vat_rate', 5, 2).nullable();       // np. 23.00
    t.decimal('discount', 10, 2).nullable();      // np. 10.00 (kwotowo)

    t.unique(['order_id', 'product_id']);
    t.index(['order_id']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('order_items');
  await knex.schema.dropTableIfExists('orders');
  await knex.schema.dropTableIfExists('products');
  await knex.schema.dropTableIfExists('order_statuses');
  await knex.schema.dropTableIfExists('categories');
};
