import { ActivityData, ActivityManifest, Slide, Theme, Settings } from '../types/activity.js';

export interface ActivityTemplate {
  id: string;
  name: string;
  category: string;
  categories: string[];
  description: string;
  slideCount: number;
  tags: string[];
  color: string;
  createActivity: () => ActivityData;
}

const defaultTheme: Theme = {
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

const emeraldTheme: Theme = {
  name: 'Emerald Clean',
  palette: {
    background: '#022c22',
    surface: '#064e3b',
    text: '#ecfdf5',
    accent: '#10b981',
    positive: '#34d399',
    negative: '#f87171',
  },
  fonts: {
    heading: 'Plus Jakarta Sans',
    body: 'Plus Jakarta Sans',
  },
};

const amberTheme: Theme = {
  name: 'Midnight Amber',
  palette: {
    background: '#09090b',
    surface: '#18181b',
    text: '#fafafa',
    accent: '#f59e0b',
    positive: '#22c55e',
    negative: '#ef4444',
  },
  fonts: {
    heading: 'Plus Jakarta Sans',
    body: 'Plus Jakarta Sans',
  },
};

const violetTheme: Theme = {
  name: 'Vibrant Violet',
  palette: {
    background: '#1e1b4b',
    surface: '#312e81',
    text: '#faf5ff',
    accent: '#a855f7',
    positive: '#10b981',
    negative: '#f43f5e',
  },
  fonts: {
    heading: 'Plus Jakarta Sans',
    body: 'Plus Jakarta Sans',
  },
};

function genId(len = 12): string {
  return Math.random().toString(36).substring(2, 2 + len);
}

function buildManifest(activityId: string, name: string, slides: Slide[]): ActivityManifest {
  const now = new Date().toISOString();
  return {
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
    requires: slides.map((s) => ({ type_id: s.type_id, type_version: 1 })),
    media: [],
  };
}

export const activityTemplates: ActivityTemplate[] = [
  // 1. Interactive Workshop & Training
  {
    id: 'interactive-workshop',
    name: 'Interactive Workshop & Training',
    category: 'Workshop',
    categories: ['Workshop', 'Training', 'Education'],
    description: 'The standard presentation setup with welcome onboarding, icebreaker poll, expectation wordcloud, knowledge quiz, leaderboard, and live Q&A.',
    slideCount: 6,
    tags: ['Welcome', 'Poll', 'Word Cloud', 'Quiz', 'Leaderboard', 'Q&A'],
    color: 'from-indigo-600 to-violet-600',
    createActivity: (): ActivityData => {
      const slides: Slide[] = [
        {
          id: genId(),
          type_id: 'welcome',
          type_version: 1,
          content: {
            title: 'Interactive Workshop & Presentation',
            presenter_name: 'Lead Facilitator',
            presenter_info: 'Skill Upgrade Network',
            join_message: 'Scan the QR code or use the link below to participate live from your phone or laptop',
            logo_url: '/assets/aistudio/AirAct_Community_Learning_Logo_44a129c1.png',
          },
          settings: { participant_visibility: true },
          notes: 'Welcome participants! Allow everyone to scan the QR code to join before proceeding.',
        },
        {
          id: genId(),
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
          id: genId(),
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
          id: genId(),
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
          id: genId(),
          type_id: 'leaderboard',
          type_version: 1,
          content: {
            title: 'Quiz Leaderboard',
            display_mode: 'top_5',
          },
          settings: { participant_visibility: true },
          notes: 'Celebrate top scoring participants on the podium!',
        },
        {
          id: genId(),
          type_id: 'qa',
          type_version: 1,
          content: {
            title: 'Audience Questions & Upvoting',
            allow_anonymous: true,
          },
          settings: { participant_visibility: true },
          notes: 'Participants submit questions and upvote others in real time.',
        },
      ];

      return {
        manifest: buildManifest(genId(16), 'Interactive Workshop & Presentation', slides),
        slides,
        theme: defaultTheme,
        settings: {
          content_language: 'en',
          quiz_preset: 'learning',
          speed_bonus_enabled: true,
          show_correct_to_participants: true,
          show_explanation_to_participants: true,
          show_score_to_participants: true,
          join_mode: 'display_name',
          participant_limit: 200,
          start_point: 'beginning',
        },
        roster: [],
      };
    },
  },

  // 2. All-Hands & Town Hall Q&A
  {
    id: 'town-hall',
    name: 'All-Hands & Town Hall Q&A',
    category: 'Meeting',
    categories: ['Meeting', 'Corporate', 'Feedback'],
    description: 'Designed for company meetings, quarterly all-hands, and leadership discussions with sentiment check-ins, culture wordclouds, and upvoted executive Q&A.',
    slideCount: 6,
    tags: ['Welcome', 'Sentiment Poll', 'Culture Cloud', 'Open Thoughts', 'Executive Q&A'],
    color: 'from-emerald-600 to-teal-700',
    createActivity: (): ActivityData => {
      const slides: Slide[] = [
        {
          id: genId(),
          type_id: 'welcome',
          type_version: 1,
          content: {
            title: 'Company All-Hands & Executive Q&A',
            presenter_name: 'Executive Leadership Team',
            presenter_info: 'Skill Upgrade Network · Quarterly Town Hall',
            join_message: 'Scan the QR code or use the web link below to submit questions and vote during today’s session',
            logo_url: '/assets/aistudio/AirAct_Community_Learning_Logo_44a129c1.png',
          },
          settings: { participant_visibility: true },
          notes: 'Welcome everyone to the quarterly all-hands meeting.',
        },
        {
          id: genId(),
          type_id: 'poll',
          type_version: 1,
          content: {
            question: 'How are you feeling about our team priorities and quarterly milestones?',
            options: [
              { id: 'opt_1', text: 'Highly motivated & on track' },
              { id: 'opt_2', text: 'Busy but confident in delivery' },
              { id: 'opt_3', text: 'Need more cross-team alignment' },
              { id: 'opt_4', text: 'Blocked on resources or dependencies' },
            ],
          },
          settings: {
            response_mode: 'anonymous',
            response_rule: 'one_per_participant',
            close_policy: { mode: 'grace', grace_seconds: 5 },
            results_visibility: 'live',
            participant_visibility: true,
            timer_seconds: 60,
          },
          notes: 'Honest anonymous feedback on team sentiment.',
        },
        {
          id: genId(),
          type_id: 'wordcloud',
          type_version: 1,
          content: {
            question: 'In one word, what was our biggest team accomplishment this past month?',
            max_entries_per_user: 2,
          },
          settings: {
            response_mode: 'anonymous',
            response_rule: 'multiple',
            results_visibility: 'live',
            participant_visibility: true,
          },
          notes: 'Celebrate collective wins as a visual cloud.',
        },
        {
          id: genId(),
          type_id: 'open',
          type_version: 1,
          content: {
            question: 'Share a shoutout or appreciation for a team member who went above and beyond!',
            max_chars: 240,
            allow_multiple: true,
          },
          settings: {
            response_mode: 'identified',
            response_rule: 'multiple',
            results_visibility: 'live',
            participant_visibility: true,
          },
          notes: 'Read out inspiring peer shoutouts on the big screen.',
        },
        {
          id: genId(),
          type_id: 'qa',
          type_version: 1,
          content: {
            title: 'Executive Leadership Q&A (Upvoting Enabled)',
            allow_anonymous: true,
          },
          settings: { participant_visibility: true },
          notes: 'Top upvoted questions are addressed first by leadership.',
        },
        {
          id: genId(),
          type_id: 'content',
          type_version: 1,
          content: {
            layout: 'title_text',
            title: 'Next Steps & Upcoming Deadlines',
            body: '• Department breakout sessions tomorrow at 10:00 AM\n• Submit quarterly goals in the portal by Friday\n• Thank you for your hard work and dedication!',
          },
          settings: { participant_visibility: true },
          notes: 'Wrap up key action items and close the session.',
        },
      ];

      return {
        manifest: buildManifest(genId(16), 'Company All-Hands & Executive Q&A', slides),
        slides,
        theme: emeraldTheme,
        settings: {
          content_language: 'en',
          quiz_preset: 'custom',
          speed_bonus_enabled: false,
          show_correct_to_participants: true,
          show_explanation_to_participants: true,
          show_score_to_participants: false,
          join_mode: 'display_name',
          participant_limit: 500,
          start_point: 'beginning',
        },
        roster: [],
      };
    },
  },

  // 3. Fast-Paced Trivia & Championship Quiz
  {
    id: 'trivia-championship',
    name: 'Fast-Paced Trivia Championship',
    category: 'Quiz',
    categories: ['Quiz', 'Training', 'Education'],
    description: 'High-energy competition featuring multi-round trivia, speed bonuses, automatic scoring, halftime standings, and championship podium celebration.',
    slideCount: 7,
    tags: ['Welcome', 'Warm-up', 'Quiz Round 1', 'Halftime', 'Quiz Round 2', 'Podium'],
    color: 'from-amber-500 to-orange-600',
    createActivity: (): ActivityData => {
      const slides: Slide[] = [
        {
          id: genId(),
          type_id: 'welcome',
          type_version: 1,
          content: {
            title: 'Tech & Knowledge Trivia Championship',
            presenter_name: 'Quizmaster',
            presenter_info: 'Skill Upgrade Network · Live Tournament',
            join_message: 'Scan the QR code and enter your display name to compete for the championship title!',
            logo_url: '/assets/aistudio/AirAct_Community_Learning_Logo_44a129c1.png',
          },
          settings: { participant_visibility: true },
          notes: 'Introduce rules: speed bonuses apply! Faster correct answers earn extra points.',
        },
        {
          id: genId(),
          type_id: 'poll',
          type_version: 1,
          content: {
            question: 'Warm-up: Pick your squad mascot for tonight!',
            options: [
              { id: 'opt_1', text: '⚡ Lightning Bolts' },
              { id: 'opt_2', text: '💻 Code Ninjas' },
              { id: 'opt_3', text: '🐉 Data Dragons' },
              { id: 'opt_4', text: '🚀 Rocket Rangers' },
            ],
          },
          settings: {
            response_mode: 'identified',
            response_rule: 'one_per_participant',
            results_visibility: 'live',
            participant_visibility: true,
            timer_seconds: 30,
          },
          notes: 'Get everyone warmed up and ready.',
        },
        {
          id: genId(),
          type_id: 'quiz',
          type_version: 1,
          content: {
            question: 'Round 1: In database systems, what does the "A" in ACID transactions stand for?',
            options: [
              { id: 'q1_1', text: 'Automatic' },
              { id: 'q1_2', text: 'Atomicity' },
              { id: 'q1_3', text: 'Asynchronous' },
              { id: 'q1_4', text: 'Authentication' },
            ],
            correct_option_id: 'q1_2',
            points: 100,
            explanation: 'Atomicity guarantees that all operations within a transaction succeed or all roll back.',
            reveal_timing: 'after_question',
          },
          settings: {
            response_mode: 'identified',
            timer_seconds: 20,
            speed_bonus: true,
            participant_visibility: true,
          },
          notes: '20 seconds countdown with speed bonus.',
        },
        {
          id: genId(),
          type_id: 'quiz',
          type_version: 1,
          content: {
            question: 'Round 2: Which language was designed by Anders Hejlsberg and released by Microsoft in 2012?',
            options: [
              { id: 'q2_1', text: 'Kotlin' },
              { id: 'q2_2', text: 'TypeScript' },
              { id: 'q2_3', text: 'Rust' },
              { id: 'q2_4', text: 'Go' },
            ],
            correct_option_id: 'q2_2',
            points: 100,
            explanation: 'TypeScript was created by Anders Hejlsberg at Microsoft to bring static typing to JavaScript.',
            reveal_timing: 'after_question',
          },
          settings: {
            response_mode: 'identified',
            timer_seconds: 20,
            speed_bonus: true,
            participant_visibility: true,
          },
          notes: 'Second question in the speed round.',
        },
        {
          id: genId(),
          type_id: 'leaderboard',
          type_version: 1,
          content: {
            title: 'Halftime Scoreboard & Standings',
            display_mode: 'top_5',
          },
          settings: { participant_visibility: true },
          notes: 'Check who is in the lead before the final showdown question!',
        },
        {
          id: genId(),
          type_id: 'quiz',
          type_version: 1,
          content: {
            question: 'Final Showdown (Double Points): What is the maximum value of a 32-bit signed integer?',
            options: [
              { id: 'q3_1', text: '1,048,576' },
              { id: 'q3_2', text: '2,147,483,647' },
              { id: 'q3_3', text: '4,294,967,295' },
              { id: 'q3_4', text: '65,535' },
            ],
            correct_option_id: 'q3_2',
            points: 200,
            explanation: '2^31 - 1 = 2,147,483,647 is the maximum positive value in a two\'s complement 32-bit signed integer.',
            reveal_timing: 'after_question',
          },
          settings: {
            response_mode: 'identified',
            timer_seconds: 25,
            speed_bonus: true,
            participant_visibility: true,
          },
          notes: 'Double points question that can shift the podium!',
        },
        {
          id: genId(),
          type_id: 'leaderboard',
          type_version: 1,
          content: {
            title: 'Grand Championship Podium',
            display_mode: 'top_5',
          },
          settings: { participant_visibility: true },
          notes: 'Confetti and medals for the champions!',
        },
      ];

      return {
        manifest: buildManifest(genId(16), 'Fast-Paced Trivia Championship', slides),
        slides,
        theme: amberTheme,
        settings: {
          content_language: 'en',
          quiz_preset: 'competitive',
          speed_bonus_enabled: true,
          show_correct_to_participants: true,
          show_explanation_to_participants: true,
          show_score_to_participants: true,
          join_mode: 'display_name',
          participant_limit: 200,
          start_point: 'beginning',
        },
        roster: [],
      };
    },
  },

  // 4. Product Design Sprint & Feedback
  {
    id: 'product-sprint',
    name: 'Product Design Sprint & Roadmap',
    category: 'Feedback',
    categories: ['Workshop', 'Meeting', 'Feedback'],
    description: 'Structure feature prioritization workshops, gather pain points, collect user feedback, and vote on product roadmap initiatives.',
    slideCount: 5,
    tags: ['Welcome', 'Priority Poll', 'Friction Cloud', 'Idea Wall', 'Roadmap Q&A'],
    color: 'from-purple-600 to-indigo-700',
    createActivity: (): ActivityData => {
      const slides: Slide[] = [
        {
          id: genId(),
          type_id: 'welcome',
          type_version: 1,
          content: {
            title: 'Product Design Sprint & Roadmap Review',
            presenter_name: 'Product & Design Team',
            presenter_info: 'Skill Upgrade Network · Innovation Lab',
            join_message: 'Scan the QR code to vote on priorities and submit feature suggestions in real-time',
            logo_url: '/assets/aistudio/AirAct_Community_Learning_Logo_44a129c1.png',
          },
          settings: { participant_visibility: true },
          notes: 'Welcome participants to the collaborative sprint review.',
        },
        {
          id: genId(),
          type_id: 'poll',
          type_version: 1,
          content: {
            question: 'Which capability would deliver the greatest immediate value to our daily users?',
            options: [
              { id: 'opt_1', text: 'Offline local intranet sync mode' },
              { id: 'opt_2', text: 'Automated CSV and PDF reporting' },
              { id: 'opt_3', text: 'Custom brand kits & theme styling' },
              { id: 'opt_4', text: 'Integrations with Google Slides / LMS' },
            ],
          },
          settings: {
            response_mode: 'anonymous',
            response_rule: 'one_per_participant',
            results_visibility: 'live',
            participant_visibility: true,
            timer_seconds: 45,
          },
          notes: 'Audience votes on immediate product priorities.',
        },
        {
          id: genId(),
          type_id: 'wordcloud',
          type_version: 1,
          content: {
            question: 'What is the biggest bottleneck or friction in your current workflow?',
            max_entries_per_user: 3,
          },
          settings: {
            response_mode: 'anonymous',
            response_rule: 'multiple',
            results_visibility: 'live',
            participant_visibility: true,
          },
          notes: 'Surface common pain points in a live word cloud.',
        },
        {
          id: genId(),
          type_id: 'open',
          type_version: 1,
          content: {
            question: 'What one new feature or improvement would make this product a 10/10 for you?',
            max_chars: 280,
            allow_multiple: true,
          },
          settings: {
            response_mode: 'identified',
            response_rule: 'multiple',
            results_visibility: 'live',
            participant_visibility: true,
          },
          notes: 'Brainstorm open ideas displayed as live response cards.',
        },
        {
          id: genId(),
          type_id: 'qa',
          type_version: 1,
          content: {
            title: 'Roadmap & Architecture Q&A',
            allow_anonymous: false,
          },
          settings: { participant_visibility: true },
          notes: 'Open Q&A on upcoming engineering and product milestones.',
        },
      ];

      return {
        manifest: buildManifest(genId(16), 'Product Design Sprint & Roadmap Review', slides),
        slides,
        theme: violetTheme,
        settings: {
          content_language: 'en',
          quiz_preset: 'custom',
          speed_bonus_enabled: false,
          show_correct_to_participants: true,
          show_explanation_to_participants: true,
          show_score_to_participants: true,
          join_mode: 'display_name',
          participant_limit: 200,
          start_point: 'beginning',
        },
        roster: [],
      };
    },
  },
];

export function createBlankActivity(): ActivityData {
  const welcomeSlide: Slide = {
    id: genId(),
    type_id: 'welcome',
    type_version: 1,
    content: {
      title: 'New Presentation',
      presenter_name: 'Presenter Name',
      presenter_info: 'Skill Upgrade Network',
      join_message: 'Scan the QR code or use the link below to participate live from your phone or laptop',
      logo_url: '/assets/aistudio/AirAct_Community_Learning_Logo_44a129c1.png',
    },
    settings: { participant_visibility: true },
    notes: 'Welcome participants! Allow everyone to scan the QR code to join before proceeding.',
  };
  const slides = [welcomeSlide];
  const actId = genId(16);
  return {
    manifest: buildManifest(actId, 'Untitled Presentation', slides),
    theme: defaultTheme,
    settings: {
      content_language: 'en',
      quiz_preset: 'custom',
      speed_bonus_enabled: false,
      show_correct_to_participants: true,
      show_explanation_to_participants: true,
      show_score_to_participants: true,
      join_mode: 'anonymous',
      participant_limit: 200,
      start_point: 'beginning',
    },
    slides,
    roster: [],
  };
}

