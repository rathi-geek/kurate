export type NotificationActor = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  handle: string | null;
  avatar_url: string | null;
};

export type Notification = {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  event_id: string | null;
  event_type: string;
  is_read: boolean;
  message: string | null;
  created_at: string;
  actors: NotificationActor[];
};
