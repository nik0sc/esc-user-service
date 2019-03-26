set FOREIGN_KEY_CHECKS = 0;
truncate table users;
truncate table teams;
truncate table admin_team_relation;
truncate table tickets;
truncate table chatrooms;
truncate table chat_messages;
set FOREIGN_KEY_CHECKS = 1;

-- I don't think multi-row insert is standards compliant
insert into users (id, username, acn_id, acn_session_token, acn_session_token_expiry, long_name, user_type, extra) values
(1, 'nikos', 'fake!1', '', '2020-03-12 03:39:30', 'Nikos Chan', 1, null),
(2, 'kim', 'fake!2', '', '2020-03-12 03:39:30', 'Koh Seu Kim', 1, null),
(3, 'zhubo', 'fake!3', '', '2020-03-12 03:39:30', 'Zhu Bo', 2, null),
(4, 'junwei', 'fake!4', '', '2020-03-12 03:39:30', 'Chan Jun Wei', 2, null),
(5, 'cooldude19', '15G8TkGfWe', 'r:85d020c6dbeb6a0680bca1c96487b6ce', '2020-03-12 03:39:30', 'A really cool dude', 1, null);

insert into teams (id, team_name) values 
(1, 'Default Team'),
(2, 'Accenture API');

insert into admin_team_relation (team_id, admin_id) values
(1, 3),
(1, 4);

insert into tickets (id, title, message, open_time, close_time, priority, severity, assigned_team, opener_user) values
(1, 'Cannot log in', 'Help! I can\'t log in using my token.', '2019-03-01 15:23:49', null, 1, 1, 1, 1),
(2, 'Speech analysis is broken', 'The transcriber doesn\'t understand my recording file', '2019-03-02 09:13:20', null, 2, 2, 1, 2);

insert into attachments (id, title, fs_path, upload_time, ticket_id, uploader_user) values 
(1, 'Recording file', 'speech.mp3', '2019-03-02 09:13:20', 2, 2);

insert into chatrooms (id, description, ticket_id) values 
(1, 'Log in problem chat', 1),
(2, 'Speech analysis problem chat', 2);

insert into chat_messages (id, message, sent_time, sent_user_id, chatroom_id) values
(1, 'Hello, what seems to be the problem?', '2019-03-01 16:32:01', 3, 1),
(2, 'I generated a token using the admin panel but I can\'t authenticate using it!', '2019-03-01 19:00:52', 1, 1),
(3, 'Ok, we\'re working on it!', '2019-03-02 08:52:31', 4, 1),
(4, 'I tried to upload a recording but the API said the format was wrong. It was an MP3 file. Any advice?', '2019-03-02 09:20:41', 2, 2),
(5, 'Thanks dudes you da best', '2019-03-02 09:30:02', 1, 1);