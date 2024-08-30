import express from "express";
import { google } from "googleapis";
import dotenv from "dotenv";
import pkg from "pg";

const { Pool } = pkg;

dotenv.config();

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const app = express();

app.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;
  const discordUserId = req.query.state; // The Discord user ID passed in the state parameter
  console.log("Received OAuth callback with code:", code);

  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log("Received tokens from Google:", tokens);

    oauth2Client.setCredentials(tokens);

    // Store tokens in PostgreSQL database
    await storeTokens(discordUserId, tokens);
    console.log("Tokens stored successfully in PostgreSQL");

    res.send("Authorization successful! You can now close this window.");
  } catch (error) {
    console.error("Error retrieving access token:", error);
    res.send("Error during authentication.");
  }
});

app.listen(3000, () => {
  console.log("OAuth callback server running on http://localhost:3000");
});

async function storeTokens(discordUserId, tokens) {
  const { access_token, refresh_token, scope, token_type, expiry_date } =
    tokens;
  const query = `
    INSERT INTO users (discord_user_id, access_token, refresh_token, scope, token_type, expiry_date)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (discord_user_id)
    DO UPDATE SET access_token = $2, refresh_token = $3, scope = $4, token_type = $5, expiry_date = $6
  `;
  const values = [
    discordUserId,
    access_token,
    refresh_token,
    scope,
    token_type,
    expiry_date,
  ];
  await pool.query(query, values);
}
