import { google } from "googleapis";
import dotenv from "dotenv";
import http from "http";
import { URL } from "url";

dotenv.config();

console.log("=== OAuth Setup Starting ===");

console.log("CLIENT ID:", process.env.GOOGLE_OAUTH_CLIENT_ID ? "FOUND" : "MISSING");
console.log("CLIENT SECRET:", process.env.GOOGLE_OAUTH_CLIENT_SECRET ? "FOUND" : "MISSING");
console.log("REDIRECT URI:", process.env.GOOGLE_OAUTH_REDIRECT_URI || "MISSING");

if (
  !process.env.GOOGLE_OAUTH_CLIENT_ID ||
  !process.env.GOOGLE_OAUTH_CLIENT_SECRET ||
  !process.env.GOOGLE_OAUTH_REDIRECT_URI
) {
  console.error("\n❌ OAuth environment variables are missing.");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  process.env.GOOGLE_OAUTH_REDIRECT_URI
);

const scopes = [
  "https://www.googleapis.com/auth/drive",
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: scopes,
});

console.log("\n======================================");
console.log("OPEN THIS URL IN YOUR BROWSER:");
console.log("======================================\n");

console.log(authUrl);

console.log("\n======================================");
console.log("Waiting for Google authorization...");
console.log("======================================\n");

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(
      req.url,
      "https://mahaveer-pawn-broker-c32n.vercel.app"
    );

    console.log("Callback received:", url.pathname);

    if (url.pathname !== "/oauth2callback") {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const code = url.searchParams.get("code");

    if (!code) {
      res.writeHead(400);
      res.end("Authorization code missing.");
      return;
    }

    console.log("Authorization code received.");
    console.log("Getting tokens...");

    const { tokens } = await oauth2Client.getToken(code);

    console.log("\n======================================");
    console.log("✅ OAUTH AUTHORIZATION SUCCESSFUL");
    console.log("======================================\n");

    console.log("REFRESH TOKEN:\n");
    console.log(tokens.refresh_token);

    console.log("\nAdd this to your .env file:\n");
    console.log(
      `GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`
    );

    res.writeHead(200, {
      "Content-Type": "text/html",
    });

    res.end(`
      <html>
        <body>
          <h2>Google Drive authorization successful!</h2>
          <p>You can close this window and return to VS Code.</p>
        </body>
      </html>
    `);

    server.close();

  } catch (error) {
    console.error("\n❌ OAuth setup error:");
    console.error(error);

    res.writeHead(500);
    res.end("OAuth authorization failed.");

    server.close();
  }
});

server.listen(5000, () => {
  console.log(
    "OAuth callback server running on https://mahaveer-pawn-broker-c32n.vercel.app"
  );
});