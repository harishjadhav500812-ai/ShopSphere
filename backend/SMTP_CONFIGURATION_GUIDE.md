# SMTP Email Configuration Guide

## Issue
Users are not receiving verification emails because SMTP is not configured. The application currently runs in development mode where verification codes are only logged to the console.

## Solution

Configure SMTP settings by adding environment variables to your `run-backend.bat` file or system environment.

### Option 1: Gmail SMTP (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and generate a password
3. **Update run-backend.bat**:

```batch
set MAIL_HOST=smtp.gmail.com
set MAIL_PORT=587
set MAIL_USERNAME=your-email@gmail.com
set MAIL_PASSWORD=your-16-digit-app-password
set MAIL_FROM=noreply@yourdomain.com
```

### Option 2: Outlook/Hotmail SMTP

```batch
set MAIL_HOST=smtp.live.com
set MAIL_PORT=587
set MAIL_USERNAME=your-email@outlook.com
set MAIL_PASSWORD=your-password
set MAIL_FROM=noreply@yourdomain.com
```

### Option 3: Yahoo SMTP

```batch
set MAIL_HOST=smtp.mail.yahoo.com
set MAIL_PORT=587
set MAIL_USERNAME=your-email@yahoo.com
set MAIL_PASSWORD=your-app-password
set MAIL_FROM=noreply@yourdomain.com
```

### Option 4: SendGrid (Production)

```batch
set MAIL_HOST=smtp.sendgrid.net
set MAIL_PORT=587
set MAIL_USERNAME=apikey
set MAIL_PASSWORD=your-sendgrid-api-key
set MAIL_FROM=noreply@yourdomain.com
```

### Option 5: AWS SES (Production)

```batch
set MAIL_HOST=email-smtp.region.amazonaws.com
set MAIL_PORT=587
set MAIL_USERNAME=your-ses-smtp-username
set MAIL_PASSWORD=your-ses-smtp-password
set MAIL_FROM=verified@yourdomain.com
```

## Testing Configuration

1. **Update your `run-backend.bat`** with the appropriate SMTP settings
2. **Restart the backend server**
3. **Register a new user** or **resend verification** to an existing unverified user
4. **Check the logs** - you should see:
   ```
   INFO: Verification email sent to user@example.com
   ```
   Instead of:
   ```
   [DEV] Email service not configured (set MAIL_HOST to enable). Verification code for user@example.com: 123456
   ```

## Troubleshooting

### Common Issues:

1. **Authentication Failed**
   - For Gmail: Ensure you're using an App Password, not your regular password
   - For other providers: Verify username/password are correct

2. **Connection Timeout**
   - Check firewall settings
   - Verify MAIL_HOST and MAIL_PORT are correct

3. **From Address Rejection**
   - Some providers require MAIL_FROM to match your authenticated email
   - Try setting MAIL_FROM to the same as MAIL_USERNAME

4. **TLS/SSL Issues**
   - The application is configured for STARTTLS on port 587
   - For SSL (port 465), you'd need to modify application.properties

### Security Notes:

- **Never commit real credentials** to version control
- **Use App Passwords** instead of account passwords when available
- **Consider environment-specific configs** for dev/staging/production
- **For production**, use dedicated email services like SendGrid or AWS SES

## Verification

After configuring SMTP, the email verification flow will work as follows:

1. User registers → Verification code generated → Email sent
2. User clicks verification link or enters code → Account activated
3. User can now log in successfully

The verification emails will have a professional appearance with the ShopSphere branding and include the 6-digit verification code.