import { NextApiRequest, NextApiResponse } from "next";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!); // Add to .env.local

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { to, subject, text } = req.body;

  const msg = {
    to,
    from: "riyaz.skk1@gmail.com", // Replace with your verified sender email
    subject,
    text,
  };

  try {
    await sgMail.send(msg);
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
}