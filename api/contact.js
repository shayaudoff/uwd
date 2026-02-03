"use strict";

const {
  formatFrom,
  getTransporter,
  isValidEmail,
  json,
  parseJsonBody,
  pickFirst,
  wantsAutoReply
} = require("./_mail");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { ok: false, error: "Method not allowed" });
  }

  let payload;
  try {
    payload = await parseJsonBody(req);
  } catch (_error) {
    return json(res, 400, { ok: false, error: "Invalid JSON body" });
  }

  const name = pickFirst(payload, ["name", "fullName", "full_name"]);
  const email = pickFirst(payload, ["email", "mail", "reply_to"]);
  const phone = pickFirst(payload, ["phone", "phoneNumber", "telephone"]);
  const message = pickFirst(payload, ["message", "details", "notes", "description"]);

  if (!name || name.length < 2) {
    return json(res, 400, { ok: false, error: "Name is required" });
  }
  if (!email || !isValidEmail(email)) {
    return json(res, 400, { ok: false, error: "Valid email is required" });
  }
  if (!message) {
    return json(res, 400, { ok: false, error: "Message is required" });
  }
  if (message.length > 5000) {
    return json(res, 400, { ok: false, error: "Message must be 5000 characters or less" });
  }

  const company = pickFirst(payload, ["company", "organization"]);
  const projectType = pickFirst(payload, ["projectType", "project_type", "service"]);
  const budget = pickFirst(payload, ["budget", "budget_range"]);
  const timeline = pickFirst(payload, ["timeline"]);

  const to = (process.env.TO_CONTACT || "").trim();
  if (!to) {
    return json(res, 500, { ok: false, error: "Send failed" });
  }

  const textBody = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || "Not provided"}`,
    `Message:`,
    message,
    "",
    `Company: ${company || "Not provided"}`,
    `Project Type: ${projectType || "Not provided"}`,
    `Budget: ${budget || "Not provided"}`,
    `Timeline: ${timeline || "Not provided"}`
  ].join("\n");

  try {
    const transporter = getTransporter();

    await transporter.sendMail({
      from: formatFrom(),
      to,
      replyTo: email,
      subject: `New Contact: ${name}`,
      text: textBody
    });

    if (wantsAutoReply()) {
      await transporter.sendMail({
        from: formatFrom(),
        to: email,
        subject: "We received your message",
        text: `Hi ${name},\n\nThanks for contacting Udoff Web Development. We received your message and will reply soon.\n\n- Udoff Web Development`
      });
    }

    return json(res, 200, { ok: true });
  } catch (_error) {
    return json(res, 500, { ok: false, error: "Send failed" });
  }
};
