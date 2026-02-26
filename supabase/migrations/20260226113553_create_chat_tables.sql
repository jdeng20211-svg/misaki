/*
  # Create Chat Application Tables

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key) - Unique conversation identifier
      - `title` (text) - Conversation title
      - `created_at` (timestamptz) - When the conversation was created
      - `updated_at` (timestamptz) - Last message timestamp
    
    - `messages`
      - `id` (uuid, primary key) - Unique message identifier
      - `conversation_id` (uuid, foreign key) - Reference to conversation
      - `role` (text) - Message role (system/user/assistant)
      - `content` (text) - Message content
      - `created_at` (timestamptz) - When the message was sent

  2. Security
    - Enable RLS on both tables
    - Add policies for public access (since no auth is implemented)
    
  3. Indexes
    - Add index on conversation_id for faster message queries
*/

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'New Conversation',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to conversations"
  ON conversations FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to conversations"
  ON conversations FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to conversations"
  ON conversations FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from conversations"
  ON conversations FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to messages"
  ON messages FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to messages"
  ON messages FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to messages"
  ON messages FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from messages"
  ON messages FOR DELETE
  TO anon
  USING (true);