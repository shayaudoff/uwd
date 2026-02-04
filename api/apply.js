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
  const location = pickFirst(payload, ["location", "cityState", "city_state"]);
  const roleInterest = pickFirst(payload, ["roleInterest", "role", "position"]);
  const experienceLevel = pickFirst(payload, ["experienceLevel", "level"]);
  const yearsExperience = pickFirst(payload, ["yearsExperience", "years", "experienceYears"]);
  const schooling = pickFirst(payload, ["schooling", "education"]);
  const selfTaught = pickFirst(payload, ["selfTaught", "courses", "self_taught"]);
  const systemsExperience = pickFirst(payload, ["systemsExperience", "webSystemsExperience", "systems"]);
  const portfolioLinks = pickFirst(payload, ["portfolioLinks", "portfolio", "links"]);
  const biggestProject = pickFirst(payload, ["biggestProject", "project", "projectShipped"]);
  const availability = pickFirst(payload, ["availability", "startDate", "start"]);
  const employmentType = pickFirst(payload, ["employmentType", "employment", "schedule"]);
  const workType = pickList(payload, ["workType", "work_type", "workMode"]);
  const consent = pickFirst(payload, ["consent", "confirmed", "confirmation"]);

  if (!name || name.length < 2) {
    return json(res, 400, { ok: false, error: "Name is required" });
  }
  if (!email || !isValidEmail(email)) {
    return json(res, 400, { ok: false, error: "Valid email is required" });
  }
  if (!phone || phone.replace(/[\s\-().+]/g, "").length < 7) {
    return json(res, 400, { ok: false, error: "Valid phone is required" });
  }
  if (!location) {
    return json(res, 400, { ok: false, error: "Location is required" });
  }
  if (!roleInterest) {
    return json(res, 400, { ok: false, error: "Role interest is required" });
  }
  if (!experienceLevel) {
    return json(res, 400, { ok: false, error: "Experience level is required" });
  }

  const yearsValue = Number.parseFloat(yearsExperience);
  if (!Number.isFinite(yearsValue) || yearsValue < 0) {
    return json(res, 400, { ok: false, error: "Years of experience is required" });
  }

  if (!schooling) {
    return json(res, 400, { ok: false, error: "Schooling is required" });
  }
  if (!selfTaught || selfTaught.length < 10 || selfTaught.length > 5000) {
    return json(res, 400, { ok: false, error: "Self-taught/courses details are required" });
  }
  if (!systemsExperience || systemsExperience.length < 20 || systemsExperience.length > 5000) {
    return json(res, 400, { ok: false, error: "Web systems experience is required" });
  }
  if (!portfolioLinks || portfolioLinks.length < 6 || portfolioLinks.length > 5000) {
    return json(res, 400, { ok: false, error: "Portfolio links are required" });
  }
  if (!biggestProject || biggestProject.length < 20 || biggestProject.length > 5000) {
    return json(res, 400, { ok: false, error: "Biggest shipped project details are required" });
  }
  if (!availability) {
    return json(res, 400, { ok: false, error: "Availability is required" });
  }
  if (!employmentType) {
    return json(res, 400, { ok: false, error: "Employment type is required" });
  }
  if (!workType.length) {
    return json(res, 400, { ok: false, error: "Work type is required" });
  }
  if (consent.toLowerCase() !== "yes") {
    return json(res, 400, { ok: false, error: "Consent is required" });
  }

  const to = (process.env.TO_APPLY || process.env.TO_CONTACT || "").trim();
  if (!to) {
    return json(res, 500, { ok: false, error: "Send failed" });
  }

  const textBody = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Location: ${location}`,
    `Role Interest: ${roleInterest}`,
    `Experience Level: ${experienceLevel}`,
    `Years of Experience: ${yearsExperience}`,
    `Availability: ${availability}`,
    `Employment Type: ${employmentType}`,
    `Work Type: ${listText(workType)}`,
    `Consent Confirmed: Yes`,
    "",
    "Schooling:",
    schooling,
    "",
    "Self-taught / courses:",
    selfTaught,
    "",
    "Web systems experience:",
    systemsExperience,
    "",
    "Portfolio links:",
    portfolioLinks,
    "",
    "Biggest project shipped:",
    biggestProject
  ].join("\n");

  try {
    const transporter = getTransporter();

    await transporter.sendMail({
      from: formatFrom(),
      to,
      replyTo: email,
      subject: `New Job Application: ${name} — ${roleInterest}`,
      text: textBody
    });

    if (wantsAutoReply()) {
      await transporter.sendMail({
        from: formatFrom(),
        to: email,
        subject: "We received your application",
        text: `Hi ${name},\n\nThanks for applying to Udoff Web Development. We received your application and will review it shortly.\n\n- Udoff Web Development`
      });
    }

    return json(res, 200, { ok: true });
  } catch (_error) {
    return json(res, 500, { ok: false, error: "Send failed" });
  }
};
