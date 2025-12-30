import { NextResponse } from "next/server";
import { getDueCards, getStats } from "@/lib/db";
import { generateEmailHTML, generateEmailSubject } from "@/lib/email";
import nodemailer from "nodemailer";

const RECIPIENT = "fe.becker@holzlandbecker.de";

export async function POST() {
  try {
    // Check if it's a weekday (1=Mon, 5=Fri)
    const weekday = new Date().getDay();
    if (weekday === 0 || weekday === 6) {
      return NextResponse.json({
        success: false,
        message: "Skipped - weekend"
      });
    }

    const dueCards = getDueCards();
    const stats = getStats();

    // Skip if no cards due
    if (dueCards.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No cards due - skipped"
      });
    }

    const html = generateEmailHTML({ dueCards, stats });
    const subject = generateEmailSubject(dueCards.length);

    // Get SMTP credentials from environment
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      return NextResponse.json(
        { error: "SMTP credentials not configured" },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: smtpUser,
      to: RECIPIENT,
      subject: subject,
      html: html,
    });

    return NextResponse.json({
      success: true,
      message: `Email sent to ${RECIPIENT}`,
      cardsDue: dueCards.length
    });

  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

// Also allow GET for easy testing
export async function GET() {
  return POST();
}
