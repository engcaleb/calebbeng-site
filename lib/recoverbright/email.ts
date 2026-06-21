import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const NOTIFY_EMAIL = "calebeng21@gmail.com";

export async function notifyNewSignup({
  practiceName,
  doctorName,
  email,
}: {
  practiceName: string;
  doctorName: string;
  email: string;
}) {
  try {
    await resend.emails.send({
      from: "RecoverBright <onboarding@resend.dev>",
      to: NOTIFY_EMAIL,
      subject: `New signup: ${practiceName}`,
      html: `
        <h2>New doctor signed up on RecoverBright</h2>
        <p><strong>Practice:</strong> ${practiceName}</p>
        <p><strong>Doctor:</strong> ${doctorName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><a href="https://recoverbright.com/admin/products">Go to admin →</a></p>
      `,
    });
  } catch {
    console.error("Failed to send signup notification email");
  }
}
