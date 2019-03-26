-- lepak.sg:24573/esc-1

drop database `esc-1`;
create database `esc-1`
	character set utf8mb4 
	collate utf8mb4_unicode_ci;
use `esc-1`;

-- Use accenture user management
create table users (
	id integer primary key auto_increment,
    username varchar(100) not null,
    long_name varchar(100) not null,
    acn_id varchar(100) unique not null,		-- objectId
	acn_session_token varchar(100),				-- sessionToken
    acn_session_token_expiry datetime not null,	-- token expiry (UTC)
    user_type integer not null,					-- normal or admin?
    extra json									-- other stuff from parse api
);

create table teams (
	id integer primary key auto_increment,
    team_name varchar(100) not null    
);

-- This is used to implement the many to many relation
-- between admins and teams
create table admin_team_relation (
	team_id integer not null,
    admin_id integer not null,
    foreign key fk_admin_team_relation_teams_id (team_id) references teams(id),
    foreign key fk_admin_team_relation_users_id (admin_id) references users(id),
    unique (team_id, admin_id)
);

create table tickets (
	id integer primary key auto_increment,
    title varchar(100) not null,
    message varchar(100) not null,
    open_time datetime not null,				-- UTC
    close_time datetime,						-- UTC
    priority integer,
    severity integer,
    assigned_team integer,
    foreign key fk_tickets_teams_id (assigned_team) references teams(id),
    opener_user integer not null,
    foreign key fk_tickets_users_id (opener_user) references users(id)
);

create table attachments (
	id integer primary key auto_increment,
    title varchar(100) not null,
    fs_path varchar(1000) not null,			-- Make sure filesystem and db are consistent (how?)
    upload_time datetime not null,
    ticket_id integer,						-- Careful with this: orphaned attachments that are too old should be deleted
    foreign key fk_attachments_tickets_id (ticket_id) references tickets(id),
    uploader_user integer not null,
    foreign key fk_attachments_users_id (uploader_user) references users(id)
);

create table chatrooms (
	id integer primary key auto_increment,
    description varchar(1000) not null,
    ticket_id integer unique,
    foreign key fk_chatrooms_tickets_id (ticket_id) references tickets(id)
);

create table chat_messages (
	id integer primary key auto_increment,
    message varchar(1000) not null,
    sent_time datetime not null,			-- UTC
    sent_user_id integer not null,
    foreign key fk_chat_messages_users_id (sent_user_id) references users(id),
    chatroom_id integer not null,
    foreign key fk_chat_messages_chatrooms_id (chatroom_id) references chatrooms(id)
);


