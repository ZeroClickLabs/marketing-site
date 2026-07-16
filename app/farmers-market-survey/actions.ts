"use server";

import { SignJWT, importPKCS8 } from "jose";

async function getAccessToken(): Promise<string> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!;
  // Strip surrounding quotes if present, then convert literal \n to real newlines
  const privateKey = rawKey
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n");

  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(privateKey, "RS256");

  const jwt = await new SignJWT({
    iss: email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .sign(key);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to get access token: ${res.status} ${body}`);
  }

  const { access_token } = await res.json();
  return access_token;
}

export async function submitSurvey(
  data: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!sheetId || !email || !privateKey) {
    console.error(
      "Missing env vars: GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"
    );
    console.log("Survey response:", JSON.stringify(data, null, 2));
    return {
      success: false,
      error:
        "Survey storage is not configured. Please contact the site administrator.",
    };
  }

  const row = [
    new Date().toISOString(),
    data.town || "",
    data.markets_visited || "",
    data.visit_frequency || "",
    data.wfb_attendance || "",
    data.wfb_rating || "",
    data.wfb_rating_comment || "",
    data.preferred_time || "",
    data.wishlist || "",
    data.csa_interest || "",
    data.email || "",
  ];

  try {
    const accessToken = await getAccessToken();

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A:K:append?valueInputOption=USER_ENTERED`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ values: [row] }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Google Sheets API error:", res.status, body);
      return {
        success: false,
        error: "Failed to save your response. Please try again.",
      };
    }

    return { success: true };
  } catch (err) {
    console.error("Failed to submit to Google Sheets:", err);
    return {
      success: false,
      error: "Failed to save your response. Please try again.",
    };
  }
}
