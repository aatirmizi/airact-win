/**
 * AirAct Interactive Presentations - Core Types & Schemas
 * Based on activity-docs-v0.2 canonical schemas and specifications
 */

export type SlideTypeId = 'welcome' | 'poll' | 'quiz' | 'leaderboard' | 'open' | 'wordcloud' | 'qa' | 'content';

export type ResponseMode = 'anonymous' | 'identified';
export type ResponseRule = 'one_per_participant' | 'replace_until_closed' | 'multiple';
export type ClosePolicyMode = 'immediate' | 'grace';
export type ResultsVisibility = 'live' | 'hidden';
export type JoinMode = 'anonymous' | 'display_name' | 'roster';

export interface ClosePolicy {
  mode: ClosePolicyMode;
  grace_seconds?: number;
}

export interface SlideOption {
  id: string;
  text: string;
}

export interface TextStyle {
  fontSize?: string;
  color?: string;
  fontFamily?: string;
  align?: 'left' | 'center' | 'right';
}

export interface WelcomeSlideContent {
  title: string;
  presenter_name?: string;
  presenter_info?: string;
  join_message?: string;
  logo_url?: string;
  styles?: Record<string, TextStyle>;
}

export interface PollContent {
  question: string;
  options: SlideOption[];
  styles?: Record<string, TextStyle>;
}

export interface QuizContent {
  question: string;
  options: SlideOption[];
  correct_option_id: string;
  points: number;
  explanation?: string;
  reveal_timing: 'after_question' | 'held_until_reveal' | 'not_during_presentation';
  styles?: Record<string, TextStyle>;
}

export interface LeaderboardContent {
  title: string;
  display_mode: 'top_5' | 'full';
  styles?: Record<string, TextStyle>;
}

export interface OpenQuestionContent {
  question: string;
  max_chars: number;
  allow_multiple: boolean;
  styles?: Record<string, TextStyle>;
}

export interface WordCloudContent {
  question: string;
  max_entries_per_user: number;
  styles?: Record<string, TextStyle>;
}

export interface QAContent {
  title: string;
  allow_anonymous: boolean;
  styles?: Record<string, TextStyle>;
}

export interface ContentSlideContent {
  layout: 'title' | 'title_text' | 'title_image' | 'image_only';
  title: string;
  body?: string;
  imageUrl?: string;
  imageCaption?: string;
  styles?: Record<string, TextStyle>;
}

export type SlideContent =
  | WelcomeSlideContent
  | PollContent
  | QuizContent
  | LeaderboardContent
  | OpenQuestionContent
  | WordCloudContent
  | QAContent
  | ContentSlideContent;

export interface SlideSettings {
  response_mode?: ResponseMode;
  response_rule?: ResponseRule;
  close_policy?: ClosePolicy;
  participant_visibility?: boolean;
  results_visibility?: ResultsVisibility;
  timer_seconds?: number | null;
  speed_bonus?: boolean;
}

export interface Slide {
  id: string; // 12 chars
  type_id: SlideTypeId;
  type_version: number;
  content: SlideContent;
  settings: SlideSettings;
  notes: string;
}

export interface ThemePalette {
  background: string;
  surface: string;
  text: string;
  accent: string;
  positive: string;
  negative: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
}

export interface Theme {
  name: string;
  palette: ThemePalette;
  fonts: ThemeFonts;
  texture?: 'none' | 'dots' | 'grid' | 'mesh' | 'paper' | 'crosshatch' | 'waves' | 'lines';
  is_light?: boolean;
}

export interface Settings {
  content_language: string;
  quiz_preset?: 'learning' | 'competitive' | 'custom';
  speed_bonus_enabled?: boolean;
  show_correct_to_participants?: boolean;
  show_explanation_to_participants?: boolean;
  show_score_to_participants?: boolean;
  join_mode?: JoinMode;
  participant_limit?: number;
  start_point?: 'beginning' | 'selected';
  aspect_ratio?: '16:9' | '16:10' | '4:3';
}

export interface ActivityMeta {
  activity_id: string; // 16 chars
  name: string;
  created_at: string;
  modified_at: string;
  app_version_created: string;
  app_version_saved: string;
}

export interface ActivityManifest {
  format: 'actvty';
  format_version: number;
  data_schema_version: number;
  meta: ActivityMeta;
  slides: string[]; // ordered slide IDs
  has_roster: boolean;
  requires: Array<{ type_id: string; type_version: number }>;
  media: Array<{
    id: string;
    ext: string;
    media_type: string;
    bytes: number;
    sha256: string;
  }>;
}

export interface RosterEntry {
  id: string; // Participant ID (e.g. STU101)
  name: string; // Full Name
  pin: string; // 8 characters: 4 letters + 4 digits (e.g. ALEX4821)
  joined?: boolean;
  score?: number;
}

export interface ActivityData {
  manifest: ActivityManifest;
  theme: Theme;
  settings: Settings;
  slides: Slide[];
  roster?: RosterEntry[];
}

export interface StoredResponse {
  id: string;
  presentation_id: string;
  slide_id: string;
  step: string;
  participant_id: string;
  participant_number: number;
  participant_name?: string;
  submission_id: string;
  payload: any;
  created_at: string;
  is_correct?: boolean;
  score?: number;
  speed_bonus?: number;
  response_time_ms?: number;
}

export interface QAQuestionItem {
  id: string;
  presentation_id: string;
  slide_id: string;
  participant_id: string;
  author_name: string;
  question: string;
  status: 'received' | 'approved' | 'answered' | 'hidden';
  created_at: string;
  upvotes: number;
  hasUpvoted?: boolean;
}

export interface LeaderboardEntry {
  participant_id: string;
  participant_number: number;
  name: string;
  total_score: number;
  correct_count: number;
  rank: number;
}

export interface AggregatePollResult {
  option_id: string;
  count: number;
  percentage: number;
}

export interface WordCloudItem {
  text: string;
  count: number;
}

export interface PresentationState {
  is_live: boolean;
  presentation_id: string | null;
  activity_id: string;
  join_code: string;
  join_url: string;
  join_mode: JoinMode;
  participant_limit: number;
  current_slide_index: number;
  current_step: string;
  accepting_responses: boolean;
  is_closing: boolean;
  close_deadline_ms?: number | null;
  timer_active: boolean;
  timer_paused?: boolean;
  remaining_seconds: number | null;
  results_visible_on_projector: boolean;
  is_blanked: boolean;
  is_frozen: boolean;
  active_participants: number;
  answered_count: number;
  stored_count: number;
  rev: number;
}

// WebSocket protocol views
export interface ParticipantView {
  type: 'view';
  rev: number;
  presentation: {
    state: 'lobby' | 'live' | 'ended';
    join_code: string;
    title: string;
  };
  me: {
    id: string;
    number: number;
    name: string | null;
    answered: boolean;
    answer: {
      submission_id: string;
      summary: string;
      payload?: any;
    } | null;
  };
  slide: {
    id: string;
    type_id: SlideTypeId;
    step: string;
    screen: 'interact' | 'wait' | 'closed' | 'main_screen' | 'results';
    accepting: boolean;
    closing: boolean;
    timer_active?: boolean;
    timer_paused?: boolean;
    remaining_ms: number | null;
    content: any;
    user_score?: {
      points: number;
      speed_bonus: number;
      is_correct?: boolean;
    };
  } | null;
}

export interface ProjectorView {
  type: 'view';
  rev: number;
  audience: 'projector';
  join: {
    code: string;
    url: string;
    qr_payload: string;
  };
  presentation: {
    state: 'lobby' | 'live' | 'blank' | 'frozen' | 'ended';
    title: string;
    aspect_ratio?: '16:9' | '16:10' | '4:3';
  };
  counters: {
    active: number;
    answered: number;
    stored: number;
  };
  slide: {
    id: string;
    type_id: SlideTypeId;
    step: string;
    timer_active?: boolean;
    timer_paused?: boolean;
    remaining_ms: number | null;
    results_visible: boolean;
    content: any;
    aggregates: any;
  } | null;
  theme: Theme;
}
