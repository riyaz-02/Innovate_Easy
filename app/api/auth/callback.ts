import { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, state } = req.query;
  const { projectId } = JSON.parse(state as string);

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    res.redirect(`/dashboard/projects/${projectId}?tab=reminder&tokens=${encodeURIComponent(JSON.stringify(tokens))}`);
  } catch (error) {
    console.error("Error in OAuth callback:", error);
    res.status(500).json({ error: "Failed to authenticate with Google" });
  }
}