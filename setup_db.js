const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = "postgres://postgres.gkoqywabczvcxfbxhmif:Supabase%404321@aws-0-ap-south-1.pooler.supabase.com:6543/postgres";
const alternativeConnectionString = "postgres://postgres:Supabase%404321@db.gkoqywabczvcxfbxhmif.supabase.co:5432/postgres";

async function run() {
  const schemaStr = fs.readFileSync(path.join(__dirname, 'supabase', 'schema.sql'), 'utf-8');
  let client;
  let successDirect = false;
  
  try {
    console.log("Trying direct db connection: ", alternativeConnectionString);
    client = new Client({ connectionString: alternativeConnectionString });
    await client.connect();
    console.log("Connected to db directly.");
    successDirect = true;
  } catch (e) {
    console.log("Direct failed: ", e.message);
  }

  if (!successDirect) {
    try {
      console.log("Trying pooler db connection: ", connectionString);
      client = new Client({ connectionString });
      await client.connect();
      console.log("Connected to pooler.");
    } catch (e) {
      console.log("Pooler failed: ", e.message);
      return;
    }
  }

  try {
    await client.query(schemaStr);
    console.log('Schema applied successfully.');
  } catch (err) {
    console.error('Error applying schema:', err);
  } finally {
    await client.end();
  }
}

run();
