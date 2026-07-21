# Fixing npm Publish Permission

## ✅ Ink Error Fixed!

The rendering error has been fixed:

- Removed empty string `shortcut: ''` from menu items
- Updated version to 1.1.0 in Header
- Rebuilt successfully

---

## 🔐 npm Permission Issue

**Problem:** You're logged in as `mixifys33` but the package was published by user `vettcode`.

**Solution:** Add yourself as a maintainer to the package.

---

## Option 1: Add Maintainer (Recommended)

You need to login as the `vettcode` user first, then add `mixifys33`:

```powershell
# Logout current user
npm logout

# Login as vettcode (the original publisher)
npm login
# Username: vettcode
# Password: [your vettcode password]
# Email: mixifys33@gmail.com

# Add mixifys33 as maintainer
npm owner add mixifys33 vettcode-cli

# Logout
npm logout

# Login back as mixifys33
npm login
# Username: mixifys33

# Now you can publish
npm publish
```

---

## Option 2: Publish Directly as vettcode

Stay logged in as `vettcode` and publish:

```powershell
# Make sure you're logged in as vettcode
npm whoami
# Should show: vettcode

# Publish
npm publish
```

---

## Option 3: Use Scoped Package (Alternative)

If you want to publish under your personal account:

1. **Update package.json:**

   ```json
   {
     "name": "@mixifys33/vettcode-cli"
   }
   ```

2. **Publish:**

   ```powershell
   npm publish --access public
   ```

3. **Users install with:**
   ```bash
   npm install -g @mixifys33/vettcode-cli
   ```

---

## Recommended Steps

### Step 1: Check who you're logged in as

```powershell
npm whoami
```

### Step 2: If logged in as mixifys33, switch to vettcode

```powershell
npm logout
npm login
# Login as: vettcode
```

### Step 3: Verify login

```powershell
npm whoami
# Should show: vettcode
```

### Step 4: Publish

```powershell
npm publish
```

---

## Test the TUI After Publish

After successfully publishing, test that it works:

```powershell
# Install globally
npm install -g vettcode-cli@latest

# Test version
vettcode --version
# Should show: 1.1.0

# Launch TUI (this should now work without errors!)
vettcode
```

---

## What Was Fixed

✅ **Ink Rendering Error** - Removed empty string in menu shortcuts  
✅ **Version Updated** - Changed to 1.1.0 in Header component  
✅ **Rebuild Complete** - All builds successful

**Remaining:** npm permission fix (login as correct user)

---

## Quick Commands

```powershell
# Check current user
npm whoami

# Switch to vettcode account
npm logout
npm login

# Publish
npm publish

# Verify
npm view vettcode-cli version
# Should show: 1.1.0
```

---

## After Publishing

Once published successfully:

1. ✅ Test installation: `npm i -g vettcode-cli@latest`
2. ✅ Test TUI launch: `vettcode`
3. ✅ Verify on npm: https://www.npmjs.com/package/vettcode-cli
4. ✅ Update GitHub README with v1.1.0 info

---

## Need More Help?

If you don't remember the `vettcode` password:

1. Go to: https://www.npmjs.com/login
2. Click "Forgot password?"
3. Reset for the `vettcode` account
4. Then follow steps above

Or use Option 3 (scoped package) to publish as `@mixifys33/vettcode-cli`
