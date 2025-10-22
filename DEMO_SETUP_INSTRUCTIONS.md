# Lenkersdorfer CRM - Demo Setup Instructions

## Demo Access Credentials

**Production URL:** https://lenkersdorfer-crm.vercel.app/

**Demo Login:**
- **Email:** `demo@lenkersdorfer.com`
- **Password:** `LuxuryWatch2024!`
- **Role:** Manager (Full Access)

---

## Quick Start for Jason

1. **Navigate to the login page:**
   - Open: https://lenkersdorfer-crm.vercel.app/
   - You'll be automatically redirected to the login page if not authenticated

2. **Sign in with demo credentials:**
   - Email: `demo@lenkersdorfer.com`
   - Password: `LuxuryWatch2024!`

3. **You're in!**
   - After successful login, you'll be redirected to the dashboard
   - Full access to all CRM features:
     - Client management
     - Waitlist tracking
     - Watch allocation
     - Priority notifications
     - Messaging system
     - Analytics dashboard

---

## Setting Up the Demo User in Supabase

### Prerequisites
- Access to Supabase Dashboard
- Project URL: Your Supabase project URL
- Admin access to the Supabase project

### Method 1: Supabase Dashboard (Recommended)

1. **Log in to Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Navigate to your Lenkersdorfer CRM project

2. **Create the user:**
   - Click on "Authentication" in the left sidebar
   - Click on "Users"
   - Click "Add user" button
   - Select "Create new user"
   - Fill in the details:
     ```
     Email: demo@lenkersdorfer.com
     Password: LuxuryWatch2024!
     Auto Confirm User: ✓ (check this box)
     ```
   - Click "Create user"

3. **Verify creation:**
   - You should see the new user in the users list
   - Note the User UUID (you may need this for database relations)

4. **Test the login:**
   - Go to: https://lenkersdorfer-crm.vercel.app/login
   - Enter the credentials
   - You should be redirected to the dashboard

### Method 2: SQL Editor

1. **Open SQL Editor:**
   - In Supabase Dashboard, go to "SQL Editor"
   - Click "New query"

2. **Run the setup script:**
   - Open the file: `DEMO_USER_SETUP.sql` in this repository
   - Copy the contents
   - Paste into the SQL Editor
   - Follow the instructions in the comments
   - Execute the relevant sections

3. **Important Notes:**
   - You CANNOT create auth users directly with SQL
   - Use the Supabase Dashboard method (Method 1) to create the auth user
   - The SQL file provides guidance and verification queries

### Method 3: Supabase CLI

```bash
# Create the user via CLI
supabase auth users create demo@lenkersdorfer.com \
  --password "LuxuryWatch2024!" \
  --auto-confirm
```

---

## Features Available to Demo User

### Dashboard (/)
- Overview of all sales metrics
- Revenue charts and analytics
- Top VIP clients
- Priority action cards
- Notification system

### Clients (/clients)
- View all clients in the system
- Add new clients
- Edit client information
- Track lifetime spend and VIP tiers
- View purchase history
- Log contact interactions

### Messages (/messages)
- Client messaging interface
- SMS integration (opens device SMS app)
- Message templates
- Unread message tracking

### Waitlist (/waitlist)
- View all waitlist entries
- Priority score calculations
- Add clients to waitlist
- Track waiting days
- Smart allocation recommendations

### Allocation (/allocation)
- Watch allocation engine
- AI-powered client matching
- Priority scoring
- Contact management
- Allocation history

### Import (/import)
- Import clients from CSV
- Import watch inventory
- Bulk data operations

---

## Security Features Enabled

1. **Authentication Required:**
   - All routes are protected by middleware
   - Unauthenticated users are redirected to `/login`
   - Session is persisted across browser restarts

2. **Secure Session Management:**
   - JWT tokens stored in httpOnly cookies
   - Automatic session refresh
   - Session timeout after inactivity

3. **Sign Out Functionality:**
   - Sign out button in the sidebar
   - Confirmation dialog before sign out
   - Redirects to login page after sign out

---

## Troubleshooting

### Issue: Can't log in
**Solution:**
- Verify the email and password are correct
- Ensure the user was created with "Auto Confirm User" checked
- Check Supabase Dashboard > Authentication > Users to verify user exists
- Try resetting the password in Supabase Dashboard

### Issue: Redirected to login immediately after signing in
**Solution:**
- Check browser console for errors
- Verify environment variables are set correctly:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Clear browser cookies and try again
- Check Supabase project settings for CORS configuration

### Issue: "Email not confirmed" error
**Solution:**
- In Supabase Dashboard > Authentication > Users
- Find the demo user
- Click the three dots menu
- Select "Confirm email"

### Issue: No data showing in the CRM
**Solution:**
- The demo user starts with a clean slate
- Use the Import feature to load sample data
- Or manually add test clients through the UI
- Sample data files can be found in `/data` folder (if available)

---

## Sharing Access with Jason

### Option 1: Send Direct Link
Send Jason this message:

```
Hi Jason,

Your Lenkersdorfer CRM demo is ready!

Login URL: https://lenkersdorfer-crm.vercel.app/login

Credentials:
Email: demo@lenkersdorfer.com
Password: LuxuryWatch2024!

After logging in, you'll have full manager access to:
- Client management
- Waitlist tracking
- Watch allocation engine
- Priority notifications
- Analytics dashboard

Let me know if you have any questions!
```

### Option 2: Create Jason's Personal Account

If Jason wants his own account:

1. In Supabase Dashboard > Authentication > Users
2. Click "Add user"
3. Create with:
   - Email: jason@lenkersdorfer.com
   - Password: (choose a secure password)
   - Auto Confirm User: ✓

---

## Password Security

### Changing the Password

After first login, the password can be changed:

1. **Via Supabase Dashboard:**
   - Go to Authentication > Users
   - Find the demo user
   - Click "..." menu
   - Select "Reset password"

2. **Via User Profile (if implemented):**
   - Click on user profile in sidebar
   - Select "Change Password"
   - Enter new password

### Best Practices
- Change the demo password regularly
- Use a password manager
- Enable MFA for production accounts
- Don't share passwords via insecure channels

---

## Production Considerations

When moving to full production:

1. **Create Individual User Accounts:**
   - Each salesperson gets their own account
   - Use real email addresses
   - Enable email confirmation

2. **Enable Row Level Security (RLS):**
   - Salespeople see only their assigned clients
   - Managers see team data
   - Implement proper data isolation

3. **Enable MFA:**
   - Go to Supabase > Authentication > Policies
   - Enable Multi-Factor Authentication
   - Require for all users

4. **Set Up Email Templates:**
   - Configure email provider in Supabase
   - Customize welcome emails
   - Set up password reset emails

5. **Monitor Usage:**
   - Check Supabase Dashboard regularly
   - Monitor authentication logs
   - Track API usage

---

## Support

If you encounter any issues:

1. **Check the logs:**
   - Browser console (F12 > Console)
   - Supabase Dashboard > Logs
   - Vercel Dashboard > Deployments > Logs

2. **Common fixes:**
   - Clear browser cache and cookies
   - Try incognito/private mode
   - Verify environment variables
   - Check Supabase project status

3. **Contact support:**
   - File an issue in the repository
   - Contact the development team
   - Check documentation

---

## Next Steps

After Jason successfully logs in:

1. **Import sample data** (if available)
2. **Add a few test clients** to explore features
3. **Test the waitlist** and allocation features
4. **Try the messaging** system
5. **Review the analytics** dashboard
6. **Provide feedback** on the user experience

Enjoy using the Lenkersdorfer CRM!
