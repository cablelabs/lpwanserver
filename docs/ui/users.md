---
id: users
title: Users and Authentication
sidebar_label: Users and Authentication
---

## User Roles

The **LPWAN Server UI** supports management of the **LPWAN Server** by
system administrators.  Non-admin users are able to manage applications
and devices.

System administrators are users that have been designated
as "Admin".  Logging in as a system administrator enables a menu at the top of
the screen that allows for provisioning various aspects of the system.  They
can also see the applications, devices, etc. created by all users.

Any errors detected by the system will display in a red box at the top of the
screen.  Some of these errors may reflect errors in working with a remote
network.  For these errors, it is usually best to return to the UI at a later
time and "Push" the data you updated to the remote server.

For more details, please use the menu to the left to select your area of
interest.

## Login

User logins occur much as they do on any other system.  Enter your username and
password and hit "SUBMIT".

The default initial setup will have a username "admin" with the password "password".
This password should be changed upon first login.  User the pull-down on the
username in the top menu, and select "Change Profile".  By default, the field
for changing a password is not available (to prevent accidental changes).  Click
the "CHANGE PASSWORD" button to enable the field, and enter the new password.

## User Management

Users log in to and interact with the system.  Users can be of 2 types:

- **System Administrators** - The user's role is defined as "Admin".  These
  Users have full access to the system, and access to additional "Admin UI"
  functionality.  System Administrators must supply an email address so they
  can be notified of system events.
- **Regular Users** - Non-admin users, can use the application in the context
  of that user.

For admin users, the home screen has a tab for managing users.

To get details on an User, click on the username.  To create new user, click the
"CREATE USER" button.

---
<img src="/img/ui_user.png" alt="User Form" width="100%" />
