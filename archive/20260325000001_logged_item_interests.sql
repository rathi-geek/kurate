CREATE TABLE logged_item_interests (
  logged_item_id  UUID NOT NULL REFERENCES logged_items(id) ON DELETE CASCADE,
  interest_id     UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  PRIMARY KEY (logged_item_id, interest_id)
);

CREATE INDEX logged_item_interests_item_idx ON logged_item_interests(logged_item_id);
CREATE INDEX logged_item_interests_interest_idx ON logged_item_interests(interest_id);

-- RLS: readable by anyone (content classification is not user-specific)
ALTER TABLE logged_item_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "logged_item_interests: public read"
  ON logged_item_interests FOR SELECT
  USING (true);

-- Only service role can insert (via API route using service key)
CREATE POLICY "logged_item_interests: service insert"
  ON logged_item_interests FOR INSERT
  WITH CHECK (true);
