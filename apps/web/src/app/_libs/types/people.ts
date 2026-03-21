import type { Database } from "@/app/_libs/types/database.types";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type LoggedItemRow = Database["public"]["Tables"]["logged_items"]["Row"];
type MessageReactionRow = Database["public"]["Tables"]["message_reactions"]["Row"];
type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];

// Normalised profile shape — DB has a typo `avtar_url`; all app code uses `avatar_url`.
type AppProfile = Pick<ProfileRow, "id"> & {
  display_name: string | null;
  avatar_url: string | null; // aliased from DB's `avtar_url`
  handle: string;
};

export type DMConversation = Pick<ConversationRow, "id"> & {
  otherUser: AppProfile;
  lastMessage: { text: string; sentAt: string } | null;
};

export type DMMessage = Pick<
  MessageRow,
  "id" | "convo_id" | "sender_id" | "message_parent_id" | "created_at"
> & {
  // DB column is non-null with a default, but semantically nullable for logged_item messages
  message_text: MessageRow["message_text"] | null;
  message_type: NonNullable<MessageRow["message_type"]>;
  sender: AppProfile;
  item:
    | (Pick<LoggedItemRow, "url" | "preview_image_url" | "description"> & {
        title: string | null;
      })
    | null;
  reactions: Array<Pick<MessageReactionRow, "emoji" | "user_id">>;
};
