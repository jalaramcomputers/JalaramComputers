/**
 * Seeds Firestore settings/hero_slides with default service images.
 * Requires Firebase Admin credentials or run from admin console manually.
 *
 * Usage: copy public/data/hero-services.json content into Firestore:
 *   Collection: settings
 *   Document ID: hero_slides
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'data', 'hero-services.json'), 'utf-8'));

console.log('Firestore seed document: settings/hero_slides');
console.log(JSON.stringify(data, null, 2));
console.log('\nPaste the JSON above into Firebase Console → Firestore → settings → hero_slides');
