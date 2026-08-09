package com.shopsphere.verification.service;

/**
 * Builds the HTML (and plain-text fallback) body for the verification email.
 * Pure templating \u2014 no I/O, no SMTP, no persistence.
 */
final class VerificationEmailTemplate {

    private VerificationEmailTemplate() {
    }

    static String buildHtml(String fullName, String verificationLink, long ttlMinutes, String welcomeCouponCode, int welcomeCouponPercentage) {
        String safeName = escape(fullName);
        String couponBlock = welcomeCouponCode == null ? "" : """
                <tr>
                  <td style="padding: 0 40px 8px 40px;">
                    <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#f0fdfa;border:1.5px dashed #5eead4;border-radius:10px;">
                      <tr>
                        <td style="padding:18px 20px;text-align:center;">
                          <div style="font-size:12px;font-weight:700;color:#0d9488;text-transform:uppercase;letter-spacing:0.06em;">Welcome Gift</div>
                          <div style="font-size:14px;color:#134e4a;margin-top:6px;">Enjoy <strong>%d%% off</strong> your first order with the code below</div>
                          <div style="font-family:monospace;font-size:20px;font-weight:800;letter-spacing:0.12em;color:#0f766e;background:#ccfbf1;border-radius:8px;padding:8px 16px;margin-top:10px;display:inline-block;">%s</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                """.formatted(welcomeCouponPercentage, escape(welcomeCouponCode));

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
                            <td style="padding:36px 40px 8px 40px;">
                              <h1 style="margin:0 0 12px 0;font-size:20px;font-weight:800;color:#111827;">Verify your email address</h1>
                              <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#4b5563;">
                                Hi %s, welcome to ShopSphere! Please confirm this is your email address to activate your account and start shopping.
                              </p>
                            </td>
                          </tr>

                          <!-- Button -->
                          <tr>
                            <td style="padding:0 40px 28px 40px;text-align:center;">
                              <a href="%s" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:9px;box-shadow:0 4px 10px rgba(13,148,136,0.3);">Verify Email</a>
                            </td>
                          </tr>

                          %s

                          <!-- Fallback link -->
                          <tr>
                            <td style="padding:8px 40px 8px 40px;">
                              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                                Button not working? Copy and paste this link into your browser:<br />
                                <a href="%s" style="color:#0d9488;word-break:break-all;">%s</a>
                              </p>
                            </td>
                          </tr>

                          <!-- Expiry note -->
                          <tr>
                            <td style="padding:16px 40px 32px 40px;">
                              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                                This link expires in %d minutes and can only be used once. If you didn't create a ShopSphere account, you can safely ignore this email.
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
                """.formatted(safeName, verificationLink, couponBlock, verificationLink, verificationLink, ttlMinutes);
    }

    static String buildText(String fullName, String verificationLink, long ttlMinutes, String welcomeCouponCode, int welcomeCouponPercentage) {
        String couponLine = welcomeCouponCode == null ? "" : """

                Welcome gift: enjoy %d%% off your first order with code %s
                """.formatted(welcomeCouponPercentage, welcomeCouponCode);

        return """
                Hi %s,

                Welcome to ShopSphere! Please verify your email address to activate your account:

                %s
                %s
                This link expires in %d minutes and can only be used once. If you didn't create a ShopSphere account, you can safely ignore this email.

                The ShopSphere Team
                """.formatted(fullName, verificationLink, couponLine, ttlMinutes);
    }

    private static String escape(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
