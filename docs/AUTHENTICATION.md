# VettCode CLI - Browser-Based Authentication

## 🚀 Overview

VettCode CLI now uses **browser-based authentication** for a secure and user-friendly login experience, similar to GitHub CLI, Vercel CLI, and other modern developer tools.

---

## 🎯 Quick Start

### First Time Setup

```bash
# Install globally (if not already installed)
npm install -g vettcode-cli

# Login via browser
vettcode login

# Start scanning!
vettcode .
```

---

## 🔐 Authentication Commands

### Login

```bash
vettcode login
```

**What happens:**

1. CLI generates a secure verification code
2. Browser opens automatically to authentication page
3. You login/approve in the browser
4. CLI receives authentication token
5. You're ready to scan!

**Example output:**

```
╔════════════════════════════════════════╗
║         VettCode CLI - Login           ║
╚════════════════════════════════════════╝

Please complete authentication in your browser

┌─────────────────────────────────────────┐
│  Your verification code:                │
│                                         │
│         ABC-123                         │
│                                         │
└─────────────────────────────────────────┘

Opening browser for authentication...
⠋ Waiting for authentication... (295s remaining)

✔ Authentication successful! 🎉

  Welcome, John Doe!
  Email: john@example.com
  Plan: pro
```

### Create Account

```bash
vettcode signup
```

Opens browser to signup page. After creating your account, run `vettcode login` to authenticate.

### Check Login Status

```bash
vettcode whoami
```

Displays your current authentication status and user information.

### Logout

```bash
vettcode logout
```

Clears your local authentication token.

---

## 🔄 How It Works

### Device Authorization Flow

```
┌─────────────────────────────────────────────────────┐
│ 1. CLI: Generate verification code                  │
│    Code: ABC-123 (easy to type)                     │
│    URL: https://vettcodecli.vercel.app/cli-auth     │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│ 2. Browser: Opens automatically                     │
│    - Code is pre-filled                             │
│    - Login if needed                                │
│    - Click "Authorize Device"                       │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│ 3. CLI: Polls for approval (every 5 seconds)        │
│    Shows countdown timer                            │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│ 4. Success!                                         │
│    - Token saved to ~/.vettcode/config.json         │
│    - Ready to use VettCode commands                 │
└─────────────────────────────────────────────────────┘
```

---

## 🛡️ Security Features

### 1. **Short-Lived Codes**

- Verification codes expire after 5 minutes
- Prevents replay attacks

### 2. **One-Time Use**

- Each code can only be used once
- Automatically invalidated after approval

### 3. **Secure Token Storage**

- Token stored in `~/.vettcode/config.json`
- File permissions: 0o600 (user-only read/write)
- Never transmitted except over HTTPS

### 4. **HTTPS Only**

- All API communication is encrypted
- No credentials in plain text

### 5. **Token Expiry**

- JWT tokens expire after 30 days
- Automatic re-authentication required

---

## 📁 Token Storage

### Location

```
~/.vettcode/config.json
```

**Windows:**

```
C:\Users\YourName\.vettcode\config.json
```

**Mac/Linux:**

```
/home/username/.vettcode/config.json
```

### Structure

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "developer": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "subscription": {
      "plan": "pro",
      "status": "active"
    }
  },
  "updatedAt": "2026-07-31T10:30:00.000Z"
}
```

---

## 🚨 Troubleshooting

### Browser Doesn't Open

**Problem:** Browser doesn't open automatically

**Solution:**

1. Check if a URL is displayed in terminal
2. Copy the URL manually
3. Paste in your browser

**Example:**

```
Opening browser for authentication...
If browser doesn't open, visit: https://vettcodecli.vercel.app/cli-auth?code=ABC-123
```

### Code Expired

**Problem:** "Code has expired" message

**Solution:**

- Codes expire after 5 minutes
- Run `vettcode login` again to get a new code

### Invalid Code

**Problem:** "Invalid code" message in browser

**Solution:**

1. Verify the code matches what's shown in terminal
2. Code format: ABC-123 (6 characters with dash)
3. Codes are case-insensitive

### Token Not Saved

**Problem:** Successfully authenticated but not logged in

**Solution:**

1. Check file permissions on `~/.vettcode/` folder
2. Ensure you have write access
3. Try running with admin privileges (if needed)

### Session Expired

**Problem:** "Your session has expired" when running commands

**Solution:**

```bash
vettcode login
```

JWT tokens expire after 30 days.

---

## 🔧 Advanced Usage

### Manual Token Input

If you have a token from another source:

```bash
# Create config file manually
mkdir -p ~/.vettcode
echo '{"token":"YOUR_TOKEN_HERE"}' > ~/.vettcode/config.json
```

### Multiple Devices

You can login on multiple devices:

- Each device gets its own token
- All tokens remain valid until logout or expiry
- View active devices in your web dashboard

### CI/CD Integration

For automated environments:

```bash
# Set token as environment variable
export VETTCODE_TOKEN="your_token_here"

# Or use config file
echo '{"token":"'$VETTCODE_TOKEN'"}' > ~/.vettcode/config.json
```

---

## 🌐 Offline Mode

### When Offline

- Login requires internet connection
- Once authenticated, token is cached locally
- Scanning works offline (if AI features disabled)

### Using Without Auth (Limited)

Some features may work without authentication:

```bash
vettcode . --no-ai --no-upload
```

---

## 🔑 Token Management

### View Token Info

```bash
vettcode whoami
```

### Clear Token

```bash
vettcode logout
```

### Refresh Token

```bash
vettcode logout
vettcode login
```

---

## 🆚 Comparison: Old vs New Auth

| Feature             | Old (Terminal)               | New (Browser)     |
| ------------------- | ---------------------------- | ----------------- |
| **UX**              | Text prompts                 | Visual forms      |
| **Speed**           | Slow typing                  | Auto-fill         |
| **Security**        | Password visible in terminal | Hidden in browser |
| **Google OAuth**    | ❌ Not supported             | ✅ Supported      |
| **Mobile-Friendly** | ❌ Difficult                 | ✅ Easy           |
| **Error Messages**  | Limited                      | Rich UI           |
| **Copy/Paste**      | ❌ Awkward                   | ✅ Natural        |
| **Multi-Device**    | ❌ Complex                   | ✅ Simple         |

---

## 📖 FAQ

### Q: Do I need to login every time?

**A:** No! Once logged in, your token is saved and reused automatically.

### Q: Can I use the same account on multiple computers?

**A:** Yes! Login on each device with `vettcode login`.

### Q: How long does authentication last?

**A:** 30 days. After that, you'll need to login again.

### Q: Is my password stored locally?

**A:** No! Only an encrypted JWT token is stored. Your password never leaves the browser.

### Q: Can I revoke access?

**A:** Yes! Use `vettcode logout` or revoke from your web dashboard.

### Q: What if I close the browser before approving?

**A:** The CLI will timeout after 5 minutes. Just run `vettcode login` again.

### Q: Do I need a VettCode account?

**A:** Yes. You can create one with `vettcode signup` or at https://vettcodecli.vercel.app

---

## 🔗 Related Documentation

- [Installation Guide](./INSTALLATION.md)
- [CLI Usage Guide](./README.md)
- [Web Dashboard](https://vettcodecli.vercel.app)
- [API Documentation](https://vettcodecli.vercel.app/docs)

---

## 💡 Tips

### Tip 1: Bookmark the Auth Page

```
https://vettcodecli.vercel.app/cli-auth
```

### Tip 2: Use `whoami` to Check Status

Before scanning, verify you're logged in:

```bash
vettcode whoami && vettcode .
```

### Tip 3: Set Up Multiple Profiles

Use different config files for different accounts:

```bash
# Work account
cp ~/.vettcode/config.json ~/.vettcode/config.work.json

# Personal account
cp ~/.vettcode/config.json ~/.vettcode/config.personal.json

# Switch accounts
cp ~/.vettcode/config.work.json ~/.vettcode/config.json
```

---

## 🎉 Benefits of Browser Auth

✅ **Secure** - No password in terminal history  
✅ **Fast** - Auto-fill and one-click approval  
✅ **Familiar** - Same flow as GitHub, Vercel, etc.  
✅ **Mobile-Friendly** - Easy to approve from phone  
✅ **OAuth Support** - Login with Google  
✅ **Better UX** - Visual feedback and animations  
✅ **Error Handling** - Clear messages and retry options

---

## 📞 Support

**Issues?** Report them at:

- GitHub: https://github.com/mixifys33/vettcode-cli/issues
- Email: support@vettcode.com
- Discord: https://discord.gg/vettcode

---

## 🔄 Migration from Old CLI

If you used the old terminal-based authentication:

1. **Logout from old system:**

   ```bash
   vettcode logout
   ```

2. **Login with new browser flow:**

   ```bash
   vettcode login
   ```

3. **Verify it works:**
   ```bash
   vettcode whoami
   ```

Your old tokens are automatically invalidated. No other action needed!

---

**Enjoy the new authentication experience! 🚀**
