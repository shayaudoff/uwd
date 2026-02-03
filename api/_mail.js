"use strict";

const nodemailer = require("nodemailer");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asTrimmed(value) {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number") {
    return String(value).trim();
  }
  return "";
}

function pickFirst(payload, keys) {
  for (const key of keys) {
    if (!(key in payload)) {
      continue;
    }
    const value = payload[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        const cleaned = asTrimmed(item);
        if (cleaned) {
          return cleaned;
        }
      }
      continue;
    }
    const cleaned = asTrimmed(value);
    if (cleaned) {
      return cleaned;
    }
  }
  return "";
}

function pickList(payload, keys) {
  const result = [];
  for (const key of keys) {
    if (!(key in payload)) {
      continue;
    }
    const value = payload[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        const cleaned = asTrimmed(item);
        if (cleaned) {
          result.push(cleaned);
        }
      }
      continue;
    }
    if (typeof value === "string") {
      const parts = value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
      result.push(...parts);
    } else {
      const cleaned = asTrimmed(value);
      if (cleaned) {
        result.push(cleaned);
      }
    }
  }
  return [...new Set(result)];
}

function listText(values) {
  return values.length ? values.join(", ") : "Not provided";
}

function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

function formatFrom() {
  const fromName = asTrimmed(process.env.FROM_NAME) || "Website";
  const smtpUser = asTrimmed(process.env.SMTP_USER);
  if (!smtpUser) {
    throw new Error("SMTP_USER missing");
  }
  return `${fromName} <${smtpUser}>`;
}

function getTransporter() {
  const host = asTrimmed(process.env.SMTP_HOST);
  const port = Number.parseInt(asTrimmed(process.env.SMTP_PORT) || "465", 10);
  const secure = asTrimmed(process.env.SMTP_SECURE).toLowerCase() === "true";
  const user = asTrimmed(process.env.SMTP_USER);
  const pass = process.env.SMTP_PASS;

  if (!host || !Number.isFinite(port) || !user || !pass) {
    throw new Error("SMTP config missing");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
}

async function parseJsonBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === "string") {
    return req.body ? JSON.parse(req.body) : {};
  }
  if (Buffer.isBuffer(req.body)) {
    const text = req.body.toString("utf8");
    return text ? JSON.parse(text) : {};
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function wantsAutoReply() {
  return asTrimmed(process.env.AUTO_REPLY_ENABLED).toLowerCase() === "true";
}

function json(res, statusCode, payload) {
  res.status(statusCode).json(payload);
}

module.exports = {
  formatFrom,
  getTransporter,
  isValidEmail,
  json,
  listText,
  parseJsonBody,
  pickFirst,
  pickList,
  wantsAutoReply
};
