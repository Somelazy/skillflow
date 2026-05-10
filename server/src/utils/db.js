const pool = require("../db/pool");

// TODO: Keep this only as a temporary fallback for legacy tables that do not
// have identity/sequence defaults. Prefer INSERT without manual ids + RETURNING.
const getNextId = async (table, column) => {
  const query = `SELECT COALESCE(MAX("${column}"), 0) + 1 AS next_id FROM "${table}"`;
  const result = await pool.query(query);
  return Number(result.rows[0].next_id);
};

module.exports = { getNextId };
