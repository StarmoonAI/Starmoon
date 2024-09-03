-- Insert data into the public.toys table first
INSERT INTO
public.toys (toy_id, name, prompt, third_person_prompt, image_src)
VALUES
('0897f2f8-5d76-4e1e-aff5-71f76c7d61f5',
'Papa John',
'You are Aria''s daddy and Mama Mia''s husband.',
'Papa John is Aria''s daddy and Mama Mia''s husband.',
'papa_john'),
('78330e39-92d6-4d7e-ab72-b425bdc86d97',
'Aria',
'You are Mama Mia''s and Papa John''s child.',
'Aria is Mama Mia''s and Papa John''s child.',
'aria'),
('14d91296-eb6b-41d7-964c-856a8614d80e',
'Mama Mia',
'You are Aria''s mommy and Papa John''s wife.',
'Mama Mia is Aria''s mommy and Papa John''s wife.',
'mama_mia');

-- Insert data into the auth.users table
INSERT INTO
"auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at") VALUES
('00000000-0000-0000-0000-000000000000', '5af62b0e-3da4-4c44-adf7-5b1b7c9c4cb6', 'authenticated', 'authenticated', 'admin@starmoon.app', crypt('admin', gen_salt('bf')), '2024-01-01 22:27:00.166861+00', NULL, '', NULL, 'e91d41043ca2c83c3be5a6ee7a4abc8a4f4fa2afc0a8453c502af931', '2024-01-01 16:22:13.780421+00', '', '', NULL, '2024-01-01 23:21:12.077887+00', '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2024-01-01 22:27:00.158026+00', '2024-01-01 17:40:15.332205+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL);

-- Insert data into the auth.identities table
INSERT INTO
"auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id")
VALUES
('5af62b0e-3da4-4c44-adf7-5b1b7c9c4cb6', '5af62b0e-3da4-4c44-adf7-5b1b7c9c4cb6', '{"sub": "5af62b0e-3da4-4c44-adf7-5b1b7c9c4cb6", "email": "admin@starmoon.app", "email_verified": false, "phone_verified": false}', 'email', '2024-01-01 22:27:00.163787+00', '2024-01-01 22:27:00.163855+00', '2024-01-01 22:27:00.163855+00', '35f91d2f-db60-474c-8dd2-3fcbed9869bd');

-- Insert data into the public.users table
INSERT INTO
public.users (user_id, toy_name, toy_id, email, modules, most_recent_chat_group_id, session_time, supervisor_name, supervisee_name, supervisee_persona, supervisee_age)
VALUES
('5af62b0e-3da4-4c44-adf7-5b1b7c9c4cb6', 'Papa John', '0897f2f8-5d76-4e1e-aff5-71f76c7d61f5', 'admin@starmoon.app', NULL, NULL, 0, 'Parent', 'Child', '', 5);

-- -- Add the foreign key constraint to the public.users table
-- ALTER TABLE public.users
-- ADD CONSTRAINT fk_toy_id
-- FOREIGN KEY (toy_id) REFERENCES public.toys(toy_id);