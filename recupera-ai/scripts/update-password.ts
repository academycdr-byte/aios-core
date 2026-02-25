/**
 * Script to update user password to bcrypt hash
 * Run: npx tsx scripts/update-password.ts
 */

import 'dotenv/config'
import { hash } from 'bcryptjs'
import pg from 'pg'

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

  const email = 'ivan@cdrgroup.com.br'
  const password = 'admin123'
  const hashedPassword = await hash(password, 12)

  // Check if user exists
  const existing = await pool.query('SELECT id, email FROM users WHERE email = $1', [email])

  if (existing.rows.length > 0) {
    // Update password
    await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email])
    console.log(`Updated password for ${email} (id: ${existing.rows[0].id})`)
  } else {
    // Create user
    const result = await pool.query(
      'INSERT INTO users (id, email, name, password, created_at, updated_at) VALUES (gen_random_uuid()::text, $1, $2, $3, NOW(), NOW()) RETURNING id',
      [email, 'Ivan Furtado', hashedPassword]
    )
    console.log(`Created user ${email} (id: ${result.rows[0].id})`)
  }

  await pool.end()
}

main().catch(console.error)
