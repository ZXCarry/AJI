exports.seed = async (knex) => {
  const statuses = [
    { name: 'NIEZATWIERDZONE' },
    { name: 'ZATWIERDZONE' },
    { name: 'ANULOWANE' },
    { name: 'ZREALIZOWANE' },
  ];

  for (const s of statuses) {
    await knex('order_statuses')
      .insert(s)
      .onConflict('name')
      .ignore();
  }
};
