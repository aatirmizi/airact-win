import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ActivityData, ActivityManifest, Slide, Theme, Settings } from '../src/types/activity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUPS_DIR = process.env.BACKUPS_DIR || path.resolve(__dirname, '../backups');

if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

export function generateId(length: number = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateJoinCode(): string {
  // 4 character alphabet without look-alikes (excluding 0, O, 1, I, L)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generate8CharPin(): string {
  // 8 characters: exactly 4 uppercase letters and 4 digits (e.g. ALEX4821)
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  let pin = '';
  for (let i = 0; i < 4; i++) {
    pin += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 4; i++) {
    pin += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return pin;
}


export function getDefaultTheme(): Theme {
  return {
    name: 'Modern Indigo',
    palette: {
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f8fafc',
      accent: '#6366f1',
      positive: '#10b981',
      negative: '#ef4444',
    },
    fonts: {
      heading: 'Plus Jakarta Sans',
      body: 'Plus Jakarta Sans',
    },
  };
}

export function getDefaultSettings(): Settings {
  return {
    content_language: 'en',
    quiz_preset: 'learning',
    speed_bonus_enabled: true,
    show_correct_to_participants: true,
    show_explanation_to_participants: true,
    show_score_to_participants: true,
    join_mode: 'display_name',
    participant_limit: 200,
    start_point: 'beginning',
  };
}

export function createStarterActivity(name: string = 'Interactive Workshop'): ActivityData {
  const activityId = generateId(16);
  const now = new Date().toISOString();

  const slides: Slide[] = [
    {
      id: generateId(12),
      type_id: 'welcome',
      type_version: 1,
      content: {
        title: name || 'Interactive Workshop & Presentation',
        presenter_name: 'Lead Facilitator',
        presenter_info: 'Skill Upgrade Network',
        join_message: 'Scan the QR code or use the link below to participate live from your phone or laptop',
        logo_url: '/assets/aistudio/sunlogo-removebg-preview_80efd167.png',
      },
      settings: {
        participant_visibility: true,
      },
      notes: 'Welcome participants! Allow everyone to scan the QR code to join before proceeding.',
    },
    {
      id: generateId(12),
      type_id: 'poll',
      type_version: 1,
      content: {
        question: 'How familiar are you with real-time interactive presentations?',
        options: [
          { id: 'opt_1', text: 'Brand new to this' },
          { id: 'opt_2', text: 'Used tools like Slido / AhaSlides' },
          { id: 'opt_3', text: 'Frequent presenter' },
          { id: 'opt_4', text: 'Pro / Power user' },
        ],
      },
      settings: {
        response_mode: 'anonymous',
        response_rule: 'one_per_participant',
        close_policy: { mode: 'immediate' },
        results_visibility: 'live',
        participant_visibility: true,
        timer_seconds: 45,
      },
      notes: 'Give participants 45 seconds to vote.',
    },
    {
      id: generateId(12),
      type_id: 'wordcloud',
      type_version: 1,
      content: {
        question: 'In one or two words, what is your main expectation today?',
        max_entries_per_user: 3,
      },
      settings: {
        response_mode: 'anonymous',
        response_rule: 'multiple',
        close_policy: { mode: 'immediate' },
        results_visibility: 'live',
        participant_visibility: true,
      },
      notes: 'Watch the live word cloud grow on the big screen.',
    },
    {
      id: generateId(12),
      type_id: 'quiz',
      type_version: 1,
      content: {
        question: 'Which protocol is best suited for real-time bi-directional presentation sync?',
        options: [
          { id: 'qopt_1', text: 'HTTP/1.0 polling' },
          { id: 'qopt_2', text: 'WebSockets (State-based rev sync)' },
          { id: 'qopt_3', text: 'Periodic Email updates' },
          { id: 'qopt_4', text: 'FTP file transfer' },
        ],
        correct_option_id: 'qopt_2',
        points: 100,
        explanation: 'WebSockets provide full-duplex, low-latency communication ideal for audience synchronization!',
        reveal_timing: 'after_question',
      },
      settings: {
        response_mode: 'identified',
        timer_seconds: 25,
        speed_bonus: true,
        participant_visibility: true,
      },
      notes: 'Fastest correct answers receive a speed bonus!',
    },
    {
      id: generateId(12),
      type_id: 'leaderboard',
      type_version: 1,
      content: {
        title: 'Quiz Leaderboard',
        display_mode: 'top_5',
      },
      settings: {
        participant_visibility: true,
      },
      notes: 'Celebrate top scorers on the podium.',
    },
    {
      id: generateId(12),
      type_id: 'open',
      type_version: 1,
      content: {
        question: 'What is one key takeaway or insight you want to share?',
        max_chars: 280,
        allow_multiple: true,
      },
      settings: {
        response_mode: 'anonymous',
        response_rule: 'multiple',
        participant_visibility: true,
        results_visibility: 'live',
      },
      notes: 'Review audience thoughts on the display wall.',
    },
    {
      id: generateId(12),
      type_id: 'qa',
      type_version: 1,
      content: {
        title: 'Audience Q&A & Upvoting',
        allow_anonymous: true,
      },
      settings: {
        participant_visibility: true,
        results_visibility: 'live',
      },
      notes: 'Audience can submit questions and upvote each other.',
    },
  ];

  const manifest: ActivityManifest = {
    format: 'actvty',
    format_version: 1,
    data_schema_version: 1,
    meta: {
      activity_id: activityId,
      name,
      created_at: now,
      modified_at: now,
      app_version_created: '1.0.0',
      app_version_saved: '1.0.0',
    },
    slides: slides.map((s) => s.id),
    has_roster: false,
    requires: [
      { type_id: 'content', type_version: 1 },
      { type_id: 'poll', type_version: 1 },
      { type_id: 'quiz', type_version: 1 },
      { type_id: 'leaderboard', type_version: 1 },
      { type_id: 'open', type_version: 1 },
      { type_id: 'wordcloud', type_version: 1 },
      { type_id: 'qa', type_version: 1 },
    ],
    media: [],
  };

  return {
    manifest,
    theme: getDefaultTheme(),
    settings: getDefaultSettings(),
    slides,
  };
}

export async function packageActivityToZip(
  activity: ActivityData,
  sqliteBuffer?: Buffer
): Promise<Buffer> {
  const zip = new JSZip();

  // 1. manifest.json
  zip.file('manifest.json', JSON.stringify(activity.manifest, null, 2));

  // 2. theme.json
  zip.file('theme.json', JSON.stringify(activity.theme, null, 2));

  // 3. settings.json
  zip.file('settings.json', JSON.stringify(activity.settings, null, 2));

  // 4. slides/<id>.json
  for (const slide of activity.slides) {
    zip.file(`slides/${slide.id}.json`, JSON.stringify(slide, null, 2));
  }

  // 5. roster.json (if present)
  if (activity.roster && activity.roster.length > 0) {
    zip.file('roster.json', JSON.stringify(activity.roster, null, 2));
    activity.manifest.has_roster = true;
  }

  // 6. data.db
  if (sqliteBuffer) {
    zip.file('data.db', sqliteBuffer);
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  return zipBuffer;
}

export async function unpackActivityFromZip(zipBuffer: Buffer): Promise<{
  activity: ActivityData;
  sqliteBuffer?: Buffer;
}> {
  const zip = await JSZip.loadAsync(zipBuffer);

  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) throw new Error('Invalid Activity file: manifest.json is missing');

  const manifest: ActivityManifest = JSON.parse(await manifestFile.async('string'));

  const themeFile = zip.file('theme.json');
  const theme: Theme = themeFile ? JSON.parse(await themeFile.async('string')) : getDefaultTheme();

  const settingsFile = zip.file('settings.json');
  const settings: Settings = settingsFile
    ? JSON.parse(await settingsFile.async('string'))
    : getDefaultSettings();

  const slides: Slide[] = [];
  for (const slideId of manifest.slides) {
    const slideFile = zip.file(`slides/${slideId}.json`);
    if (slideFile) {
      const slide: Slide = JSON.parse(await slideFile.async('string'));
      slides.push(slide);
    }
  }

  let sqliteBuffer: Buffer | undefined;
  const dbFile = zip.file('data.db');
  if (dbFile) {
    sqliteBuffer = await dbFile.async('nodebuffer');
  }

  let roster: any = [];
  const rosterFile = zip.file('roster.json');
  if (rosterFile) {
    try {
      roster = JSON.parse(await rosterFile.async('string'));
    } catch {}
  }

  return {
    activity: {
      manifest,
      theme,
      settings,
      slides,
      roster,
    },
    sqliteBuffer,
  };
}

export function createSafetyBackup(activity: ActivityData, dbBuffer: Buffer): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `${activity.manifest.meta.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${timestamp}.bak.actvty`;
  const backupPath = path.join(BACKUPS_DIR, backupFilename);

  packageActivityToZip(activity, dbBuffer).then((buf) => {
    fs.writeFileSync(backupPath, buf);
  }).catch(() => {});

  return backupPath;
}
