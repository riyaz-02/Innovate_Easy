import { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const url = oauth2Client.generateAuthUrl({
      scope: ["https://www.googleapis.com/auth/calendar.events"],
      state: JSON.stringify({ projectId: req.query.projectId }),
    });
    res.redirect(url);
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}