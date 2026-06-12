import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const DIR = './screenshots';
const CREDS = {
  patient: { email: 'patient@mediai.org', password: 'M3diAI_SecureP@ss2026!' },
  doctor:  { email: 'doctor@mediai.org',  password: 'M3diAI_SecureP@ss2026!' },
  admin:   { email: 'admin@mediai.org',   password: 'M3diAI_SecureP@ss2026!' },
};

async function login(page, creds) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', creds.email);
  await page.fill('input[type="password"]', creds.password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
}

async function snap(page, name) {
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: false });
  console.log(`  ✅ ${name}.png`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // 1. Landing Page
  console.log('📸 Public pages...');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await snap(page, '01_landing');

  // 2. Login Page
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await snap(page, '02_login');

  // --- PATIENT PORTAL ---
  console.log('📸 Patient portal...');
  await login(page, CREDS.patient);
  
  await page.goto(`${BASE}/patient/dashboard`, { waitUntil: 'networkidle' });
  await snap(page, '03_patient_dashboard');

  await page.goto(`${BASE}/patient/profile`, { waitUntil: 'networkidle' });
  await snap(page, '04_patient_profile');

  await page.goto(`${BASE}/patient/appointments`, { waitUntil: 'networkidle' });
  await snap(page, '05_patient_appointments');

  await page.goto(`${BASE}/patient/ehr`, { waitUntil: 'networkidle' });
  await snap(page, '06_patient_ehr');

  await page.goto(`${BASE}/patient/lab-reports`, { waitUntil: 'networkidle' });
  await snap(page, '07_patient_lab_reports');

  await page.goto(`${BASE}/patient/predictions`, { waitUntil: 'networkidle' });
  await snap(page, '08_patient_predictions');

  await page.goto(`${BASE}/patient/chatbot`, { waitUntil: 'networkidle' });
  await snap(page, '09_patient_chatbot');

  // Logout
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.clear(); });

  // --- DOCTOR PORTAL ---
  console.log('📸 Doctor portal...');
  await login(page, CREDS.doctor);
  
  await page.goto(`${BASE}/doctor/dashboard`, { waitUntil: 'networkidle' });
  await snap(page, '10_doctor_dashboard');

  await page.goto(`${BASE}/doctor/patients`, { waitUntil: 'networkidle' });
  await snap(page, '11_doctor_patients');

  await page.goto(`${BASE}/doctor/appointments`, { waitUntil: 'networkidle' });
  await snap(page, '12_doctor_appointments');

  await page.goto(`${BASE}/doctor/predictions`, { waitUntil: 'networkidle' });
  await snap(page, '13_doctor_predictions');

  await page.goto(`${BASE}/doctor/recommendations`, { waitUntil: 'networkidle' });
  await snap(page, '14_doctor_recommendations');

  await page.goto(`${BASE}/doctor/reports`, { waitUntil: 'networkidle' });
  await snap(page, '15_doctor_reports');

  // Logout
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.clear(); });

  // --- ADMIN PORTAL ---
  console.log('📸 Admin portal...');
  await login(page, CREDS.admin);
  
  await page.goto(`${BASE}/admin/dashboard`, { waitUntil: 'networkidle' });
  await snap(page, '16_admin_dashboard');

  await page.goto(`${BASE}/admin/beds`, { waitUntil: 'networkidle' });
  await snap(page, '17_admin_beds');

  await page.goto(`${BASE}/admin/resources`, { waitUntil: 'networkidle' });
  await snap(page, '18_admin_resources');

  await page.goto(`${BASE}/admin/staff`, { waitUntil: 'networkidle' });
  await snap(page, '19_admin_staff');

  await page.goto(`${BASE}/admin/alerts`, { waitUntil: 'networkidle' });
  await snap(page, '20_admin_alerts');

  await page.goto(`${BASE}/admin/analytics`, { waitUntil: 'networkidle' });
  await snap(page, '21_admin_analytics');

  await browser.close();
  console.log('\n🎉 All screenshots captured!');
})();
