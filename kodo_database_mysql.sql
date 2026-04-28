-- ============================================================================
-- KODO TEAM MANAGEMENT - DATABASE SCHEMA
-- Microsoft Teams-inspired Team Management System
-- Version: 1.0.0
-- Database: MySQL 8.0+ / MariaDB 10.5+
-- ============================================================================

-- Adatbázis létrehozása és kiválasztása
CREATE DATABASE IF NOT EXISTS `kodo_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `kodo_db`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- 1. CORE USER MANAGEMENT
-- ============================================================================

-- Users tábla - központi felhasználói adatok
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `username` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `display_name` VARCHAR(150) DEFAULT NULL,
    `job_title` VARCHAR(100) DEFAULT NULL,
    `department` VARCHAR(100) DEFAULT NULL,
    `phone_number` VARCHAR(50) DEFAULT NULL,
    `avatar_url` VARCHAR(500) DEFAULT NULL,
    `cover_image_url` VARCHAR(500) DEFAULT NULL,
    `bio` TEXT DEFAULT NULL,
    `timezone` VARCHAR(50) DEFAULT 'Europe/Budapest',
    `locale` VARCHAR(10) DEFAULT 'hu',

    -- Online presence (Teams-szerű jelenlét kezelés)
    `presence_status` ENUM('online', 'away', 'busy', 'dnd', 'brb', 'offline', 'invisible') DEFAULT 'offline',
    `presence_message` VARCHAR(255) DEFAULT NULL,
    `presence_expiry` DATETIME DEFAULT NULL,
    `last_seen_at` DATETIME DEFAULT NULL,

    -- Account status
    `is_active` TINYINT(1) DEFAULT 1,
    `is_verified` TINYINT(1) DEFAULT 0,
    `is_admin` TINYINT(1) DEFAULT 0,

    -- Timestamps
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME DEFAULT NULL,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_users_email` (`email`),
    UNIQUE KEY `uk_users_username` (`username`),
    KEY `idx_users_presence` (`presence_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User sessions - munkamenet kezelés
DROP TABLE IF EXISTS `user_sessions`;
CREATE TABLE `user_sessions` (
    `id` CHAR(36) NOT NULL,
    `user_id` INT UNSIGNED NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `device_info` JSON DEFAULT NULL,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `last_activity_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `expires_at` DATETIME NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    KEY `idx_sessions_user` (`user_id`),
    KEY `idx_sessions_token` (`token_hash`),
    CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. ORGANIZATION & WORKSPACE
-- ============================================================================

-- Organizations - Szervezetek
DROP TABLE IF EXISTS `organizations`;
CREATE TABLE `organizations` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `logo_url` VARCHAR(500) DEFAULT NULL,
    `domain` VARCHAR(255) DEFAULT NULL,

    -- Settings
    `settings` JSON DEFAULT NULL,
    `allowed_email_domains` JSON DEFAULT NULL,

    -- Subscription
    `plan_type` ENUM('free', 'standard', 'business', 'pro', 'enterprise') DEFAULT 'free',
    `max_members` INT DEFAULT 50,
    `max_storage_gb` INT DEFAULT 5,

    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME DEFAULT NULL,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_organizations_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. TEAMS
-- ============================================================================

-- Teams - Csapatok
DROP TABLE IF EXISTS `teams`;
CREATE TABLE `teams` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` INT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `icon_url` VARCHAR(500) DEFAULT NULL,
    `color` VARCHAR(7) DEFAULT '#7360F9',

    -- Team settings
    `visibility` ENUM('public', 'private', 'hidden') DEFAULT 'private',

    -- Archive/Delete
    `is_archived` TINYINT(1) DEFAULT 0,
    `is_default` TINYINT(1) DEFAULT 0,
    `archived_at` DATETIME DEFAULT NULL,
    `archived_by` INT UNSIGNED DEFAULT NULL,

    `created_by` INT UNSIGNED NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME DEFAULT NULL,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_teams_slug` (`organization_id`, `slug`),
    KEY `idx_teams_org` (`organization_id`),
    KEY `idx_teams_visibility` (`visibility`),
    CONSTRAINT `fk_teams_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_teams_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
    CONSTRAINT `fk_teams_archived_by` FOREIGN KEY (`archived_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Team members - csapattagság
DROP TABLE IF EXISTS `team_members`;
CREATE TABLE `team_members` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `team_id` INT UNSIGNED NOT NULL,
    `user_id` INT UNSIGNED NOT NULL,
    `role` ENUM('owner', 'admin', 'member', 'guest') DEFAULT 'member',

    -- Notification preferences
    `notification_level` ENUM('all', 'mentions', 'none') DEFAULT 'all',
    `is_favorite` TINYINT(1) DEFAULT 0,
    `is_muted` TINYINT(1) DEFAULT 0,

    `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `invited_by` INT UNSIGNED DEFAULT NULL,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_team_members` (`team_id`, `user_id`),
    KEY `idx_team_members_user` (`user_id`),
    CONSTRAINT `fk_team_members_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_team_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_team_members_invited` FOREIGN KEY (`invited_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. CHANNELS
-- ============================================================================

-- Channels - Csatornák a csapatokon belül
DROP TABLE IF EXISTS `channels`;
CREATE TABLE `channels` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `team_id` INT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT DEFAULT NULL,

    -- Channel type
    `channel_type` ENUM('general', 'standard', 'public', 'private', 'announcement') DEFAULT 'standard',

    -- Settings
    `is_default` TINYINT(1) DEFAULT 0,
    `allow_threads` TINYINT(1) DEFAULT 1,
    `allow_reactions` TINYINT(1) DEFAULT 1,
    `allow_mentions` TINYINT(1) DEFAULT 1,

    `created_by` INT UNSIGNED NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME DEFAULT NULL,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_channels_slug` (`team_id`, `slug`),
    KEY `idx_channels_team` (`team_id`),
    CONSTRAINT `fk_channels_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_channels_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. DIRECT MESSAGES
-- ============================================================================

-- Conversations - DM és group chat
DROP TABLE IF EXISTS `conversations`;
CREATE TABLE `conversations` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `conversation_type` ENUM('direct', 'group') DEFAULT 'direct',

    -- For group chats
    `name` VARCHAR(255) DEFAULT NULL,
    `icon_url` VARCHAR(500) DEFAULT NULL,

    `created_by` INT UNSIGNED DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    CONSTRAINT `fk_conversations_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conversation participants
DROP TABLE IF EXISTS `conversation_participants`;
CREATE TABLE `conversation_participants` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `conversation_id` INT UNSIGNED NOT NULL,
    `user_id` INT UNSIGNED NOT NULL,

    `role` ENUM('admin', 'member') DEFAULT 'member',

    `is_muted` TINYINT(1) DEFAULT 0,
    `last_read_at` DATETIME DEFAULT NULL,
    `last_read_message_id` INT UNSIGNED DEFAULT NULL,

    `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `left_at` DATETIME DEFAULT NULL,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_conv_participants` (`conversation_id`, `user_id`),
    KEY `idx_conv_participants_user` (`user_id`),
    CONSTRAINT `fk_conv_participants_conv` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_conv_participants_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. MESSAGING SYSTEM
-- ============================================================================

-- Messages - Üzenetek
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,

    -- Message location (egyik kötelező)
    `channel_id` INT UNSIGNED DEFAULT NULL,
    `conversation_id` INT UNSIGNED DEFAULT NULL,

    -- Thread support
    `parent_message_id` INT UNSIGNED DEFAULT NULL,
    `thread_reply_count` INT DEFAULT 0,
    `thread_last_reply_at` DATETIME DEFAULT NULL,

    -- Sender
    `sender_id` INT UNSIGNED NOT NULL,

    -- Content
    `content` TEXT DEFAULT NULL,
    `content_type` ENUM('text', 'rich_text', 'code', 'system', 'mixed') DEFAULT 'text',
    `formatted_content` JSON DEFAULT NULL,

    -- Attachments
    `has_attachments` TINYINT(1) DEFAULT 0,

    -- Status flags
    `is_pinned` TINYINT(1) DEFAULT 0,
    `is_announcement` TINYINT(1) DEFAULT 0,
    `is_edited` TINYINT(1) DEFAULT 0,
    `edited_at` DATETIME DEFAULT NULL,

    -- Metadata
    `metadata` JSON DEFAULT NULL,

    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `deleted_at` DATETIME DEFAULT NULL,

    PRIMARY KEY (`id`),
    KEY `idx_messages_channel` (`channel_id`, `created_at`),
    KEY `idx_messages_conversation` (`conversation_id`, `created_at`),
    KEY `idx_messages_thread` (`parent_message_id`),
    KEY `idx_messages_sender` (`sender_id`),
    CONSTRAINT `fk_messages_channel` FOREIGN KEY (`channel_id`) REFERENCES `channels` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_messages_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_messages_parent` FOREIGN KEY (`parent_message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Message attachments - Csatolmányok
DROP TABLE IF EXISTS `message_attachments`;
CREATE TABLE `message_attachments` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `message_id` INT UNSIGNED NOT NULL,

    `file_name` VARCHAR(255) NOT NULL,
    `file_type` VARCHAR(100) DEFAULT NULL,
    `file_size` BIGINT UNSIGNED DEFAULT NULL,
    `file_url` VARCHAR(500) NOT NULL,
    `thumbnail_url` VARCHAR(500) DEFAULT NULL,

    -- For images/videos
    `width` INT UNSIGNED DEFAULT NULL,
    `height` INT UNSIGNED DEFAULT NULL,
    `duration_seconds` INT UNSIGNED DEFAULT NULL,

    `uploaded_by` INT UNSIGNED NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    KEY `idx_attachments_message` (`message_id`),
    CONSTRAINT `fk_attachments_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_attachments_uploader` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Message reactions - Reakciók
DROP TABLE IF EXISTS `message_reactions`;
CREATE TABLE `message_reactions` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `message_id` INT UNSIGNED NOT NULL,
    `user_id` INT UNSIGNED NOT NULL,
    `emoji` VARCHAR(50) NOT NULL,

    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_reactions` (`message_id`, `user_id`, `emoji`),
    KEY `idx_reactions_message` (`message_id`),
    CONSTRAINT `fk_reactions_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_reactions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Message mentions - Említések
DROP TABLE IF EXISTS `message_mentions`;
CREATE TABLE `message_mentions` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `message_id` INT UNSIGNED NOT NULL,
    `mention_type` ENUM('user', 'team', 'channel', 'everyone', 'here') NOT NULL,
    `mentioned_id` INT UNSIGNED DEFAULT NULL,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_mentions` (`message_id`, `mention_type`, `mentioned_id`),
    KEY `idx_mentions_message` (`message_id`),
    CONSTRAINT `fk_mentions_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. PROJECT MANAGEMENT
-- ============================================================================

-- Projects - Projektek
DROP TABLE IF EXISTS `projects`;
CREATE TABLE `projects` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `team_id` INT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `color` VARCHAR(7) DEFAULT '#7360F9',
    `icon` VARCHAR(50) DEFAULT NULL,

    -- Project type
    `project_type` ENUM('kanban', 'list', 'timeline', 'calendar') DEFAULT 'kanban',

    -- Status
    `status` ENUM('planning', 'active', 'on_hold', 'completed', 'archived') DEFAULT 'active',

    -- Dates
    `start_date` DATE DEFAULT NULL,
    `target_end_date` DATE DEFAULT NULL,
    `actual_end_date` DATE DEFAULT NULL,

    -- Progress (0-100)
    `progress` TINYINT UNSIGNED DEFAULT 0,

    -- Settings
    `settings` JSON DEFAULT NULL,

    `created_by` INT UNSIGNED NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME DEFAULT NULL,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_projects_slug` (`team_id`, `slug`),
    KEY `idx_projects_team` (`team_id`),
    CONSTRAINT `fk_projects_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_projects_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Task buckets - Kanban oszlopok
DROP TABLE IF EXISTS `task_buckets`;
CREATE TABLE `task_buckets` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `project_id` INT UNSIGNED NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `key` VARCHAR(50) DEFAULT NULL,
    `color` VARCHAR(7) DEFAULT NULL,
    `position` INT DEFAULT 0,

    -- WIP limit
    `wip_limit` INT UNSIGNED DEFAULT NULL,

    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    KEY `idx_buckets_project` (`project_id`),
    CONSTRAINT `fk_buckets_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tasks - Feladatok
DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `project_id` INT UNSIGNED NOT NULL,
    `bucket_id` INT UNSIGNED DEFAULT NULL,
    `parent_task_id` INT UNSIGNED DEFAULT NULL,

    -- Basic info
    `title` VARCHAR(500) NOT NULL,
    `description` TEXT DEFAULT NULL,

    -- Status & Priority
    `status` ENUM('todo', 'in_progress', 'in_review', 'done', 'blocked', 'cancelled') DEFAULT 'todo',
    `priority` ENUM('urgent', 'high', 'medium', 'low', 'none') DEFAULT 'medium',

    -- Dates
    `start_date` DATE DEFAULT NULL,
    `due_date` DATE DEFAULT NULL,
    `completed_at` DATETIME DEFAULT NULL,

    -- Effort tracking
    `estimated_hours` DECIMAL(10,2) DEFAULT NULL,
    `actual_hours` DECIMAL(10,2) DEFAULT NULL,

    -- Progress (0-100)
    `progress` TINYINT UNSIGNED DEFAULT 0,

    -- Position in bucket/list
    `position` INT DEFAULT 0,

    -- Labels/Tags (JSON array)
    `labels` JSON DEFAULT NULL,

    -- Metadata
    `metadata` JSON DEFAULT NULL,

    `created_by` INT UNSIGNED NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME DEFAULT NULL,

    PRIMARY KEY (`id`),
    KEY `idx_tasks_project` (`project_id`),
    KEY `idx_tasks_bucket` (`bucket_id`),
    KEY `idx_tasks_status` (`status`),
    KEY `idx_tasks_due_date` (`due_date`),
    KEY `idx_tasks_parent` (`parent_task_id`),
    CONSTRAINT `fk_tasks_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_tasks_bucket` FOREIGN KEY (`bucket_id`) REFERENCES `task_buckets` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_tasks_parent` FOREIGN KEY (`parent_task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_tasks_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Task assignees - Feladat felelősök
DROP TABLE IF EXISTS `task_assignees`;
CREATE TABLE `task_assignees` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `task_id` INT UNSIGNED NOT NULL,
    `user_id` INT UNSIGNED NOT NULL,
    `assigned_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `assigned_by` INT UNSIGNED DEFAULT NULL,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_task_assignees` (`task_id`, `user_id`),
    KEY `idx_task_assignees_user` (`user_id`),
    CONSTRAINT `fk_task_assignees_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_task_assignees_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_task_assignees_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Task checklists - Ellenőrzőlisták
DROP TABLE IF EXISTS `task_checklists`;
CREATE TABLE `task_checklists` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `task_id` INT UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `position` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    KEY `idx_task_checklists_task` (`task_id`),
    CONSTRAINT `fk_task_checklists_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Task checklist items
DROP TABLE IF EXISTS `task_checklist_items`;
CREATE TABLE `task_checklist_items` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `checklist_id` INT UNSIGNED NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `is_completed` TINYINT(1) DEFAULT 0,
    `completed_at` DATETIME DEFAULT NULL,
    `completed_by` INT UNSIGNED DEFAULT NULL,
    `position` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    KEY `idx_checklist_items_checklist` (`checklist_id`),
    CONSTRAINT `fk_checklist_items_checklist` FOREIGN KEY (`checklist_id`) REFERENCES `task_checklists` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_checklist_items_completed_by` FOREIGN KEY (`completed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. CALENDAR & EVENTS
-- ============================================================================

-- Calendar events - Naptár események
DROP TABLE IF EXISTS `calendar_events`;
CREATE TABLE `calendar_events` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,

    -- Event can belong to team or channel
    `team_id` INT UNSIGNED DEFAULT NULL,
    `channel_id` INT UNSIGNED DEFAULT NULL,
    `organizer_id` INT UNSIGNED NOT NULL,

    `title` VARCHAR(255) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `location` VARCHAR(500) DEFAULT NULL,

    -- Online meeting
    `is_online_meeting` TINYINT(1) DEFAULT 0,
    `meeting_url` VARCHAR(500) DEFAULT NULL,
    `meeting_id` VARCHAR(100) DEFAULT NULL,

    -- Timing
    `start_time` DATETIME NOT NULL,
    `end_time` DATETIME NOT NULL,
    `is_all_day` TINYINT(1) DEFAULT 0,
    `timezone` VARCHAR(50) DEFAULT 'Europe/Budapest',

    -- Recurrence
    `is_recurring` TINYINT(1) DEFAULT 0,
    `recurrence_rule` VARCHAR(500) DEFAULT NULL,
    `recurrence_end_date` DATE DEFAULT NULL,
    `parent_event_id` INT UNSIGNED DEFAULT NULL,

    -- Status
    `status` ENUM('tentative', 'confirmed', 'cancelled') DEFAULT 'confirmed',

    -- Reminder
    `reminder_minutes` INT DEFAULT 15,

    -- Color/Category
    `color` VARCHAR(7) DEFAULT NULL,
    `category` VARCHAR(100) DEFAULT NULL,

    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME DEFAULT NULL,

    PRIMARY KEY (`id`),
    KEY `idx_events_team` (`team_id`),
    KEY `idx_events_organizer` (`organizer_id`),
    KEY `idx_events_time` (`start_time`, `end_time`),
    CONSTRAINT `fk_events_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_events_channel` FOREIGN KEY (`channel_id`) REFERENCES `channels` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_events_organizer` FOREIGN KEY (`organizer_id`) REFERENCES `users` (`id`),
    CONSTRAINT `fk_events_parent` FOREIGN KEY (`parent_event_id`) REFERENCES `calendar_events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Event attendees - Résztvevők
DROP TABLE IF EXISTS `event_attendees`;
CREATE TABLE `event_attendees` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `event_id` INT UNSIGNED NOT NULL,
    `user_id` INT UNSIGNED NOT NULL,

    `response_status` ENUM('pending', 'accepted', 'declined', 'tentative') DEFAULT 'pending',
    `is_required` TINYINT(1) DEFAULT 1,
    `responded_at` DATETIME DEFAULT NULL,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_event_attendees` (`event_id`, `user_id`),
    KEY `idx_attendees_user` (`user_id`),
    CONSTRAINT `fk_attendees_event` FOREIGN KEY (`event_id`) REFERENCES `calendar_events` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_attendees_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. FILES & DOCUMENTS
-- ============================================================================

-- Files - Fájlok
DROP TABLE IF EXISTS `files`;
CREATE TABLE `files` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,

    -- File location
    `team_id` INT UNSIGNED DEFAULT NULL,
    `channel_id` INT UNSIGNED DEFAULT NULL,
    `folder_id` INT UNSIGNED DEFAULT NULL,

    -- File info
    `name` VARCHAR(255) NOT NULL,
    `file_type` ENUM('file', 'folder', 'link') DEFAULT 'file',
    `mime_type` VARCHAR(100) DEFAULT NULL,
    `size_bytes` BIGINT UNSIGNED DEFAULT NULL,

    -- Storage
    `storage_path` VARCHAR(500) DEFAULT NULL,
    `storage_provider` VARCHAR(50) DEFAULT 'local',
    `public_url` VARCHAR(500) DEFAULT NULL,

    -- Versioning
    `version` INT UNSIGNED DEFAULT 1,
    `parent_version_id` INT UNSIGNED DEFAULT NULL,

    -- Metadata
    `metadata` JSON DEFAULT NULL,

    `uploaded_by` INT UNSIGNED NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME DEFAULT NULL,

    PRIMARY KEY (`id`),
    KEY `idx_files_team` (`team_id`),
    KEY `idx_files_channel` (`channel_id`),
    KEY `idx_files_folder` (`folder_id`),
    CONSTRAINT `fk_files_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_files_channel` FOREIGN KEY (`channel_id`) REFERENCES `channels` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_files_folder` FOREIGN KEY (`folder_id`) REFERENCES `files` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_files_parent_version` FOREIGN KEY (`parent_version_id`) REFERENCES `files` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_files_uploader` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 10. NOTIFICATIONS
-- ============================================================================

-- Notifications - Értesítések
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL,

    -- Notification type
    `notification_type` VARCHAR(50) NOT NULL,

    -- Source references
    `actor_id` INT UNSIGNED DEFAULT NULL,
    `team_id` INT UNSIGNED DEFAULT NULL,
    `channel_id` INT UNSIGNED DEFAULT NULL,
    `message_id` INT UNSIGNED DEFAULT NULL,
    `task_id` INT UNSIGNED DEFAULT NULL,
    `event_id` INT UNSIGNED DEFAULT NULL,

    -- Content
    `title` VARCHAR(255) NOT NULL,
    `body` TEXT DEFAULT NULL,
    `action_url` VARCHAR(500) DEFAULT NULL,

    -- Status
    `is_read` TINYINT(1) DEFAULT 0,
    `read_at` DATETIME DEFAULT NULL,

    -- Delivery
    `is_push_sent` TINYINT(1) DEFAULT 0,
    `is_email_sent` TINYINT(1) DEFAULT 0,

    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    KEY `idx_notifications_user` (`user_id`, `is_read`, `created_at`),
    CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_notifications_actor` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_notifications_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_notifications_channel` FOREIGN KEY (`channel_id`) REFERENCES `channels` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_notifications_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_notifications_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_notifications_event` FOREIGN KEY (`event_id`) REFERENCES `calendar_events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 11. USER SETTINGS & PREFERENCES
-- ============================================================================

-- User settings - Felhasználói beállítások
DROP TABLE IF EXISTS `user_settings`;
CREATE TABLE `user_settings` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL,

    -- Display
    `theme` ENUM('dark', 'light', 'system') DEFAULT 'dark',
    `language` VARCHAR(10) DEFAULT 'hu',
    `date_format` VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    `time_format` ENUM('12h', '24h') DEFAULT '24h',

    -- Notifications
    `notifications_enabled` TINYINT(1) DEFAULT 1,
    `email_notifications` TINYINT(1) DEFAULT 1,
    `push_notifications` TINYINT(1) DEFAULT 1,
    `notification_sound` TINYINT(1) DEFAULT 1,
    `desktop_notifications` TINYINT(1) DEFAULT 1,

    -- Do Not Disturb schedule
    `dnd_enabled` TINYINT(1) DEFAULT 0,
    `dnd_start_time` TIME DEFAULT NULL,
    `dnd_end_time` TIME DEFAULT NULL,

    -- Chat settings
    `enter_to_send` TINYINT(1) DEFAULT 1,
    `show_typing_indicator` TINYINT(1) DEFAULT 1,
    `show_read_receipts` TINYINT(1) DEFAULT 1,

    -- Accessibility
    `reduce_motion` TINYINT(1) DEFAULT 0,
    `high_contrast` TINYINT(1) DEFAULT 0,
    `font_size` ENUM('small', 'medium', 'large', 'xlarge') DEFAULT 'medium',

    -- Privacy
    `show_online_status` TINYINT(1) DEFAULT 1,
    `allow_direct_messages` ENUM('everyone', 'team_members', 'nobody') DEFAULT 'everyone',

    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_settings_user` (`user_id`),
    CONSTRAINT `fk_user_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 12. TIME TRACKING
-- ============================================================================

-- Time entries - Időkövetés
DROP TABLE IF EXISTS `time_entries`;
CREATE TABLE `time_entries` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL,

    -- Link to task or project
    `task_id` INT UNSIGNED DEFAULT NULL,
    `project_id` INT UNSIGNED DEFAULT NULL,

    `description` TEXT DEFAULT NULL,

    -- Time
    `start_time` DATETIME NOT NULL,
    `end_time` DATETIME DEFAULT NULL,
    `duration_minutes` INT UNSIGNED DEFAULT NULL,

    -- Status
    `is_running` TINYINT(1) DEFAULT 0,
    `is_billable` TINYINT(1) DEFAULT 0,

    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    KEY `idx_time_entries_user` (`user_id`, `start_time`),
    KEY `idx_time_entries_task` (`task_id`),
    KEY `idx_time_entries_project` (`project_id`),
    CONSTRAINT `fk_time_entries_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_time_entries_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_time_entries_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 13. FRIENDSHIPS & CONTACTS
-- ============================================================================

-- Friendships - Baráti kapcsolatok
DROP TABLE IF EXISTS `friendships`;
CREATE TABLE `friendships` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `requester_id` INT UNSIGNED NOT NULL,
    `addressee_id` INT UNSIGNED NOT NULL,

    `status` ENUM('pending', 'accepted', 'blocked', 'declined') DEFAULT 'pending',

    -- Blocking
    `blocked_by` INT UNSIGNED DEFAULT NULL,

    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_friendships` (`requester_id`, `addressee_id`),
    KEY `idx_friendships_addressee` (`addressee_id`),
    CONSTRAINT `fk_friendships_requester` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_friendships_addressee` FOREIGN KEY (`addressee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_friendships_blocked_by` FOREIGN KEY (`blocked_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 14. FULL-TEXT SEARCH INDEX
-- ============================================================================

ALTER TABLE `messages` ADD FULLTEXT INDEX `ft_messages_content` (`content`);

-- ============================================================================
-- 15. USEFUL VIEWS
-- ============================================================================

-- Active team members with user info
CREATE OR REPLACE VIEW `v_team_members_active` AS
SELECT
    tm.team_id,
    tm.user_id,
    tm.role,
    tm.joined_at,
    u.username,
    u.display_name,
    u.email,
    u.avatar_url,
    u.presence_status,
    u.job_title
FROM team_members tm
JOIN users u ON tm.user_id = u.id
WHERE u.deleted_at IS NULL;

-- Task summary per project
CREATE OR REPLACE VIEW `v_project_task_summary` AS
SELECT
    p.id AS project_id,
    p.name AS project_name,
    p.team_id,
    COUNT(t.id) AS total_tasks,
    SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) AS todo_count,
    SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_count,
    SUM(CASE WHEN t.status = 'in_review' THEN 1 ELSE 0 END) AS in_review_count,
    SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS done_count,
    SUM(CASE WHEN t.status = 'blocked' THEN 1 ELSE 0 END) AS blocked_count,
    ROUND(
        SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) /
        NULLIF(COUNT(t.id), 0) * 100, 2
    ) AS completion_percentage
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id AND t.deleted_at IS NULL
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.name, p.team_id;

-- ============================================================================
-- RE-ENABLE FOREIGN KEY CHECKS
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- END OF SCHEMA — 25 tábla + 2 view létrehozva a kodo_db adatbázisban
-- ============================================================================
