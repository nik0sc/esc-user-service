-- ticket.lepak.sg:7707/user1

drop database `user1`;
create database `user1`
	character set utf8mb4 
	collate utf8mb4_unicode_ci;
use `user1`;

-- Use accenture user management
create table users (
	id integer primary key auto_increment,
    username varchar(100) unique not null,
    long_name varchar(100) not null,
    email varchar(100) not null,
    phone varchar(100) not null,
    acn_id varchar(20) unique not null,		    -- objectId
	acn_session_token varchar(100),				-- sessionToken
    acn_session_token_expiry datetime,	        -- token expiry (UTC)
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
    foreign key fk_admin_team_relation_teams_id (team_id) references teams(id)
        on delete cascade,      -- Delete team should remove itself from its members
    foreign key fk_admin_team_relation_users_id (admin_id) references users(id)
        on delete cascade,      -- Delete user should remove them from their teams
    primary key (team_id, admin_id)
);
