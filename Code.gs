// ===== Pages =====
function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) || '';
  if (page === 'csp') {
    var c = HtmlService.createTemplateFromFile('CSP');
    c.url = ScriptApp.getService().getUrl();
    return c.evaluate()
      .setTitle('CSP - Customer Support (TEST)')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  if (page === 'opportunity') {
    var o = HtmlService.createTemplateFromFile('Opportunity');
    o.url = ScriptApp.getService().getUrl();
    return o.evaluate()
      .setTitle('Opportunity - Dynamics 365 (TEST)')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  if (page === 'account') {
    var ac = HtmlService.createTemplateFromFile('Account');
    ac.url = ScriptApp.getService().getUrl();
    return ac.evaluate()
      .setTitle('Account Level - Dynamics 365 (TEST)')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  if (page === 'admin') {
    var t = HtmlService.createTemplateFromFile('AdminCenter');
    t.url = ScriptApp.getService().getUrl();
    return t.evaluate()
      .setTitle('Admin Center - LinkedIn (TEST)')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  var ix = HtmlService.createTemplateFromFile('Index');
  ix.url = ScriptApp.getService().getUrl();
  ix.userId = String((e && e.parameter && e.parameter.user) || '').replace(/[^\w-]/g, '');
  return ix.evaluate()
    .setTitle('Sales Representative - Dynamics 365 (TEST)')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ===== Shared test state (Dynamics -> Admin Center) =====
// All values are FAKE test data.
var CONTRACT_ID = 'TEST-CONTRACT-0001';
var COMPANY = 'Test Company Ltd';
var DEFAULT_BILLING_CONTACT = { firstName: 'Test', lastName: 'Contact', name: 'Test Contact', email: 'test.contact@example.com', phone: '+44 0000 000001', updatedAt: '', updatedBy: '' };
var BILLING_CONTACT = DEFAULT_BILLING_CONTACT; // refreshed from storage on every call (see billing_())
var BILLING_SUPPORT = { name: 'Billing Support', email: 'billing-support@example.com', phone: '+44 0000 000999' };
// Set to true ONLY if you change BILLING_CONTACT to your own test mailbox
// and want a real email sent. Left false: notifications are logged only.
var SEND_REAL_EMAIL = false;

// Dynamics ACCOUNT record (account level - covers every contract of the customer).
var ACCOUNT = { id: 'TEST-ACC-0001', name: COMPANY, contracts: [CONTRACT_ID] };

// Account team > Account Director (a Dynamics user). Active = no End Date.
// The manager comes from the user's Manager field and receives customer
// messages when the Account Director is inactive.
var DEFAULT_AD = {
  userId: 'u-011', name: 'Test Account Director', initials: 'TA', title: 'Account Director',
  email: 'test.accountdirector@example.com', phone: '+44 0000 000000',
  office: 'Test Office, UK (GMT)', lang: 'English', updatedAt: '', vacant: false,
  active: true, endDate: '',
  managerName: 'Test Manager 1', managerEmail: 'test.manager1@example.com', managerTitle: 'Sales Manager (test)'
};

function props_() { return PropertiesService.getScriptProperties(); }
function read_(k, d) { var v = props_().getProperty(k); return v ? JSON.parse(v) : d; }
function write_(k, v) { props_().setProperty(k, JSON.stringify(v)); }
function withLock_(fn) { var l = LockService.getScriptLock(); l.waitLock(10000); try { return fn(); } finally { l.releaseLock(); } }

function billing_() { BILLING_CONTACT = read_('BILLING', DEFAULT_BILLING_CONTACT); return BILLING_CONTACT; }

// Active/inactive is decided by the End Date on the Account Director's user record.
function validEmail_(e) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(e || '').trim()); }
function adActive_(ad) { return !!(ad && !ad.vacant && ad.name && !ad.endDate && ad.active !== false && validEmail_(ad.email)); }

// Who receives a message the customer sends from the Admin Center.
function route_(ad) {
  if (adActive_(ad)) return { diverted: false, name: ad.name, email: ad.email, role: 'Account Director', reason: '' };
  var why = (ad && ad.name ? ad.name : 'The Account Director') + ' is inactive' + (ad && ad.endDate ? ' (end date ' + ad.endDate + ')' : (ad && ad.name && !validEmail_(ad.email) ? ' (no valid email address)' : ''));
  if (ad && validEmail_(ad.managerEmail)) return { diverted: true, name: ad.managerName || 'Manager', email: ad.managerEmail,
    role: 'Manager of the Account Director', reason: why, title: ad.managerTitle || '' };
  return { diverted: true, name: BILLING_SUPPORT.name, email: BILLING_SUPPORT.email, role: 'Billing Support', reason: why + '; no manager on record' };
}

// Other account team members shown next to the Account Director.
var DEFAULT_TEAM = [
  { userId: 'u-012', role: 'Account Executive', name: 'Test Account Executive', email: 'test.accountexecutive@example.com', active: true, endDate: '', managerName: 'Test Manager 1', managerEmail: 'test.manager1@example.com' }
];

function getState() {
  billing_();
  var ad = read_('AD', DEFAULT_AD);
  ad.active = adActive_(ad);
  return {
    team: read_('TEAM', DEFAULT_TEAM),
    contractId: CONTRACT_ID, company: COMPANY, account: ACCOUNT, route: route_(ad),
    messages: read_('MESSAGES', []),
    billingContact: BILLING_CONTACT, billingSupport: BILLING_SUPPORT,
    ad: ad,
    notifications: read_('NOTIFS', []),
    tickets: read_('TICKETS', []),
    billingHistory: read_('BILLING_HIST', [])
  };
}

function notify_(subject, body, reason) {
  billing_();
  var sent = false;
  if (SEND_REAL_EMAIL && !/@example\.com$/i.test(BILLING_CONTACT.email)) {
    MailApp.sendEmail(BILLING_CONTACT.email, subject, body);
    sent = true;
  }
  var n = read_('NOTIFS', []);
  n.unshift({ id: 'NTF-' + (1001 + n.length), to: BILLING_CONTACT, subject: subject, body: body,
              reason: reason, sentAt: new Date().toISOString(), delivered: sent ? 'email' : 'logged (test)' });
  write_('NOTIFS', n.slice(0, 25));
}

function clean_(ad) {
  return {
    userId: String(ad.userId || ''), name: String(ad.name).slice(0, 120),
    initials: String(ad.initials || '').slice(0, 3), title: String(ad.title || 'Account Director').slice(0, 120),
    email: String(ad.email).slice(0, 200),
    phone: String(ad.phone || '').slice(0, 60), office: String(ad.office || '').slice(0, 120),
    lang: String(ad.lang || 'English').slice(0, 60), updatedAt: new Date().toISOString(), vacant: false,
    active: true, endDate: '',
    managerName: String(ad.managerName || '').slice(0, 120), managerEmail: String(ad.managerEmail || '').slice(0, 200),
    managerTitle: String(ad.managerTitle || '').slice(0, 120)
  };
}

// Assign a new Account Director, or update the current one's details.
function setAccountDirector(ad, reason) {
  if (!ad || !ad.name || !ad.email) throw new Error('Account Director needs a name and email.');
  return withLock_(function () {
    billing_();
    var prev = read_('AD', DEFAULT_AD);
    var next = clean_(ad);
    write_('AD', next);
    var assigned = reason === 'assigned';
    var subject = '[TEST] ' + (assigned ? 'Your new LinkedIn Account Director' : reason === 'reactivated' ? 'Your Account Director is available again' : 'Your Account Director details changed') + ' - ' + COMPANY;
    var body = 'Hi ' + BILLING_CONTACT.name + ',\n\n' +
      'Your LinkedIn account ' + COMPANY + ' ' + (assigned ? 'has a new Account Director' : (reason === 'reactivated' ? 'Account Director is available again' : 'Account Director details were updated')) + '.\n\n' +
      'Account Director: ' + next.name + '\nEmail: ' + next.email + '\nPhone: ' + next.phone + '\nOffice: ' + next.office + '\n\n' +
      (assigned && !prev.vacant && prev.name && prev.name !== next.name ? 'This replaces ' + prev.name + '.\n\n' : '') +
      'You can see and contact your Account Director in the Admin Center.\n\n(TEST NOTIFICATION - fake data)';
    notify_(subject, body, reason);
    if (assigned || reason === 'reactivated') {
      var t = read_('TICKETS', []);
      t.forEach(function (c) {
        if (c.type === 'AD_UPDATE' && c.status === 'Active') {
          c.status = 'Resolved'; c.resolvedAt = next.updatedAt;
          c.resolution = (assigned ? 'New Account Director assigned: ' : 'Account Director active again (End Date removed): ') + next.name + ' (' + next.email + ').';
        }
      });
      write_('TICKETS', t);
    }
    return getState();
  });
}

// Current Account Director has an End Date (Inactive in Dynamics):
// keep them on the account team as Inactive, divert Admin Center messages to their
// manager, notify the billing contact and open a Billing Support case.
function vacateAccountDirector(user) {
  return withLock_(function () {
    billing_();
    var prev = read_('AD', DEFAULT_AD);
    if (prev.vacant || prev.active === false) return getState();
    if (user && user.userId && prev.userId && user.userId !== prev.userId) throw new Error('This user is not the current Account Director.');
    var now = new Date().toISOString();
    var end = (user && user.endDate) || 'set';
    prev.active = false; prev.endDate = end; prev.updatedAt = now;
    if (user && user.managerEmail) { prev.managerName = user.managerName || prev.managerName; prev.managerEmail = user.managerEmail; prev.managerTitle = user.managerTitle || prev.managerTitle; }
    write_('AD', prev);
    var r = route_(prev);

    notify_('[TEST] Your LinkedIn Account Director has changed - ' + COMPANY,
      'Hi ' + BILLING_CONTACT.name + ',\n\n' +
      prev.name + ' is no longer available as the Account Director for your LinkedIn account ' + COMPANY + (user && user.endDate ? ' (end date ' + user.endDate + ')' : '') + '.\n\n' +
      'Until a new Account Director is assigned, messages you send from the Admin Center go to ' + r.name + ' (' + r.role + ', ' + r.email + ').\n\n' +
      '(TEST NOTIFICATION - fake data)', 'vacated');

    var t = read_('TICKETS', []);
    t.unshift({
      id: 'CAS-TEST-' + ('000' + (t.length + 1)).slice(-4), type: 'AD_UPDATE', contractId: CONTRACT_ID, accountId: ACCOUNT.id, company: COMPANY,
      title: 'Assign new Account Director - ' + COMPANY,
      queue: 'Billing Support', priority: 'Normal', origin: 'Automation (Dynamics user end date)',
      status: 'Active', createdAt: now,
      description: 'Account Director ' + prev.name + ' (' + prev.email + ') has an end date' + (user && user.endDate ? ' of ' + user.endDate : '') +
        ' and was set to Inactive in Dynamics.\nCustomer messages from the Admin Center are being diverted to ' + r.name + ' (' + r.email + ').' +
        '\nPlease assign a new Account Director on the ' + COMPANY + ' account team (account level, all contracts).'
    });
    write_('TICKETS', t.slice(0, 50));
    return getState();
  });
}

// Admin Center "Send a message" / "Request a call": email the Account Director,
// or their manager if the Account Director is inactive (has an End Date).
function sendCustomerMessage(msg) {
  var subject = String((msg && msg.subject) || '').trim().slice(0, 200);
  var text = String((msg && msg.message) || '').trim().slice(0, 5000);
  var topic = String((msg && msg.topic) || 'Other').slice(0, 80);
  var pref = String((msg && msg.pref) || 'Email').slice(0, 40);
  if (!subject || !text) throw new Error('Add a subject and a message.');
  return withLock_(function () {
    billing_();
    var ad = read_('AD', DEFAULT_AD);
    var r = route_(ad);
    var from = BILLING_CONTACT;
    var mailSubject = '[TEST][Admin Center] ' + subject + ' - ' + COMPANY;
    var body = (r.diverted
        ? 'DIVERTED TO YOU AS MANAGER: ' + r.reason + '.\nPlease reply to the customer or pass this on until a new Account Director is assigned.\n\n'
        : '') +
      'Hi ' + r.name.split(' ')[0] + ',\n\n' +
      from.name + ' (' + from.email + ') from ' + COMPANY + ' sent a message from the LinkedIn Admin Center.\n\n' +
      'Account: ' + COMPANY + ' (' + ACCOUNT.id + ')\nTopic: ' + topic + '\nPreferred reply: ' + pref + '\nSubject: ' + subject + '\n\n' +
      text + '\n\n(TEST MESSAGE - fake data)';
    var sent = false;
    if (SEND_REAL_EMAIL && !/@example\.com$/i.test(r.email)) {
      try {
        MailApp.sendEmail({ to: r.email, subject: mailSubject, body: body, replyTo: from.email });
        sent = true;
      } catch (err) {
        // The Account Director's mailbox rejected the email: divert to the manager.
        if (r.diverted || !validEmail_(ad.managerEmail)) throw err;
        r = { diverted: true, name: ad.managerName || 'Manager', email: ad.managerEmail, role: 'Manager of the Account Director',
              reason: ad.name + "'s email address could not be reached" };
        body = 'DIVERTED TO YOU AS MANAGER: ' + r.reason + '.\n\n' + body;
        MailApp.sendEmail({ to: r.email, subject: mailSubject, body: body, replyTo: from.email });
        sent = true;
      }
    }
    var list = read_('MESSAGES', []);
    var m = { id: 'REQ-' + (10481 + list.length), at: new Date().toISOString(), from: { name: from.name, email: from.email },
      topic: topic, pref: pref, subject: subject, to: { name: r.name, email: r.email, role: r.role },
      intendedFor: { name: ad.name || '', email: ad.email || '' }, diverted: r.diverted, reason: r.reason,
      mailSubject: mailSubject, body: body, delivered: sent ? 'email' : 'logged (test)' };
    list.unshift(m);
    write_('MESSAGES', list.slice(0, 50));
    var st = getState(); st.lastMessage = m;
    return st;
  });
}

// CSP (Admin Center contract) -> billing contact. The Dynamics opportunity reads this.
function setBillingContact(bc, by) {
  var first = String((bc && bc.firstName) || '').trim().slice(0, 60);
  var last = String((bc && bc.lastName) || '').trim().slice(0, 60);
  var email = String((bc && bc.email) || '').trim().slice(0, 200);
  var phone = String((bc && bc.phone) || '').trim().slice(0, 40);
  if (!first || !last) throw new Error('First name and last name are required.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Enter a valid email address.');
  return withLock_(function () {
    var prev = read_('BILLING', DEFAULT_BILLING_CONTACT);
    var now = new Date().toISOString();
    var next = { firstName: first, lastName: last, name: first + ' ' + last, email: email, phone: phone,
                 updatedAt: now, updatedBy: String(by || 'CSP agent (test)').slice(0, 80) };
    write_('BILLING', next);
    var h = read_('BILLING_HIST', []);
    h.unshift({ at: now, by: next.updatedBy, from: prev.name + ' <' + prev.email + '>', to: next.name + ' <' + next.email + '>' });
    write_('BILLING_HIST', h.slice(0, 20));
    return getState();
  });
}

function resetTestState() {
  var p = props_();
  ['AD', 'TEAM', 'NOTIFS', 'TICKETS', 'BILLING', 'BILLING_HIST', 'MESSAGES'].forEach(function (k) { p.deleteProperty(k); });
  return getState();
}


// The user record (Index page) decides if a team member is active: called when a user is saved.
function updateTeamMember(u) {
  if (!u || !u.userId) return getState();
  return withLock_(function () {
    var team = read_('TEAM', DEFAULT_TEAM);
    team.forEach(function (m) {
      if (m.userId !== u.userId) return;
      m.name = String(u.name || m.name).slice(0, 120); m.email = String(u.email || m.email).slice(0, 200);
      m.active = !u.endDate && u.active !== false; m.endDate = String(u.endDate || '');
      m.managerName = String(u.managerName || ''); m.managerEmail = String(u.managerEmail || '');
    });
    write_('TEAM', team);
    return getState();
  });
}

// ===== Dynamics 365 sync (Dataverse Web API) =====
// Turned off until set in Project Settings > Script properties:
//   DYN_URL    e.g. https://yourorg.crm.dynamics.com
//   DYN_TOKEN  a valid OAuth bearer token (or replace token_() with your own auth)
//   DYN_ACCOUNT_ID  the Dynamics account GUID
// Reads the account team, finds the Account Director, checks the user's End Date and
// Active status, and stores the director, their manager and the rest of the team.
function dynConfigured_() { var p = props_(); return !!(p.getProperty('DYN_URL') && p.getProperty('DYN_TOKEN') && p.getProperty('DYN_ACCOUNT_ID')); }
function dyn_(path) {
  var p = props_();
  var r = UrlFetchApp.fetch(p.getProperty('DYN_URL') + '/api/data/v9.2/' + path, {
    headers: { Authorization: 'Bearer ' + p.getProperty('DYN_TOKEN'), Accept: 'application/json' }, muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error('Dynamics error ' + r.getResponseCode() + ': ' + r.getContentText().slice(0, 200));
  return JSON.parse(r.getContentText());
}
function syncFromDynamics() {
  if (!dynConfigured_()) return { synced: false, reason: 'Dynamics is not configured yet.' };
  var acc = props_().getProperty('DYN_ACCOUNT_ID');
  var members = dyn_("teammembers?$filter=_objectid_value eq " + acc).value || [];
  var team = [], ad = null;
  members.forEach(function (m) {
    var u = dyn_('systemusers(' + m._systemuserid_value + ')?$select=fullname,internalemailaddress,isdisabled,title,mobilephone,_parentsystemuserid_value');
    var mgr = u._parentsystemuserid_value ? dyn_('systemusers(' + u._parentsystemuserid_value + ')?$select=fullname,internalemailaddress,title') : null;
    var endDate = u.isdisabled ? 'set' : '';
    var rec = { userId: m._systemuserid_value, name: u.fullname, title: u.title || '', email: u.internalemailaddress || '', phone: u.mobilephone || '',
      role: m._roleid_value || m.roleName || '', active: !u.isdisabled, endDate: endDate,
      managerName: mgr ? mgr.fullname : '', managerEmail: mgr ? (mgr.internalemailaddress || '') : '', managerTitle: mgr ? (mgr.title || '') : '' };
    if (/account director/i.test(String(m.roleName || m.role || ''))) ad = rec; else team.push(rec);
  });
  return withLock_(function () {
    if (ad) { ad.initials = ad.name.split(' ').map(function (x) { return x[0]; }).join('').slice(0, 3); ad.updatedAt = new Date().toISOString(); ad.vacant = false; write_('AD', ad); }
    write_('TEAM', team);
    return { synced: true, accountDirector: ad ? ad.name : null, teamSize: team.length };
  });
}
