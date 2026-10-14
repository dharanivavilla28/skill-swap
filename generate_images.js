const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const baseDir = __dirname;
const imagesDir = path.join(baseDir, 'images');
const templatesDir = path.join(imagesDir, 'templates');

const tasks = [
  {
    name: '1_system_architecture_diagram.png',
    template: '1_architecture.html',
    width: 1400,
    height: 1020,
    title: '5.4 System Architecture Diagram (3-layer block diagram)'
  },
  {
    name: '2_why_this_match_panel.png',
    template: '2_why_this_match.html',
    width: 1400,
    height: 960,
    title: '5.5.1 "Why This Match?" Panel UI Screenshot'
  },
  {
    name: '3_wallet_credit_ledger.png',
    template: '3_wallet_ledger.html',
    width: 1400,
    height: 980,
    title: '5.5.2 Wallet & Credit Ledger UI Screenshot'
  },
  {
    name: '4_swap_lifecycle_state_diagram.png',
    template: '4_swap_lifecycle.html',
    width: 1400,
    height: 980,
    title: '5.5.3 Swap Lifecycle State Diagram (flowchart)'
  },
  {
    name: '5_student_dashboard.png',
    template: '5_student_dashboard.html',
    width: 1400,
    height: 1050,
    title: '5.6 Student Dashboard UI Screenshot'
  },
  {
    name: '6_active_swap_room.png',
    template: '6_active_swap_room.html',
    width: 1400,
    height: 920,
    title: '5.6 Active Swap Room UI Screenshot'
  },
  {
    name: '7_user_profile_trust_badge.png',
    template: '7_profile_trust_badge.html',
    width: 1400,
    height: 980,
    title: '5.6 User Profile & Trust Badge UI Screenshot'
  },
  {
    name: '8_vitest_test_results.png',
    template: '8_vitest_terminal.html',
    width: 1350,
    height: 920,
    title: '5.8 Vitest Test Results Terminal Screenshot'
  }
];

console.log(`Starting image generation for ${tasks.length} requested items...`);

for (const t of tasks) {
  const htmlFile = path.join(templatesDir, t.template);
  const outFile = path.join(imagesDir, t.name);
  const fileUrl = 'file:///' + htmlFile.replace(/\\/g, '/');

  console.log(`Rendering [${t.name}] (${t.title})...`);
  const cmd = `"${edgePath}" --headless --disable-gpu --screenshot="${outFile}" --window-size=${t.width},${t.height} "${fileUrl}"`;
  
  try {
    execSync(cmd, { stdio: 'inherit' });
    const stat = fs.statSync(outFile);
    console.log(`  ✓ Successfully generated ${t.name} (${stat.size} bytes)`);
  } catch (err) {
    console.error(`  ✗ Error generating ${t.name}:`, err.message);
  }
}

console.log('All documentation screenshots rendered successfully!');
