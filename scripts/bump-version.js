#!/usr/bin/env node
/**
 * Version manager for android/version.properties (single source of truth).
 *
 *   node scripts/bump-version.js show          -> print current values
 *   node scripts/bump-version.js code          -> versionCode += 1
 *   node scripts/bump-version.js code 60        -> versionCode = 60
 *   node scripts/bump-version.js name 2.1.0     -> versionName = 2.1.0
 *
 * versionCode MUST strictly increase on every Play Store upload (any track).
 * versionName is the human-facing string (bump on user-visible releases).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'android', 'version.properties');

function read() {
  const txt = fs.readFileSync(FILE, 'utf8');
  const code = /VERSION_CODE=(\d+)/.exec(txt);
  const name = /VERSION_NAME=(.+)/.exec(txt);
  return {
    code: code ? parseInt(code[1], 10) : 0,
    name: name ? name[1].trim() : '0.0.0',
  };
}

function write({ code, name }) {
  const out =
`# App version — single source of truth for Android builds.
# Managed via: npm run version:code  /  npm run version:name -- <x.y.z>
# versionCode MUST increase on EVERY Play Store upload (any track).
VERSION_CODE=${code}
VERSION_NAME=${name}
`;
  fs.writeFileSync(FILE, out);
}

const [, , cmd, arg] = process.argv;
const cur = read();

switch (cmd) {
  case 'code': {
    const next = arg ? parseInt(arg, 10) : cur.code + 1;
    if (Number.isNaN(next)) {
      console.error('versionCode must be an integer');
      process.exit(1);
    }
    write({ code: next, name: cur.name });
    console.log(`versionCode: ${cur.code} -> ${next}   (versionName ${cur.name})`);
    break;
  }
  case 'name': {
    if (!arg) {
      console.error('Usage: npm run version:name -- <x.y.z>');
      process.exit(1);
    }
    write({ code: cur.code, name: arg });
    console.log(`versionName: ${cur.name} -> ${arg}   (versionCode ${cur.code})`);
    break;
  }
  case 'show':
  default:
    console.log(`versionCode=${cur.code}  versionName=${cur.name}`);
}
