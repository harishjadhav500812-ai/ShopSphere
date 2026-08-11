package com.shopsphere.verification.service;

/**
 * Builds the HTML (and plain-text fallback) body for verification and password reset emails.
 */
public final class VerificationEmailTemplate {

    private VerificationEmailTemplate() {
    }

    public static String buildOtpHtml(String fullName, String code, long ttlMinutes) {
        String safeName = escape(fullName);
        String safeCode = escape(code);

        return """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <title>Verify your ShopSphere account</title>
                </head>
                <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.08);">

                          <!-- Header -->
                          <tr>
                            <td style="background:linear-gradient(135deg,#0f172a,#134e4a);padding:32px 40px;text-align:center;">
                              <div style="width:52px;height:52px;background:linear-gradient(135deg,#0d9488,#0f766e);border-radius:14px;display:inline-block;line-height:52px;font-size:24px;color:#ffffff;font-weight:700;">S</div>
                              <div style="font-size:22px;font-weight:800;color:#ffffff;margin-top:14px;letter-spacing:-0.01em;">ShopSphere</div>
                            </td>
                          </tr>

                          <!-- Body -->
                          <tr>
                            <td style="padding:36px 40px 16px 40px;text-align:center;">
                              <h1 style="margin:0 0 12px 0;font-size:20px;font-weight:800;color:#111827;">Verify your email address</h1>
                              <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#4b5563;">
                                Hi %s, welcome to ShopSphere! Use the verification code below to complete your registration:
                              </p>

                              <!-- OTP Code Box -->
                              <div style="background:#f0fdfa;border:2px dashed #0d9488;border-radius:12px;padding:16px 24px;display:inline-block;margin-bottom:24px;">
                                <div style="font-family:monospace;font-size:32px;font-weight:900;letter-spacing:0.35em;color:#0d9488;padding-left:0.35em;">%s</div>
                              </div>

                              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">
                                This code expires in <strong>%d minutes</strong>.
                              </p>
                            </td>
                          </tr>

                          <!-- Security Note -->
                          <tr>
                            <td style="padding:16px 40px 32px 40px;text-align:center;">
                              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                                If you did not create a ShopSphere account, you can safely ignore this email.
                              </p>
                            </td>
                          </tr>

                          <!-- Footer -->
                          <tr>
                            <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
                              <p style="margin:0;font-size:12px;color:#9ca3af;">&copy; ShopSphere &middot; This is an automated message, please do not reply.</p>
                            </td>
                          </tr>

                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(safeName, safeCode, ttlMinutes);
    }

    public static String buildOtpText(String fullName, String code, long ttlMinutes) {
        return """
                ShopSphere

                Verify your email

                Hi %s,

                Welcome to ShopSphere! Use this verification code to complete your registration:

                    %s

                This code expires in %d minutes.

                If you did not create a ShopSphere account, you can safely ignore this email.

                The ShopSphere Team
                """.formatted(fullName, code, ttlMinutes);
    }

    public static String buildPasswordResetHtml(String fullName, String code, long ttlMinutes) {
        String safeName = escape(fullName);
        String safeCode = escape(code);

        return """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <title>Reset your ShopSphere password</title>
                </head>
                <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.08);">

                          <!-- Header -->
                          <tr>
                            <td style="background:linear-gradient(135deg,#0f172a,#134e4a);padding:32px 40px;text-align:center;">
                              <div style="width:52px;height:52px;background:linear-gradient(135deg,#0d9488,#0f766e);border-radius:14px;display:inline-block;line-height:52px;font-size:24px;color:#ffffff;font-weight:700;">S</div>
                              <div style="font-size:22px;font-weight:800;color:#ffffff;margin-top:14px;letter-spacing:-0.01em;">ShopSphere</div>
                            </td>
                          </tr>

                          <!-- Body -->
                          <tr>
                            <td style="padding:36px 40px 16px 40px;text-align:center;">
                              <h1 style="margin:0 0 12px 0;font-size:20px;font-weight:800;color:#111827;">Reset your password</h1>
                              <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#4b5563;">
                                Hi %s, we received a request to reset your ShopSphere password. Use the verification code below to set a new password:
                              </p>

                              <!-- Reset Code Box -->
                              <div style="background:#f0fdfa;border:2px dashed #0d9488;border-radius:12px;padding:16px 24px;display:inline-block;margin-bottom:24px;">
                                <div style="font-family:monospace;font-size:32px;font-weight:900;letter-spacing:0.35em;color:#0d9488;padding-left:0.35em;">%s</div>
                              </div>

                              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">
                                This code expires in <strong>%d minutes</strong>.
                              </p>
                            </td>
                          </tr>

                          <!-- Security Warning -->
                          <tr>
                            <td style="padding:16px 40px 32px 40px;text-align:center;">
                              <p style="margin:0;font-size:12px;color:#dc2626;line-height:1.6;font-weight:600;">
                                If you did not request a password reset, please ignore this email or contact support if you suspect unauthorized access.
                              </p>
                            </td>
                          </tr>

                          <!-- Footer -->
                          <tr>
                            <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
                              <p style="margin:0;font-size:12px;color:#9ca3af;">&copy; ShopSphere &middot; This is an automated message, please do not reply.</p>
                            </td>
                          </tr>

                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(safeName, safeCode, ttlMinutes);
    }

    public static String buildPasswordResetText(String fullName, String code, long ttlMinutes) {
        return """
                ShopSphere

                Password Reset Request

                Hi %s,

                We received a request to reset your ShopSphere account password.
                Use the verification code below to complete your password reset:

                    %s

                This code expires in %d minutes.

                If you did not request a password reset, you can safely ignore this email.

                The ShopSphere Team
                """.formatted(fullName, code, ttlMinutes);
    }

    private static String escape(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
