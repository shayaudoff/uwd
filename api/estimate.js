"use strict";

const {
  formatFrom,
  getTransporter,
  isValidEmail,
  json,
  listText,
  parseJsonBody,
  pickFirst,
  pickList,
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
  const budget = pickFirst(payload, ["budget", "budget_range", "price_range"]);
  const timeline = pickFirst(payload, ["timeline", "timeframe"]);

  const primaryDetails = pickFirst(payload, [
    "details",
    "message",
    "notes",
    "description",
    "microDesc"
  ]);
  if (primaryDetails.length > 5000) {
    return json(res, 400, { ok: false, error: "Message must be 5000 characters or less" });
  }

  if (!name || name.length < 2) {
    return json(res, 400, { ok: false, error: "Name is required" });
  }
  if (!email || !isValidEmail(email)) {
    return json(res, 400, { ok: false, error: "Valid email is required" });
  }

  const services = pickList(payload, ["services", "service", "features", "projectType"]);
  const company = pickFirst(payload, ["company", "organization"]);
  const tier = pickFirst(payload, ["tier"]);
  const contactMethod = pickFirst(payload, ["contactMethod"]);
  const designScope = pickFirst(payload, ["designScope"]);
  const styleDirection = pickFirst(payload, ["styleDirection"]);
  const siteType = pickFirst(payload, ["siteType"]);
  const prodType = pickFirst(payload, ["prodType"]);
  const microType = pickFirst(payload, ["microType"]);
  const compliance = pickList(payload, ["compliance"]);
  const access = pickList(payload, ["access"]);
  const source = pickFirst(payload, ["source"]);

  const subject = budget ? `New Estimate: ${name} — ${budget}` : `New Estimate: ${name}`;
  const to = (process.env.TO_ESTIMATES || "").trim();
  if (!to) {
    return json(res, 500, { ok: false, error: "Send failed" });
  }

  const textBody = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || "Not provided"}`,
    `Budget: ${budget || "Not provided"}`,
    `Timeline: ${timeline || "Not provided"}`,
    `Services: ${listText(services)}`,
    `Details: ${primaryDetails || "Not provided"}`,
    "",
    `Company: ${company || "Not provided"}`,
    `Tier: ${tier || "Not provided"}`,
    `Contact Method: ${contactMethod || "Not provided"}`,
    `Design Scope: ${designScope || "Not provided"}`,
    `Style Direction: ${styleDirection || "Not provided"}`,
    `Website Type: ${siteType || "Not provided"}`,
    `Product Type: ${prodType || "Not provided"}`,
    `Micro Service: ${microType || "Not provided"}`,
    `Compliance: ${listText(compliance)}`,
    `Access: ${listText(access)}`,
    `Source: ${source || "Not provided"}`
  ].join("\n");

  try {
    const transporter = getTransporter();

    await transporter.sendMail({
      from: formatFrom(),
      to,
      replyTo: email,
      subject,
      text: textBody
    });

    if (wantsAutoReply()) {
      await transporter.sendMail({
        from: formatFrom(),
        to: email,
        subject: "We received your estimate request",
        text: `Hi ${name},\n\nThanks for requesting an estimate from Udoff Web Development. We received your request and will follow up soon.\n\n- Udoff Web Development`
      });
    }

    return json(res, 200, { ok: true });
  } catch (_error) {
    return json(res, 500, { ok: false, error: "Send failed" });
  }
};
