@echo off
echo Testing SMTP Configuration for ShopSphere Email Verification
echo.

REM Set your SMTP credentials here
set MAIL_HOST=smtp.gmail.com
set MAIL_PORT=587
set MAIL_USERNAME=your-email@gmail.com
set MAIL_PASSWORD=your-app-password
set MAIL_FROM=noreply@shopsphere.com

echo Current SMTP Configuration:
echo MAIL_HOST: %MAIL_HOST%
echo MAIL_PORT: %MAIL_PORT%
echo MAIL_USERNAME: %MAIL_USERNAME%
echo MAIL_PASSWORD: [HIDDEN]
echo MAIL_FROM: %MAIL_FROM%
echo.

echo To test email verification:
echo 1. Update the credentials above with your actual SMTP details
echo 2. Run run-backend.bat with the same configuration
echo 3. Register a new user or resend verification for existing user
echo 4. Check backend logs for "Verification email sent to" message
echo.

pause