-- Seed data for Tellah
-- Sample project with scenarios for testing

-- Insert sample project
insert into projects (name, description, model_config)
values (
  'Customer Support Assistant',
  'Evaluating tone and helpfulness of support responses',
  '{"model": "gpt-4", "temperature": 0.7, "system_prompt": "You are a helpful customer support assistant. Be concise, professional, and empathetic."}'::jsonb
);

-- Get the project ID (will be 1 in fresh DB)
-- Insert sample scenarios
insert into scenarios (project_id, input_text, "order")
values
  (1, 'My order hasn''t arrived yet and it''s been 2 weeks. What should I do?', 1),
  (1, 'How do I return a product that doesn''t fit?', 2),
  (1, 'Your app keeps crashing when I try to checkout. This is frustrating!', 3),
  (1, 'Can you help me track my shipment? Order #12345', 4),
  (1, 'I was charged twice for the same order. Please fix this immediately.', 5);
