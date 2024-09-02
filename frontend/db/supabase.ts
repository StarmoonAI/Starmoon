export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      conversations: {
        Row: {
          chat_group_id: string | null
          content: string
          conversation_id: string
          created_at: string
          metadata: Json | null
          role: string
          toy_id: string
          user_id: string
        }
        Insert: {
          chat_group_id?: string | null
          content: string
          conversation_id?: string
          created_at?: string
          metadata?: Json | null
          role: string
          toy_id?: string
          user_id?: string
        }
        Update: {
          chat_group_id?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          metadata?: Json | null
          role?: string
          toy_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_toy_id_fkey"
            columns: ["toy_id"]
            isOneToOne: false
            referencedRelation: "toys"
            referencedColumns: ["toy_id"]
          },
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      inbound: {
        Row: {
          created_at: string
          email: string | null
          inbound_id: string
          name: string | null
          type: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          inbound_id?: string
          name?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          inbound_id?: string
          name?: string | null
          type?: string | null
        }
        Relationships: []
      }
      insights: {
        Row: {
          created_at: string
          date: string
          insight_id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          insight_id?: string
          metadata: Json
          user_id?: string
        }
        Update: {
          created_at?: string
          date?: string
          insight_id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      toys: {
        Row: {
          created_at: string
          expanded_prompt: string
          hume_ai_config_id: string
          image_src: string
          name: string
          prompt: string
          third_person_prompt: string
          toy_id: string
        }
        Insert: {
          created_at?: string
          expanded_prompt?: string
          hume_ai_config_id?: string
          image_src?: string
          name: string
          prompt: string
          third_person_prompt?: string
          toy_id?: string
        }
        Update: {
          created_at?: string
          expanded_prompt?: string
          hume_ai_config_id?: string
          image_src?: string
          name?: string
          prompt?: string
          third_person_prompt?: string
          toy_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string
          supervisee_age: number
          supervisee_name: string
          supervisee_persona: string
          created_at: string
          email: string
          modules: string[] | null
          most_recent_chat_group_id: string | null
          supervisor_name: string
          session_time: number
          toy_id: string | null
          toy_name: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string
          supervisee_age?: number
          supervisee_name: string
          supervisee_persona: string
          created_at?: string
          email?: string
          modules?: string[] | null
          most_recent_chat_group_id?: string | null
          supervisor_name: string
          session_time?: number
          toy_id?: string | null
          toy_name?: string | null
          user_id?: string
        }
        Update: {
          avatar_url?: string
          supervisee_age?: number
          supervisee_name?: string
          supervisee_persona?: string
          created_at?: string
          email?: string
          modules?: string[] | null
          most_recent_chat_group_id?: string | null
          supervisor_name?: string
          session_time?: number
          toy_id?: string | null
          toy_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_toy_id_fkey"
            columns: ["toy_id"]
            isOneToOne: false
            referencedRelation: "toys"
            referencedColumns: ["toy_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize:
        | {
            Args: {
              "": string
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      halfvec_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      hnsw_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      l2_norm:
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      match_documents: {
        Args: {
          query_embedding: string
          match_count?: number
          filter?: Json
        }
        Returns: {
          id: string
          content: string
          metadata: Json
          embedding: string
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              "": string
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
