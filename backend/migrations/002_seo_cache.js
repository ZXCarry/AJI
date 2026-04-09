exports.up = async (knex) => {
  await knex.schema.createTable('product_seo_descriptions', (t) => {
    t.increments('id').primary();
    t.integer('product_id').unsigned().notNullable().unique()
      .references('id').inTable('products').onDelete('CASCADE');
    t.text('html', 'longtext').notNullable();
    t.dateTime('created_at').notNullable().defaultTo(knex.fn.now());
    t.dateTime('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('product_seo_descriptions');
};
