# Lenkersdorfer CRM - Complete Walkthrough Guide

## 🎯 Overview
This guide walks you through all the new features implemented in the CRM, step-by-step.

---

## 📊 STEP 1: Import Your Real Client Data

### What You'll Do:
Import your Lenkersdorfer sales data (RTF or CSV format)

### Steps:
1. **Navigate to Import Tab**
   - Click on "Import" in the sidebar
   - Or go to: http://localhost:3004/import

2. **Upload Your File**
   - Drag & drop your Lenkersdorfer sales RTF file
   - Or click "Select File" to browse
   - The system accepts RTF (auto-extracts CSV) or direct CSV files

3. **Review Import Preview**
   - System will show you how many clients will be created
   - Shows sample data preview
   - Displays duplicate detection (if any)

4. **Click "Import Clients"**
   - Wait for success message
   - System will:
     - Create unique clients (deduped by name)
     - Calculate lifetime spend per client
     - Assign VIP tiers (Platinum/Gold/Silver/Bronze)
     - Link all purchases to clients

5. **Verify Import**
   - Navigate to Clients tab
   - You should see all your imported clients with:
     - Lifetime spend totals
     - VIP tier badges
     - Purchase history
     - Contact information

---

## 👤 STEP 2: Add a Purchase to a Client's History

### What You'll Do:
Add a new watch purchase to an existing client (ad-hoc entry)

### Steps:
1. **Navigate to Clients Page**
   - Click "Clients" in sidebar
   - Or go to: http://localhost:3004/clients

2. **Find Your Client**
   - Use the search bar to find client by name
   - Or scroll through the list
   - Click on the client card

3. **Open Add Purchase Modal**
   - On the client detail page, look for the action buttons at the top
   - Click the **"Add Purchase"** button (has a dollar sign icon)

4. **Fill in Purchase Details**
   - **Watch Brand**: e.g., "Rolex"
   - **Watch Model**: e.g., "Submariner 126610LN"
   - **Price**: e.g., 14,000
   - **Commission Rate (%)**: e.g., 15
   - **Purchase Date**: Select from date picker
   - **Notes** (optional): Any special details

5. **Submit Purchase**
   - Click "Add Purchase" button
   - Modal will close automatically

6. **Verify Addition**
   - Scroll to "Purchase History" section
   - Your new purchase should appear at the top
   - Check that:
     - Lifetime Spend updated
     - Commission total updated
     - VIP tier updated (if threshold crossed)

---

## ⏰ STEP 3: Set a Custom Reminder for a Client

### What You'll Do:
Create a reminder to follow up with a client on a specific date

### Steps:
1. **From Client Detail Page**
   - (Already viewing a client from Step 2)
   - Look for action buttons section

2. **Click "Set Reminder" Button**
   - Has a calendar icon
   - Opens the Set Reminder modal

3. **Choose Reminder Type**
   - Select one of the 4 types:
     - **Follow-Up**: General client check-in
     - **Call Back**: Return client call
     - **Meeting**: Scheduled appointment
     - **Custom**: Other reminder

4. **Select Date & Time**
   - **Quick Select** (optional): Click "Tomorrow", "In 3 days", "Next week", etc.
   - **Or manually pick**:
     - Reminder Date: Choose from calendar
     - Reminder Time: Choose time (defaults to 9:00 AM)

5. **Add Notes (Optional)**
   - e.g., "Follow up about Daytona waitlist"
   - e.g., "Call regarding trade-in offer"

6. **Preview & Submit**
   - Review the preview showing when reminder triggers
   - Click "Set Reminder"
   - Success! Modal closes

7. **Verify Reminder**
   - Click the **Bell icon** in top-right corner
   - You should see your reminder in the notification panel
   - Or navigate to: http://localhost:3004/reminders

---

## 🔔 STEP 4: View & Manage Reminders

### What You'll Do:
Check all your reminders and take action on them

### Steps:
1. **Open Notification Panel**
   - Click the **Bell icon** in top-right corner
   - Badge shows number of unread notifications

2. **Switch to Follow-ups Tab**
   - Click "Follow-ups" tab
   - See all your custom reminders

3. **Reminder Actions**
   - **Complete**: Click green checkmark button
     - Marks reminder as done
     - Removes from list
   - **Snooze**: Click clock icon
     - Postpones until tomorrow
   - **Swipe Left**: On mobile, swipe to dismiss

4. **Or Use Reminders Dashboard**
   - Go to: http://localhost:3004/reminders
   - View stats: Overdue, Due Today, Upcoming
   - Filter by: All Active / Due Now / Upcoming
   - Same actions available (complete/snooze)

---

## 📞 STEP 5: Mark Client as Contacted

### What You'll Do:
Update when you last spoke with a client

### Steps:
1. **After Calling or Meeting with Client**
   - View that client's detail page

2. **Click "Mark as Contacted" Button**
   - Located in the stats section (near phone/email)
   - Has a phone icon

3. **Instant Update**
   - "Last contacted" updates to "Just now"
   - Button shows confirmation animation

4. **Verify on Client Cards**
   - Go back to Clients list page
   - Find that client's card
   - Under contact info, you'll see:
     - **Last contacted: Just now** (in green)

5. **Time Updates Automatically**
   - As time passes, it shows:
     - 5m ago → 2h ago → Yesterday → 3d ago → 2w ago → 3mo ago
   - Never contacted shows in orange as a warning

---

## 🎯 STEP 6: Add Client to Waitlist

### What You'll Do:
Add a client to the waitlist for a specific watch (without requiring purchase)

### Steps:
1. **Open Client Detail Page**
   - Navigate to any client

2. **Click "Add to Waitlist" Button**
   - Has a list icon
   - Opens Add to Waitlist modal

3. **Fill in Waitlist Details**
   - **Watch Brand**: e.g., "Patek Philippe"
   - **Watch Model**: e.g., "Nautilus 5711"
   - **Reference Number** (optional): e.g., "5711/1A-010"
   - **Notes** (optional): e.g., "Prefers blue dial"

4. **Submit**
   - Click "Add to Waitlist"
   - Modal closes

5. **Verify**
   - Scroll to "Waitlist Entries" section on client page
   - Your new entry appears
   - Shows:
     - Watch brand & model
     - Date added
     - Priority score
     - Status (Active)

---

## 🤖 STEP 7: Generate Tier-Based Follow-Up Reminders

### What You'll Do:
Auto-generate follow-up reminders for ALL clients based on their VIP tier

### How It Works:
- **Platinum clients**: Get follow-up every 14 days
- **Gold clients**: Get follow-up every 21 days
- **Silver clients**: Get follow-up every 30 days
- **Bronze clients**: Get follow-up every 60 days
- **No tier**: Get follow-up every 90 days

### Steps:
1. **Navigate to Reminders Page**
   - Go to: http://localhost:3004/reminders

2. **Click "Generate Tier Follow-Ups" Button**
   - Located in top-right of page (blue button)

3. **System Analyzes All Clients**
   - Checks last contact date for each client
   - Calculates if follow-up is due based on tier
   - Only creates reminders for clients who need them
   - Skips clients who already have active follow-up reminders

4. **View Results**
   - Alert shows: "Success! Created X tier-based follow-up reminders"
   - Page refreshes to show new reminders

5. **Check Notification Panel**
   - Click bell icon
   - Go to Follow-ups tab
   - See all the auto-generated tier-based reminders

---

## 📱 STEP 8: Complete Workflow Example

### Real-World Scenario:
Client "John Smith" calls asking about a Rolex Daytona he's interested in.

### Complete Workflow:

1. **Search for Client**
   - Go to Clients page
   - Search "John Smith"
   - Click on his card

2. **Review Client Info**
   - Check his lifetime spend (determines negotiation power)
   - Check VIP tier (Platinum gets priority)
   - Review previous purchases (brand preferences)

3. **Add to Waitlist**
   - Click "Add to Waitlist"
   - Brand: Rolex
   - Model: Daytona 116500LN
   - Notes: "Prefers white dial, willing to wait 6 months"
   - Submit

4. **Set Reminder**
   - Click "Set Reminder"
   - Type: Follow-Up
   - Date: In 2 weeks
   - Notes: "Check on Daytona availability, mention new shipment"
   - Submit

5. **Mark as Contacted**
   - Click "Mark as Contacted" button
   - Records that you spoke with him today

6. **Later: Complete Reminder**
   - 2 weeks later, bell icon shows notification
   - Click bell → Follow-ups tab
   - See: "Follow-Up Due - John Smith"
   - Call John, discuss watch
   - Click green checkmark to complete reminder
   - Optionally: Mark as contacted again

7. **When Watch Arrives: Add Purchase**
   - Navigate to John's detail page
   - Click "Add Purchase"
   - Fill in:
     - Brand: Rolex
     - Model: Daytona 116500LN White Dial
     - Price: 42,000
     - Commission: 15%
     - Date: Today
   - Submit
   - See lifetime spend increase
   - See tier potentially upgrade

---

## 🎉 Key Features Summary

### ✅ What You Can Do Now:

1. **Ad-Hoc Data Entry**
   - Add purchases on the fly
   - Add clients to waitlist without purchase history
   - No CSV import required for individual entries

2. **Smart Reminders**
   - Custom reminders with date/time
   - Auto-appear in notification panel
   - Complete from notifications
   - Dashboard view of all reminders

3. **Tier-Based Automation**
   - One-click to generate follow-ups for all clients
   - Respects VIP tier frequency
   - Prevents duplicates
   - Manual trigger (you control when)

4. **Contact Tracking**
   - Mark clients as contacted
   - See "last contacted" on every client card
   - Visual warnings for cold leads (orange = never contacted)
   - Time displays update automatically

5. **Waitlist Management**
   - Works for clients without purchases
   - Track watch preferences
   - Priority scoring
   - Notes for special requests

---

## 🔍 Tips & Best Practices

### Daily Routine:
1. Start day: Check notification bell for due reminders
2. After each client call: Mark as contacted
3. Set reminders for follow-ups during conversations
4. Complete reminders as you handle them

### Weekly Routine:
1. Every Monday: Click "Generate Tier Follow-Ups"
2. Review reminders dashboard
3. Plan week based on upcoming reminders
4. Clean up completed reminders

### When Adding Data:
- Always mark as contacted after calls
- Set specific reminder dates (not just "later")
- Add notes to reminders for context
- Use waitlist for "maybe" purchases

---

## 🚨 Troubleshooting

### "Reminder doesn't show in notifications"
- Check if reminder date is in the past or today
- Refresh notification panel (click bell again)
- Go to /reminders page to verify it was created

### "Can't add purchase"
- Ensure all required fields filled (brand, model, price, date)
- Check that client exists
- Try refreshing page

### "Tier follow-ups not generating"
- Ensure clients have last_contact_date set
- Check that clients don't already have active follow-up reminders
- Verify VIP tiers are assigned

---

## 📞 Need Help?
- All features are in production and tested
- Dev server running on: http://localhost:3004
- Database connected to Supabase (live data)

Enjoy your new CRM features! 🎉
