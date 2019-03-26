select users.username, chat_messages.message, chat_messages.sent_time
from chat_messages
    inner join users
    on chat_messages.sent_user_id = users.id
where chatroom_id = 1
order by sent_time asc;

-- # username, message, sent_time
-- 'zhubo', 'Hello, what seems to be the problem?', '2019-03-01 16:32:01'
-- 'nikos', 'I generated a token using the admin panel but I can\'t authenticate using it!', '2019-03-01 19:00:52'
-- 'junwei', 'Ok, we\'re working on it!', '2019-03-02 08:52:31'
-- 'nikos', 'Thanks dudes you da best', '2019-03-02 09:30:02'

