export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      cine_files_targets: {
        Row: {
          cast_names: string[] | null
          country: string | null
          created_at: string | null
          director: string | null
          film_title: string | null
          genres: string[] | null
          id: string
          original_language: string | null
          platforms: string[] | null
          release_date: string | null
          round_id: string | null
          tmdb_id: number | null
          user_id: string | null
        }
        Insert: {
          cast_names?: string[] | null
          country?: string | null
          created_at?: string | null
          director?: string | null
          film_title?: string | null
          genres?: string[] | null
          id?: string
          original_language?: string | null
          platforms?: string[] | null
          release_date?: string | null
          round_id?: string | null
          tmdb_id?: number | null
          user_id?: string | null
        }
        Update: {
          cast_names?: string[] | null
          country?: string | null
          created_at?: string | null
          director?: string | null
          film_title?: string | null
          genres?: string[] | null
          id?: string
          original_language?: string | null
          platforms?: string[] | null
          release_date?: string | null
          round_id?: string | null
          tmdb_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cine_files_targets_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      cine_files_guesses: {
        Row: {
          attempt_number: number | null
          feedback: Json | null
          found: boolean | null
          guess_meta: Json | null
          guessed_at: string | null
          guessed_title: string | null
          guessed_tmdb_id: number | null
          guesser_id: string | null
          id: string
          round_id: string | null
          target_id: string | null
        }
        Insert: {
          attempt_number?: number | null
          feedback?: Json | null
          found?: boolean | null
          guess_meta?: Json | null
          guessed_at?: string | null
          guessed_title?: string | null
          guessed_tmdb_id?: number | null
          guesser_id?: string | null
          id?: string
          round_id?: string | null
          target_id?: string | null
        }
        Update: {
          attempt_number?: number | null
          feedback?: Json | null
          found?: boolean | null
          guess_meta?: Json | null
          guessed_at?: string | null
          guessed_title?: string | null
          guessed_tmdb_id?: number | null
          guesser_id?: string | null
          id?: string
          round_id?: string | null
          target_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cine_files_guesses_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cine_files_guesses_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "cine_files_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      cine_files_hints: {
        Row: {
          actor_name: string | null
          guesser_id: string | null
          id: string
          revealed_at: string | null
          round_id: string | null
          target_id: string | null
        }
        Insert: {
          actor_name?: string | null
          guesser_id?: string | null
          id?: string
          revealed_at?: string | null
          round_id?: string | null
          target_id?: string | null
        }
        Update: {
          actor_name?: string | null
          guesser_id?: string | null
          id?: string
          revealed_at?: string | null
          round_id?: string | null
          target_id?: string | null
        }
        Relationships: []
      }
      league_members: {
        Row: {
          display_name: string
          id: string
          joined_at: string | null
          league_id: string | null
          role: string
          user_id: string | null
        }
        Insert: {
          display_name: string
          id?: string
          joined_at?: string | null
          league_id?: string | null
          role?: string
          user_id?: string | null
        }
        Update: {
          display_name?: string
          id?: string
          joined_at?: string | null
          league_id?: string | null
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "league_members_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          created_at: string | null
          id: string
          invite_code: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invite_code?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invite_code?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          pseudo: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          pseudo?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          pseudo?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rounds: {
        Row: {
          ceremony_at: string
          created_at: string | null
          game_mode: string
          id: string
          league_id: string | null
          status: string
          submission_deadline: string
          theme: string
        }
        Insert: {
          ceremony_at: string
          created_at?: string | null
          game_mode?: string
          id?: string
          league_id?: string | null
          status?: string
          submission_deadline: string
          theme: string
        }
        Update: {
          ceremony_at?: string
          created_at?: string | null
          game_mode?: string
          id?: string
          league_id?: string | null
          status?: string
          submission_deadline?: string
          theme?: string
        }
        Relationships: [
          {
            foreignKeyName: "rounds_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          cast_names: string[] | null
          comment: string | null
          director: string | null
          film_title: string
          id: string
          platforms: string[] | null
          poster_path: string | null
          round_id: string | null
          submitted_at: string | null
          tmdb_id: number | null
          user_id: string | null
        }
        Insert: {
          cast_names?: string[] | null
          comment?: string | null
          director?: string | null
          film_title: string
          id?: string
          platforms?: string[] | null
          poster_path?: string | null
          round_id?: string | null
          submitted_at?: string | null
          tmdb_id?: number | null
          user_id?: string | null
        }
        Update: {
          cast_names?: string[] | null
          comment?: string | null
          director?: string | null
          film_title?: string
          id?: string
          platforms?: string[] | null
          poster_path?: string | null
          round_id?: string | null
          submitted_at?: string | null
          tmdb_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          category_id: string | null
          comment: string | null
          id: string
          round_id: string | null
          submission_id: string | null
          voted_at: string | null
          voter_id: string | null
        }
        Insert: {
          category_id?: string | null
          comment?: string | null
          id?: string
          round_id?: string | null
          submission_id?: string | null
          voted_at?: string | null
          voter_id?: string | null
        }
        Update: {
          category_id?: string | null
          comment?: string | null
          id?: string
          round_id?: string | null
          submission_id?: string | null
          voted_at?: string | null
          voter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_league: {
        Args: { _name: string; _display_name: string }
        Returns: string
      }
      film_already_submitted: {
        Args: { _round_id: string; _tmdb_id: number }
        Returns: boolean
      }
      find_league_by_invite_code: {
        Args: { _code: string }
        Returns: string
      }
      round_credit_overlaps: {
        Args: { _round_id: string; _people: string[] }
        Returns: { person: string; film_title: string }[]
      }
      round_ballot: {
        Args: { _round_id: string }
        Returns: {
          submission_id: string
          film_title: string
          platforms: string[] | null
          poster_path: string | null
        }[]
      }
      is_league_admin: {
        Args: { _league_id: string }
        Returns: boolean
      }
      league_win_history: {
        Args: { _league_id: string }
        Returns: { display_name: string; wins_count: number }[]
      }
      league_members_list: {
        Args: { _league_id: string }
        Returns: {
          id: string
          user_id: string
          display_name: string
          role: string
        }[]
      }
      remove_league_member: {
        Args: { _member_id: string }
        Returns: undefined
      }
      update_round_dates: {
        Args: {
          _round_id: string
          _submission_deadline: string
          _ceremony_at: string
        }
        Returns: undefined
      }
      submit_votes: {
        Args: { _rows: Json }
        Returns: undefined
      }
      round_submission_details: {
        Args: { p_round_id: string }
        Returns: {
          submission_id: string
          film_title: string
          display_name: string | null
          comment: string | null
          poster_path: string | null
        }[]
      }
      round_vote_comments: {
        Args: { _round_id: string }
        Returns: {
          category_id: string
          submission_id: string
          comment: string
        }[]
      }
      round_voters: {
        Args: { _round_id: string }
        Returns: {
          display_name: string
          has_voted: boolean
        }[]
      }
      round_submitters: {
        Args: { _round_id: string }
        Returns: {
          display_name: string
          has_submitted: boolean
        }[]
      }
      round_cine_mysteries: {
        Args: { _round_id: string }
        Returns: {
          target_id: string
          display_name: string
          attempts: number
          found: boolean
        }[]
      }
      compute_cine_score: {
        Args: { _attempts: number }
        Returns: number
      }
      round_cine_files_scores: {
        Args: { _round_id: string }
        Returns: { display_name: string; total_points: number }[]
      }
      league_cine_files_history: {
        Args: { _league_id: string }
        Returns: { display_name: string; total_points: number }[]
      }
      request_cine_bonus_hint: {
        Args: { _target_id: string }
        Returns: string
      }
      round_cine_files_detail: {
        Args: { _round_id: string }
        Returns: {
          display_name: string
          total_points: number
          secret_title: string | null
          mysteries: Json
        }[]
      }
      league_cine_files_detail: {
        Args: { _league_id: string }
        Returns: {
          display_name: string
          total_points: number
          rounds: Json
        }[]
      }
      submit_cine_guess: {
        Args: {
          _target_id: string
          _guessed_tmdb_id: number
          _guessed_title: string
          _guess: Json
        }
        Returns: Json
      }
      get_round_results: {
        Args: { p_round_id: string }
        Returns: {
          category_id: string
          category_name: string
          submission_id: string
          vote_count: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
