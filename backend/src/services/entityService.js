const pool = require('../config/db');

const getAllEntities = async (filters = {}) => {
  let query = 'SELECT * FROM public.entities';
  const params = [];
  const conditions = [];
  let paramIndex = 1;

  // Apply type filter
  if (filters.types && filters.types.length > 0) {
    const placeholders = filters.types.map(() => `$${paramIndex++}`).join(', ');
    conditions.push(`type IN (${placeholders})`);
    params.push(...filters.types);
  }

  // Apply eye color filter
  if (filters.eyeColors && filters.eyeColors.length > 0) {
    const placeholders = filters.eyeColors
      .map(() => `$${paramIndex++}`)
      .join(', ');
    conditions.push(`eye_color IN (${placeholders})`);
    params.push(...filters.eyeColors);
  }

  // Apply date range filter (handle both DD/MM/YYYY and YYYY-MM-DD formats)
  if (filters.dateFrom) {
    conditions.push(`
      CASE 
        WHEN date_of_birth ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN 
          TO_DATE(date_of_birth, 'YYYY-MM-DD') >= TO_DATE($${paramIndex++}, 'YYYY-MM-DD')
        ELSE 
          TO_DATE(date_of_birth, 'DD/MM/YYYY') >= TO_DATE($${paramIndex++}, 'YYYY-MM-DD')
      END
    `);
    params.push(filters.dateFrom, filters.dateFrom);
  }

  if (filters.dateTo) {
    conditions.push(`
      CASE 
        WHEN date_of_birth ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN 
          TO_DATE(date_of_birth, 'YYYY-MM-DD') <= TO_DATE($${paramIndex++}, 'YYYY-MM-DD')
        ELSE 
          TO_DATE(date_of_birth, 'DD/MM/YYYY') <= TO_DATE($${paramIndex++}, 'YYYY-MM-DD')
      END
    `);
    params.push(filters.dateTo, filters.dateTo);
  }

  // Add WHERE clause if there are conditions
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  // Add ordering
  query += ' ORDER BY id';

  const res = await pool.query(query, params);
  return res.rows;
};

const addEntity = async (type, date_of_birth, eye_color) => {
  const res = await pool.query(
    'INSERT INTO public.entities (type, date_of_birth, eye_color) VALUES ($1, $2, $3) RETURNING *',
    [type, date_of_birth, eye_color]
  );
  return res.rows[0];
};

const updateEntity = async (id, type, date_of_birth, eye_color) => {
  const res = await pool.query(
    `UPDATE public.entities
     SET type = COALESCE($2, type), date_of_birth = COALESCE($3, date_of_birth), eye_color = COALESCE($4, eye_color)
     WHERE id = $1
     RETURNING *`,
    [id, type, date_of_birth, eye_color]
  );
  return res.rows[0];
};

async function deleteEntity(id) {
  const res = await pool.query(
    'DELETE FROM public.entities WHERE id = $1 RETURNING *',
    [id]
  );
  return res.rows[0];
}

module.exports = {
  getAllEntities,
  addEntity,
  updateEntity,
  deleteEntity,
};
