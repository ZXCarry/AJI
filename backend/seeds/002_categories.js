exports.seed = async (knex) => {
  const categories = [
    { name: 'Elektronika' },
    { name: 'Książki' },
    { name: 'Odzież' },
    { name: 'Dom i ogród' },
  ];

  for (const c of categories) {
    await knex('categories')
      .insert(c)
      .onConflict('name')
      .ignore();
  }
};
