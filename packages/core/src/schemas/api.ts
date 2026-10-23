export interface ApiErrorBody {
  statusCode: number;
  /** Short label, e.g. "Not Found". */
  error: string;
  /** Sentence the user can be shown. */
  message: string;
  /** Per-field problems of a rejected form, keyed by field name. */
  fields?: Record<string, string[]>;
}

export interface PublicUser {
  id: number;
  email: string;
  displayName: string | null;
  avatarUrl: string;
}

export interface MeResponse {
  user: PublicUser | null;
}
