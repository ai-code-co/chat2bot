import dotenv from "dotenv"
dotenv.config()

import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.POSTGRES_STRING
})

console.log("connection string:", process.env.POSTGRES_STRING)

// Create table

// ---Users---
export default async function createUsersTable() {
  console.log('---Database Connected---')
  await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(50) UNIQUE NOT NULL,   
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);
  console.log("users table ensured.")
}

// ---SESSIONS---
export async function createSessionTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255) UNIQUE NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      title VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    );
  `)
  console.log('session table ensured.')
}

// --- Messages---
export async function createMessagesTable() {

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      session_ref VARCHAR(255) NOT NULL,
      role VARCHAR(255) NOT NULL,
      message_id VARCHAR(255),
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (session_ref) REFERENCES sessions(session_id)
    );
  `);

  console.log('Users table ensured.')
}

// ---Memory---
export async function createMemoryTable() {

  await pool.query(`
    CREATE TABLE IF NOT EXISTS memory (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL UNIQUE,
      summarize_text TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    );
  `);

  console.log('Memory table ensured.');
}

export async function migrateMemoryTableAddExtractedFacts() {
  await pool.query(`
    ALTER TABLE memory
    ADD COLUMN IF NOT EXISTS extracted_facts TEXT DEFAULT '';
  `);

  console.log("Memory table migrated.");
}

//---FUNCTIONS

//
export async function updateResponseId({ responseId }: { responseId: string }) {
  try {
    const query = `
      SELECT created_at FROM messages
      WHERE message_id = $1
    `;
    const createdAtResult = await pool.query(query, [responseId]);


    if (createdAtResult.rows.length === 0) {
      console.log("No record found with this message_id");
      return;
    }

    const createdAtValue = createdAtResult.rows[0].created_at;


    const query2 = `
      DELETE FROM messages
      WHERE created_at >= $1
    `;
    const result = await pool.query(query2, [createdAtValue]);

    console.log("Deleted rows:", result.rowCount);
  } catch (error) {
    console.log("error while updating db", error);
  }
}


// Fetch last 10 messages
export async function getLastMessages({ sessionId }: { sessionId: string }) {
  try {
    const query = `
      SELECT id, role, content
      FROM (
        SELECT id, role, content
        FROM messages
        WHERE session_ref = $1
        ORDER BY id DESC
        LIMIT 10
      ) AS recent_messages
      ORDER BY id ASC;
    `;

    const result = await pool.query(query, [sessionId])
    console.log("Last 10 messages(from db)-->", result.rows)
    return result.rows

  } catch (error) {
    console.error('Error during fetching messages', error);
  }
}

// fetch all messages of that user --return as string messages
export async function allUserMessages({ userId, sessionId }: { userId: string, sessionId: string }) {
  try {
    const query = `
        SELECT * FROM messages
        WHERE user_id =$1 AND session_ref=$2
        ORDER BY created_at ASC;
        `
    const result = await pool.query(query, [userId, sessionId])
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

export async function allUserMessages2({ sessionId }: { sessionId: string }) {
  try {
    const query = `
        SELECT * FROM messages
        WHERE session_ref=$1
        ORDER BY created_at ASC;
        `
    const result = await pool.query(query, [sessionId])

    let messages = [];
    for (let rows of result.rows) {
      messages.push({ role: rows.role, content: rows.content, messageId: rows.message_id })
    }

    return messages;
  }
  catch (error) {
    console.log('Error during fetching all user messages', error)
  }
}

export async function allUserSessions({ userId, userInput }: { userId: string, userInput: string }) {
  try {
    const query = `
        SELECT 
          s.session_id,
          s.user_id,
          s.title,
          s.created_at,
          s.is_saved,
          m.content AS last_message 
          FROM sessions s
        LEFT JOIN LATERAL (
          SELECT content
          FROM messages
          WHERE session_ref = s.session_id
          ORDER BY created_at DESC
          LIMIT 1
        ) m ON TRUE
       WHERE s.user_id = $1
       AND s.title ILIKE $2
       ORDER BY s.created_at DESC;
    `
    const searchTerm = `%${userInput}%`
    const result = await pool.query(query, [userId, searchTerm])
    let messages = []
    for (let rows of result.rows) {
      messages.push({
        sessionId: rows.session_id,
        userId: rows.user_id,
        title: rows.title,
        createdAt: rows.created_at,
        lastMessage: rows.last_message,
        isSaved: rows.is_saved
      })
    }
    return messages;
  }
  catch (error) {
    console.log('Error during fetching all user sessions', error)
  }
}

export interface savedMessagesProps {
  userId: string,
  sessionId: string;
  role: string;
  content: string;
  messageId?: string;
}

// Store message
export async function storeMessages({ userId, sessionId, role, content, messageId }: savedMessagesProps) {
  try {
    const storeQuery = `
      INSERT INTO messages (user_id,session_ref, role, content,message_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const values = [userId, sessionId, role, content, messageId || ""];
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
  } catch (error) {
    console.log('Error during storing the summarized message', error)
  }
}

// store session id
export async function storeSessionId({ sessionId, userId, title }: { sessionId: string, userId: string, title: string }) {
  try {
    const storeQuery = `
    INSERT INTO sessions(session_id,user_id,title)
    VALUES ($1 , $2, $3)
    ON CONFLICT (session_id) DO NOTHING
    RETURNING *;
    `
    const values = [sessionId, userId, title]
    const result = await pool.query(storeQuery, values)
  }
  catch (error) {
    console.log("Error during storing the session", error)
  }
}

// store user
export async function storeUser({ userId }: { userId: string }) {
  try {
    const storeQuery = `
    INSERT INTO users(user_id)
    VALUES ($1)
    ON CONFLICT (user_id ) DO NOTHING
    RETURNING *;
    `
    const values = [userId]
    const result = await pool.query(storeQuery, values)
  }
  catch (error) {
    console.log("Error during storing the user", error)
  }
}

// get Message Count
export const getMessageCount = async ({
  userId,
  sessionId
}: {
  userId: string,
  sessionId: string
}) => {
  const result = await pool.query(
    `
        SELECT COUNT(*) 
        FROM messages
        WHERE user_id=$1 AND session_ref=$2
        `,
    [userId, sessionId]
  )

  return Number(result.rows[0].count);
}

// get summarize messages 
export const getSummarizeMessages = async ({
  userId
}: {
  userId: string
}) => {

  const result = await pool.query(
    `
        SELECT summarize_text
        FROM memory
        WHERE user_id = $1
        ORDER BY updated_at DESC
        LIMIT 1
        `,
    [userId]
  );

  if (result.rows.length === 0) {
    return ""
  }

  return result.rows[0].summarize_text
}

export const getSession = async (
  sessionId: string
) => {

  const result = await pool.query(
    `
        SELECT *
        FROM sessions
        WHERE session_id = $1
        LIMIT 1
        `,
    [sessionId]
  );


  if (result.rows.length === 0) {
    return null
  }


  return result.rows[0]
}

// to get extracted Facts 
export async function getExtractedFacts(userId: string) {
  const result = await pool.query(
    `
    SELECT extracted_facts
    FROM memory
    WHERE user_id = $1;
    `,
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0].extracted_facts;
}

// to store facts
export async function storeExtractedFacts({
  userId,
  extractedFacts,
}: {
  userId: string;
  extractedFacts: string;
}) {
  await pool.query(
    `
    UPDATE memory
    SET extracted_facts = $1,
        updated_at = NOW()
    WHERE user_id = $2;
    `,
    [extractedFacts, userId]
  );

  console.log("Extracted facts updated.")
}

// Delete session and its messages
export async function deleteSession(sessionId: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN')
    // Delete messages first to satisfy foreign key constraint
    await client.query('DELETE FROM messages WHERE session_ref = $1', [sessionId])
    // Delete session
    const res = await client.query('DELETE FROM sessions WHERE session_id = $1 RETURNING *', [sessionId])
    await client.query('COMMIT');
    return res.rows[0];
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error during deleting session:', error)
    throw error;
  } finally {
    client.release();
  }
}

// Update session title
export async function updateSessionTitle({ sessionId, title }: { sessionId: string; title: string }) {
  try {
    const query = `
      UPDATE sessions
      SET title = $1
      WHERE session_id = $2
      RETURNING *;
    `;
    const result = await pool.query(query, [title, sessionId])
    return result.rows[0];
  } catch (error) {
    console.error('Error during updating session title:', error)
    throw error;
  }
}

// Migrate session table to add is_saved
export async function migrateSessionTableAddIsSaved() {
  await pool.query(`
    ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS is_saved BOOLEAN DEFAULT FALSE;
  `)
  console.log("Session table migrated with is_saved column.")
}

// Toggle session is_saved status
export async function toggleSaveSession(sessionId: string) {
  try {
    const query = `
      UPDATE sessions
      SET is_saved = NOT COALESCE(is_saved, FALSE)
      WHERE session_id = $1
      RETURNING *;
    `;
    const result = await pool.query(query, [sessionId])
    return result.rows[0]
  } catch (error) {
    console.error('Error during toggling session save:', error)
    throw error
  }
}
