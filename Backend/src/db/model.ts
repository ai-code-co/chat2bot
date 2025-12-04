import { Pool } from 'pg'

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_F4xMfJBvY5yc@ep-shiny-frog-a4r33kd8-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
})

console.log("connection string:", process.env.POSTGRES_STRING)

// Create table

// --- USERS---
export default async function createUserTable() {
    console.log('---Database Connected---')

    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      role VARCHAR(255) NOT NULL,
      content TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

    console.log('Users table ensured.')
}


export async function createMemoryTable() {
    //FOREIGN KEY (user_id) REFERENCES  users(user_id)
    await pool.query(`
    CREATE TABLE IF NOT EXISTS memory (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL UNIQUE,
      summarize_text TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

    console.log('Memory table ensured.');
}

// Fetch last 10 messages
export async function getLastMessages({ userId }: { userId: string }) {
    try {
        const query = `
      SELECT * FROM users
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `;

        const result = await pool.query(query, [userId])
        console.log("Last 10 messages(from db)-->", result.rows)
        return result.rows

    } catch (error) {
        console.error('Error during fetching messages', error);
    }
}

// fetch all messages of that user
export async function allUserMessages({ userId }: { userId: string }) {
    try {
        const query = `
        SELECT * FROM users
        WHERE user_id =$1
        ORDER BY created_at ASC;
        `
        const result = await pool.query(query, [userId])
        // return result.rows

        let messages = '';
        for (let rows of result.rows) {
            if (rows.role == 'user') {
                messages += rows.content + "\n"
            }
        }
        return messages;
    }
    catch (error) {
        console.log('Error during fetching all user messages', error)
    }
}

export interface savedMessagesProps {
    userId: string;
    role: string;
    content: string;
}

// Store message
export async function storeMessages({ userId, role, content }: savedMessagesProps) {
    try {
        const storeQuery = `
      INSERT INTO users (user_id, role, content)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

        const values = [userId, role, content];
        const result = await pool.query(storeQuery, values)

        console.log('Inserted message:', result.rows[0])
    } catch (error) {
        console.log('Error during storing the message', error)
    }
}

export interface summarizeMessagesProps {
    userId: string,
    summarizeText: string
}

// store summarize test
export async function storeSummarizeMessages({ userId, summarizeText }: summarizeMessagesProps) {
    try {
        const storeQuery = `
        INSERT INTO memory (user_id, summarize_text, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
        summarize_text = EXCLUDED.summarize_text,
        updated_at = NOW()
        RETURNING *;
        `;

        const values = [userId, summarizeText]
        const result = await pool.query(storeQuery, values)
        console.log('Inserted summarized-message:', result.rows[0])
    } catch (error) {
        console.log('Error during storing the summarized message', error)
    }
}
