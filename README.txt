DYNAMICS USER ACCOUNTS - PROTOTYPE
===================================

What it is
-----------
A clickable prototype of the Dynamics 365 User record with two extra fields:
End Date and Active Status. It uses 10 made-up users (no real Dynamics data).
ALL DATA IN THIS PROJECT IS FAKE TEST DATA (example.com emails, TEST-... IDs,
+44 0000 phone numbers). No customer or employee data is used.
Edits are kept only while the page is open.

Live links
----------
1) Google Apps Script version (LinkedIn Google Workspace):
   https://script.google.com/a/macros/linkedin.com/s/AKfycbyYhSiHaxdRxB03nZXXIYvWtMcIvNYd_02e7b7_ibROUY_bDlgEEtycS2BRHu9P6IiXlA/exec
   Deployment ID: AKfycbyYhSiHaxdRxB03nZXXIYvWtMcIvNYd_02e7b7_ibROUY_bDlgEEtycS2BRHu9P6IiXlA
   Apps Script project:
   https://script.google.com/u/0/home/projects/1SQT2WpiOgbseCfnWRzJX7bR03QCSltN0z4jrXsB_Khh8AUlfKhAz6qMN/edit

2) Microsoft Copilot app version (Power Platform managed app):
   https://play.preview.managedapps.cloud.microsoft/apps/a4bbcb0d-1c7a-4107-92bf-b7b35554e91a

Files in this folder
--------------------
- Code.gs     -> paste into Code.gs in the Apps Script project
- Index.html  -> paste into an HTML file named exactly "Index"
- README.txt  -> this guide

Features
--------
- User list with views: All, Active, Inactive, Users with an End Date
- Search by name, user name, title
- Lifecycle bar per user (start date -> end date, red line = today)
- User record tabs: Summary, Details, Administration, Customer Service
  * Account Information: User Name*, First Name, Last Name*, Title,
    Primary Email*, Main Phone, Mobile Phone
  * Account Status & Dates: Active Status, Start Date*, End Date,
    Created On, Modified On
  * Organization Information: Business Unit, Manager, Position, Site, Territory
  * Teams & Security Roles (editable)
  * Details: Nickname, Employee ID, Home Phone, Mailing Address
  * Administration: Access Mode, License Type, Incoming/Outgoing Email,
    Default Queue
  * Customer Service: Capacity, Default Presence
- Commands: New, Save, Disable/Enable, Manage Roles
- Checks: required fields; End Date can't be before Start Date;
  confirm before discarding unsaved changes

Set up / redeploy in Google Apps Script
---------------------------------------
1. Open the Apps Script project.
2. Code.gs: replace everything with the contents of Code.gs.
3. Files "+" > HTML > name it: Index
   Select all, delete, paste the contents of Index.html, Ctrl+S.
4. Deploy > New deployment > gear > Web app
   Execute as: Me
   Who has access: Anyone within linkedin.com (to share with colleagues)
5. Deploy and copy the Web app URL.

Updating later (keeps the same link):
Deploy > Manage deployments > Edit (pencil) > Version: New version > Deploy

Sharing
-------
Send the Web app URL. Who can open it is set by "Who has access".
People outside LinkedIn can't open it unless the Workspace admin allows it.

Troubleshooting
---------------
- "Script function not found: doGet": Code.gs not saved; paste, save, redeploy.
- Blank page / "No HTML file named Index": rename the HTML file to Index.
- "You need access": change "Who has access" in Manage deployments.

Limits
------
- Sample data only; changes are lost on reload.
- Not connected to the real Dynamics environment (access is blocked by an
  admin policy, and Dynamics has no End Date field for users by default).


ADMIN CENTER PAGE (updated 30 Oct 2026 to match the real Admin Center layout)
==========================================================================
File: AdminCenter.html (add to the same Apps Script project as an HTML file
named exactly "AdminCenter", and replace Code.gs with the new version).

Link (same deployment, add ?page=admin):
https://script.google.com/a/macros/linkedin.com/s/AKfycbyYhSiHaxdRxB03nZXXIYvWtMcIvNYd_02e7b7_ibROUY_bDlgEEtycS2BRHu9P6IiXlA/exec?page=admin
(After updating the code: Deploy > Manage deployments > Edit > Version: New version > Deploy)

Replicates the Admin Center contract page layout using FAKE sample data
(TEST COMPANY LTD, contract TEST-CONTRACT-0001):
- Header: LinkedIn Admin Center, help, profile
- Left menu: Test Company Ltd, Overview, Contracts & orders, Transactions
- Contract header: TEST-CONTRACT-0001, Download order form, 2 years / Billed
  quarterly / 2 products / GBP 10,000.00 total value
- Overview table (status, dates, PO number with working "Add PO",
  Test card - 0000, value)
- Products (Recruiter Corporate 5 / 80%, Job Slot 3 / 67%)
  with "Purchase more"
- Renewal information, Billing information (company info, contacts,
  payment information) with "Click here" to request a billing change
- Transactions (Overdue / Paid) with "View all" (Transactions page)
- Admins for this contract: Invite admin, Cancel invitation, Re-invite,
  Remove Admin

NEW - Account Director section:
- Banner at the top: "<name>, your LinkedIn Account Director, manages this
  contract" + Contact button
- "Your LinkedIn account team" card: name, role, available-now status (UK
  office hours), email, phone, office, languages, response time
- Actions: Send a message, Request a call, Email (opens your email app),
  Copy email
- "Your requests" list of sent messages and call requests
- Account Director also listed under Billing information > Contacts
- "Purchase more", "Click here" (billing change) and invoice questions open
  the contact form pre-filled for the Account Director

To change the Account Director: edit the AD line at the top of the
<script> section in AdminCenter.html (name, initials, email, phone, office,
languages).

Limits: All company, contact, contract, card and Account Director details are
fictional sample data (no customer data). "Send message", "Request
call", "Add PO" and "Invite admin" only update the page (nothing is sent or
saved). "Email" / "Open in my email" open a real pre-filled email draft.
Download order form is not available in the prototype.


ACCOUNT DIRECTOR SYNC: DYNAMICS -> ADMIN CENTER (added 30 Oct 2026)
==================================================================
How it works (all test data):
- Dynamics User Accounts > open a user > Summary tab > "Account Director -
  TEST-CONTRACT-0001" section.
- "Make Account Director" (active, saved users only) shows a preview of the
  notification, then on "Confirm and notify":
    1) the Admin Center Account Director is replaced with this user
    2) a notification is sent to the billing contact (Test Contact,
       test.contact@example.com)
- If the current Account Director's name, email, phone or site is edited and
  saved in Dynamics, the Admin Center is updated and the billing contact is
  notified ("details changed").
- Admin Center: shows the new Account Director (banner, account team card,
  contacts), "Account Director updated <date>", and a bell icon listing the
  notifications sent to the billing contact. It refreshes every 30 seconds
  and when you switch back to the tab.

Where the data is stored: Apps Script Script Properties (shared by everyone
using the deployment). Code.gs functions: getState, setAccountDirector,
resetTestState (run resetTestState from the editor to start over).

Notifications: logged only (SEND_REAL_EMAIL = false in Code.gs). To test real
email, change BILLING_CONTACT in Code.gs to your own test mailbox and set
SEND_REAL_EMAIL = true; Apps Script will ask for permission to send email.

Setup: replace Code.gs, Index and AdminCenter in the Apps Script project with
the files in this folder, then Deploy > Manage deployments > Edit >
New version > Deploy. The first run asks you to authorize the script.


END DATE -> ACCOUNT DIRECTOR HANDOVER (added 30 Oct 2026)
=========================================================
Rule: any user with an End Date is Inactive (set automatically when the End
Date is entered, enforced on Save and on load; "Enable" is blocked until the
End Date is cleared).

If the user with an End Date is the current Account Director, saving them:
 1) removes them as Account Director (Admin Center shows "Your Account
    Director has changed. A new Account Director is being assigned soon",
    with Billing Support as the temporary contact),
 2) notifies the billing contact (Test Contact) - see the bell in the
    Admin Center,
 3) creates a Dynamics case for the Billing Support queue:
    "CAS-TEST-0001 - Assign new Account Director - TEST-CONTRACT-0001"
    (see "Billing Support cases" in the Dynamics toolbar).
When a new Account Director is assigned ("Make Account Director"), the open
case is resolved automatically and the billing contact is notified again.

Code.gs: vacateAccountDirector() added; getState() now returns tickets;
resetTestState() also clears cases. Cases are stored in Script Properties
(prototype), not in the real Dynamics environment.


DYNAMICS OPPORTUNITY PAGE + CSP BILLING CONTACT SYNC (added 30 Oct 2026)
======================================================================
New file: Opportunity.html -> add to Apps Script as HTML file named exactly
"Opportunity". Link: <web app URL>?page=opportunity

Opportunity page (Dynamics 365 Sales style, fake data):
- Header: topic, est. close date, est. revenue, status, owner
- Sales process bar: Qualify / Develop / Propose / Close (clickable)
- Tabs: Summary (Opportunity information, Billing contact, Sales
  information, Stakeholders), Product line items, Contract (CSP)
- Commands: Save, Refresh, Close as Won, Close as Lost

NEW field "Billing contact": First name, Last name, Email address.
- Read-only on the opportunity; the source is the billing contact on contract
  TEST-CONTRACT-0001 in CSP (Admin Center page > Billing information >
  Contacts > "Edit billing contact").
- When the billing contact is changed/added in CSP, the opportunity updates
  automatically (checks every 15 seconds and when you return to the tab;
  "Refresh" checks immediately). It shows "Updated from CSP", who changed it
  and when, and the last 3 changes.
- The new billing contact is also used for Account Director notifications.

Code.gs: setBillingContact(firstName, lastName, email) added (validated);
stored in Script Properties (BILLING, BILLING_HIST); resetTestState()
also resets the billing contact.


CSP PAGE + CONNECTED PAGES (added 30 Oct 2026)
==============================================
New file: CSP.html -> add to Apps Script as HTML file named exactly "CSP".
Index is now served as a template (Code.gs updated) so all pages can link
to each other.

Pages (same web app URL):
  ?page=csp          CSP - Customer Support contract TEST-CONTRACT-0001
  ?page=opportunity  Dynamics opportunity
  (no parameter)     Dynamics users / Account Director
  ?page=admin        Admin Center
Every page links to the others.

CSP page (layout of the Customer Support contract view, fake data):
- Contract header (dates, status, customer, fulfillment)
- Tabs: Summary (opportunity, Account Executive, Account Director, billing
  contact, open cases), Contacts (Primary contact, Billing contact with
  Edit, Ship to / Bill to address), Billing, Admin Center, Orders
- Activity log (billing contact changes + notifications)

Billing contact: edit in CSP (first name, family name, email, phone) ->
the opportunity (First Name / Family Name / Email Address), Admin Center and
the Account Director notifications all use the new contact.

Opportunity changes: owner is now "Test Account Executive"; the NEW tag,
sync label and explanatory text next to the Billing Contact were removed.
Badges now read "TEST DATA".


ACCOUNT TEAM AT ACCOUNT LEVEL + MESSAGE ROUTING (added 9 Nov 2026)
==================================================================
Goal: connect the customer with their Account Director. The account team is
held on the Dynamics ACCOUNT (Test Company Ltd, TEST-ACC-0001), so it covers
every contract, and the Admin Center shows it once on the main (Overview)
page instead of under each contract.

New file: Account.html -> add to Apps Script as HTML file named exactly
"Account". Link: <web app URL>?page=account
Dynamics Account page shows:
- Account Team: Account Director (from the Dynamics user record), Status
  (Active/Inactive), End date, Manager; plus Account Executive
- "Admin Center messages go to": who receives customer messages right now
- Customer messages sent from the Admin Center (who they went to, and
  whether they were diverted), with the full email text
- Contracts on the account and Billing Support cases

Rule (Code.gs route_()):
1) The system reads the Account Director on the account team and checks the
   Dynamics user record: no End Date = Active, End Date = Inactive.
2) Active: the Account Director's details are shown in the Admin Center
   account team, and "Send a message" / "Request a call" email the
   Account Director.
3) Inactive: the Account Director stays on the account team as Inactive and
   messages are diverted automatically to the Account Director's manager
   (Manager field on the user record). The Admin Center shows the manager as
   the contact ("Covering for ..."), the billing contact is told, and a
   Billing Support case is opened to assign a new Account Director.
   If no manager is on record, messages go to Billing Support.
4) Clearing the End Date (Active again) or assigning a new Account
   Director switches messages back and resolves the open case.

Manager emails (fake): Test Manager 1 -> test.manager1@example.com,
Test Manager 2 -> test.manager2@example.com (MANAGERS in Index.html).

Code.gs: sendCustomerMessage() added (emails the AD or the manager; stored
as MESSAGES); vacateAccountDirector() now keeps the AD as Inactive and
diverts to the manager; getState() returns account, route and messages;
resetTestState() also clears messages. Real email is still off
(SEND_REAL_EMAIL = false). To test real email, put your own test mailbox as
the Account Director / manager email and set SEND_REAL_EMAIL = true.

Admin Center: account team card moved to the Overview page; banner wording
is now account level; the "Message sent" confirmation names who received
the message; "Your requests" shows "Sent to manager" when diverted.
Index (Dynamics users), Opportunity and CSP: wording is account level and
each page links to the new Account page.
