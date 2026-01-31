import { Client } from 'pg';

export async function ensureDatabaseExists(dbName: string) {

  const client = new Client({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT ?? '5432'),
    database: 'postgres', // connect to default db first
  });

  await client.connect();

  const res = await client.query(`SELECT 1 FROM pg_database WHERE datname='${dbName}'`);
  if (res.rowCount === 0) {
    console.log(`Database "${dbName}" does not exist. Creating...`);
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Database "${dbName}" created.`);
  } else {
    console.log(`Database "${dbName}" already exists.`);
  }

  await client.end();
}
