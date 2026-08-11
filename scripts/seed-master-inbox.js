// Seed demo OTP emails into incoming_emails for master@feryshop.com.
// Idempotent: skips rows whose (recipient_email, message_id) already exist.
//
// Usage: node --env-file=.env.local scripts/seed-master-inbox.js
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE credentials in environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const RECIPIENT = "master@feryshop.com";
const ACCOUNT_EMAIL = "master@feryshop.com";
const ACCOUNT_DISPLAY_NAME = "Kotak Masuk Master";

// [sender_email, subject, message_id, otp_code, body_snippet, visibility, received_at]
const emails = [
  ["no-reply@moonton.com", "New Sign-in from unrecognized device", "mail-01@moonton.com", "482913", "Dear player, we detected a login attempt from an unrecognized device. Use the verification code below to confirm your sign-in: [OTP]", "buyer", "2026-08-10T06:12:00+07:00"],
  ["noreply@mail.accounts.riotgames.com", "Your Login Code", "mail-02@riotgames.com", "731805", "Verification. Use the security code below to complete your login. Security Code: [OTP]", "buyer", "2026-08-10T05:47:00+07:00"],
  ["noreply@steampowered.com", "Confirmation code", "mail-03@steampowered.com", "209584", "Enter the code [OTP] to confirm your identity. Do not share this code with anyone.", "buyer", "2026-08-09T22:31:00+07:00"],
  ["noreply@hoyoverse.com", "Account Verification", "mail-04@hoyoverse.com", "611427", "Here is your account verification code: [OTP]. Please do not share it with anyone.", "buyer", "2026-08-09T19:05:00+07:00"],
  ["support@vk.com", "Security Alert: New Login", "mail-05@vk.com", "385726", "We noticed a new login. Use this OTP to verify your session: [OTP]. Stay safe!", "buyer", "2026-08-09T11:48:00+07:00"],
  ["noreply@garena.com", "New Sign-in from unrecognized device", "mail-06@garena.com", "902134", "Dear player, we detected a login attempt from an unrecognized device. Use the verification code below: [OTP]", "buyer", "2026-08-08T23:20:00+07:00"],
  ["no-reply@supercell.com", "Your Login Code", "mail-07@supercell.com", "157390", "Use the security code below to complete your login. Security Code: [OTP]", "buyer", "2026-08-08T08:44:00+07:00"],
  ["noreply@epicgames.com", "Confirmation code", "mail-08@epicgames.com", "640281", "Enter the code [OTP] to confirm your identity. Do not share this code with anyone.", "buyer", "2026-08-07T16:02:00+07:00"],
  ["noreply@netease.com", "Account Verification", "mail-09@netease.com", "274915", "Here is your account verification code: [OTP]. Please do not share it with anyone.", "buyer", "2026-08-06T13:27:00+07:00"],
  ["noreply@activision.com", "Security Alert: New Login", "mail-10@activision.com", "819046", "We noticed a new login. Use this OTP to verify your session: [OTP]. Stay safe!", "buyer", "2026-08-06T09:13:00+07:00"],
  ["no-reply@moonton.com", "Your Login Code", "mail-11@moonton.com", "503672", "Use the security code below to complete your login. Security Code: [OTP]", "buyer", "2026-08-05T21:55:00+07:00"],
  ["noreply@mail.accounts.riotgames.com", "Account Verification", "mail-12@riotgames.com", "946218", "Here is your account verification code: [OTP]. Please do not share it with anyone.", "buyer", "2026-08-05T07:36:00+07:00"],
  ["noreply@steampowered.com", "New Sign-in from unrecognized device", "mail-13@steampowered.com", "318725", "Dear player, we detected a login attempt from an unrecognized device. Code: [OTP]", "admin_only", "2026-08-10T03:28:00+07:00"],
  ["noreply@hoyoverse.com", "Confirmation code", "mail-14@hoyoverse.com", "752604", "Enter the code [OTP] to confirm your identity. Do not share this code with anyone.", "admin_only", "2026-08-09T14:50:00+07:00"],
  ["support@vk.com", "Your Login Code", "mail-15@vk.com", "489213", "Use the security code below to complete your login. Security Code: [OTP]", "admin_only", "2026-08-09T06:17:00+07:00"],
  ["noreply@garena.com", "Security Alert: New Login", "mail-16@garena.com", "637590", "We noticed a new login. Use this OTP to verify your session: [OTP]. Stay safe!", "admin_only", "2026-08-08T18:42:00+07:00"],
  ["no-reply@supercell.com", "New Sign-in from unrecognized device", "mail-17@supercell.com", "120486", "Dear player, we detected a login attempt. Use the verification code below: [OTP]", "admin_only", "2026-08-08T05:59:00+07:00"],
  ["noreply@epicgames.com", "Your Login Code", "mail-18@epicgames.com", "873941", "Use the security code below to complete your login. Security Code: [OTP]", "admin_only", "2026-08-07T12:34:00+07:00"],
  ["noreply@netease.com", "Confirmation code", "mail-19@netease.com", "395268", "Enter the code [OTP] to confirm your identity. Do not share this code with anyone.", "admin_only", "2026-08-07T04:21:00+07:00"],
  ["noreply@activision.com", "Account Verification", "mail-20@activision.com", "561734", "Here is your account verification code: [OTP]. Please do not share it with anyone.", "admin_only", "2026-08-06T20:08:00+07:00"],
  ["no-reply@moonton.com", "Security Alert: New Login", "mail-21@moonton.com", "704129", "We noticed a new login. Use this OTP to verify your session: [OTP]. Stay safe!", "admin_only", "2026-08-06T02:55:00+07:00"],
  ["noreply@mail.accounts.riotgames.com", "Your Login Code", "mail-22@riotgames.com", "238457", "Use the security code below to complete your login. Security Code: [OTP]", "admin_only", "2026-08-05T15:41:00+07:00"],
  ["noreply@steampowered.com", "Account Verification", "mail-23@steampowered.com", "986302", "Here is your account verification code: [OTP]. Please do not share it with anyone.", "admin_only", "2026-08-04T10:26:00+07:00"],
  ["noreply@hoyoverse.com", "Security Alert: New Login", "mail-24@hoyoverse.com", "415978", "We noticed a new login. Use this OTP to verify your session: [OTP]. Stay safe!", "admin_only", "2026-08-04T06:33:00+07:00"],
  ["support@vk.com", "Confirmation code", "mail-25@vk.com", "827651", "Enter the code [OTP] to confirm your identity. Do not share this code with anyone.", "admin_only", "2026-08-03T17:09:00+07:00"],
  ["noreply@tencent.com", "New Sign-in from unrecognized device", "mail-26@tencent.com", "145032", "Dear player, we detected a login attempt from an unrecognized device. Use the verification code below to confirm your sign-in: [OTP]", "buyer", "2026-08-10T10:05:00+07:00"],
  ["noreply@blizzard.com", "Your Login Code", "mail-27@blizzard.com", "609274", "Use the security code below to complete your login. Security Code: [OTP]", "buyer", "2026-08-10T09:41:00+07:00"],
  ["no-reply@ea.com", "Account Verification", "mail-28@ea.com", "873516", "Here is your account verification code: [OTP]. Please do not share it with anyone.", "buyer", "2026-08-10T09:18:00+07:00"],
  ["noreply@nintendo.com", "Security Alert: New Login", "mail-29@nintendo.com", "351847", "We noticed a new login. Use this OTP to verify your session: [OTP]. Stay safe!", "admin_only", "2026-08-10T08:52:00+07:00"],
  ["noreply@ubisoft.com", "Confirmation code", "mail-30@ubisoft.com", "782904", "Enter the code [OTP] to confirm your identity. Do not share this code with anyone.", "buyer", "2026-08-10T08:07:00+07:00"],
  ["noreply@capcom.com", "New Sign-in from unrecognized device", "mail-31@capcom.com", "460128", "Dear player, we detected a login attempt from an unrecognized device. Code: [OTP]", "buyer", "2026-08-10T07:33:00+07:00"],
  ["noreply@bandainamco.com", "Your Login Code", "mail-32@bandainamco.com", "293671", "Use the security code below to complete your login. Security Code: [OTP]", "admin_only", "2026-08-10T06:58:00+07:00"],
  ["no-reply@xbox.com", "Account Verification", "mail-33@xbox.com", "518296", "Here is your account verification code: [OTP]. Please do not share it with anyone.", "buyer", "2026-08-10T06:22:00+07:00"],
  ["noreply@playstation.com", "Confirmation code", "mail-34@playstation.com", "647013", "Enter the code [OTP] to confirm your identity. Do not share this code with anyone.", "buyer", "2026-08-10T05:14:00+07:00"],
  ["no-reply@moonton.com", "Security Alert: New Login", "mail-35@moonton.com", "930574", "We noticed a new login. Use this OTP to verify your session: [OTP]. Stay safe!", "buyer", "2026-08-10T04:39:00+07:00"],
  ["noreply@mail.accounts.riotgames.com", "New Sign-in from unrecognized device", "mail-36@riotgames.com", "206819", "Dear player, we detected a login attempt from an unrecognized device. Use the verification code below: [OTP]", "admin_only", "2026-08-10T03:02:00+07:00"],
  ["noreply@steampowered.com", "Your Login Code", "mail-37@steampowered.com", "725460", "Use the security code below to complete your login. Security Code: [OTP]", "buyer", "2026-08-10T02:11:00+07:00"],
  ["noreply@hoyoverse.com", "Account Verification", "mail-38@hoyoverse.com", "418739", "Here is your account verification code: [OTP]. Please do not share it with anyone.", "buyer", "2026-08-09T23:58:00+07:00"],
  ["support@vk.com", "Security Alert: New Login", "mail-39@vk.com", "582047", "We noticed a new login. Use this OTP to verify your session: [OTP]. Stay safe!", "admin_only", "2026-08-09T21:44:00+07:00"],
  ["noreply@garena.com", "Confirmation code", "mail-40@garena.com", "316825", "Enter the code [OTP] to confirm your identity. Do not share this code with anyone.", "buyer", "2026-08-09T18:26:00+07:00"],
  ["no-reply@supercell.com", "New Sign-in from unrecognized device", "mail-41@supercell.com", "894103", "Dear player, we detected a login attempt from an unrecognized device. Use the verification code below: [OTP]", "buyer", "2026-08-09T16:09:00+07:00"],
  ["noreply@epicgames.com", "Your Login Code", "mail-42@epicgames.com", "157386", "Use the security code below to complete your login. Security Code: [OTP]", "buyer", "2026-08-09T13:37:00+07:00"],
  ["noreply@netease.com", "Account Verification", "mail-43@netease.com", "739210", "Here is your account verification code: [OTP]. Please do not share it with anyone.", "admin_only", "2026-08-09T10:52:00+07:00"],
  ["noreply@activision.com", "Confirmation code", "mail-44@activision.com", "462578", "Enter the code [OTP] to confirm your identity. Do not share this code with anyone.", "buyer", "2026-08-09T08:20:00+07:00"],
  ["noreply@tencent.com", "Your Login Code", "mail-45@tencent.com", "680491", "Use the security code below to complete your login. Security Code: [OTP]", "buyer", "2026-08-08T22:41:00+07:00"],
  ["noreply@blizzard.com", "Security Alert: New Login", "mail-46@blizzard.com", "205834", "We noticed a new login. Use this OTP to verify your session: [OTP]. Stay safe!", "admin_only", "2026-08-08T20:18:00+07:00"],
  ["no-reply@ea.com", "New Sign-in from unrecognized device", "mail-47@ea.com", "347691", "Dear player, we detected a login attempt from an unrecognized device. Code: [OTP]", "buyer", "2026-08-08T17:55:00+07:00"],
  ["noreply@nintendo.com", "Confirmation code", "mail-48@nintendo.com", "915267", "Enter the code [OTP] to confirm your identity. Do not share this code with anyone.", "buyer", "2026-08-08T15:32:00+07:00"],
  ["noreply@ubisoft.com", "Account Verification", "mail-49@ubisoft.com", "528340", "Here is your account verification code: [OTP]. Please do not share it with anyone.", "admin_only", "2026-08-08T12:44:00+07:00"],
  ["noreply@capcom.com", "Your Login Code", "mail-50@capcom.com", "764918", "Use the security code below to complete your login. Security Code: [OTP]", "buyer", "2026-08-08T09:26:00+07:00"],
  ["noreply@bandainamco.com", "Security Alert: New Login", "mail-51@bandainamco.com", "103256", "We noticed a new login. Use this OTP to verify your session: [OTP]. Stay safe!", "buyer", "2026-08-08T06:13:00+07:00"],
  ["no-reply@xbox.com", "New Sign-in from unrecognized device", "mail-52@xbox.com", "438579", "Dear player, we detected a login attempt from an unrecognized device. Use the verification code below: [OTP]", "admin_only", "2026-08-07T23:02:00+07:00"],
  ["noreply@playstation.com", "Your Login Code", "mail-53@playstation.com", "802145", "Use the security code below to complete your login. Security Code: [OTP]", "buyer", "2026-08-07T20:36:00+07:00"],
  ["no-reply@moonton.com", "Account Verification", "mail-54@moonton.com", "295874", "Here is your account verification code: [OTP]. Please do not share it with anyone.", "buyer", "2026-08-07T17:24:00+07:00"],
  ["noreply@mail.accounts.riotgames.com", "Confirmation code", "mail-55@riotgames.com", "671203", "Enter the code [OTP] to confirm your identity. Do not share this code with anyone.", "buyer", "2026-08-07T14:47:00+07:00"],
  ["noreply@steampowered.com", "Security Alert: New Login", "mail-56@steampowered.com", "948260", "We noticed a new login. Use this OTP to verify your session: [OTP]. Stay safe!", "admin_only", "2026-08-07T11:30:00+07:00"],
  ["noreply@hoyoverse.com", "New Sign-in from unrecognized device", "mail-57@hoyoverse.com", "325617", "Dear player, we detected a login attempt from an unrecognized device. Use the verification code below: [OTP]", "buyer", "2026-08-07T08:08:00+07:00"],
  ["noreply@garena.com", "Your Login Code", "mail-58@garena.com", "780394", "Use the security code below to complete your login. Security Code: [OTP]", "buyer", "2026-08-07T05:52:00+07:00"],
  ["no-reply@supercell.com", "Confirmation code", "mail-59@supercell.com", "514826", "Enter the code [OTP] to confirm your identity. Do not share this code with anyone.", "admin_only", "2026-08-07T03:36:00+07:00"],
];

async function ensureMasterAccount() {
  const { data: existing } = await supabase
    .from("email_accounts")
    .select("id")
    .eq("email", ACCOUNT_EMAIL)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("email_accounts")
    .insert({ email: ACCOUNT_EMAIL, display_name: ACCOUNT_DISPLAY_NAME, is_active: true })
    .select("id")
    .single();

  if (error) throw error;
  return created.id;
}

async function main() {
  console.log("Seeding master inbox for", RECIPIENT, "...");

  const accountId = await ensureMasterAccount();
  console.log(`Email account id: ${accountId}`);

  let inserted = 0;
  let skipped = 0;

  for (const [senderEmail, subject, messageId, otpCode, rawBodySnippet, visibility, receivedAt] of emails) {
    const { data: dup } = await supabase
      .from("incoming_emails")
      .select("id")
      .eq("recipient_email", RECIPIENT)
      .eq("message_id", messageId)
      .maybeSingle();

    if (dup) {
      skipped += 1;
      continue;
    }

    const { error } = await supabase.from("incoming_emails").insert({
      recipient_email: RECIPIENT,
      sender_email: senderEmail,
      subject,
      message_id: messageId,
      otp_code: otpCode,
      raw_body_snippet: rawBodySnippet,
      category: "login_otp",
      visibility,
      received_at: receivedAt,
      email_account_id: accountId,
    });

    if (error) throw error;
    inserted += 1;
  }

  console.log(`Done. Inserted: ${inserted}, skipped (already present): ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
