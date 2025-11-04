# Database Setup Guide

## Error: Access denied for user 'root'@'localhost'

This error occurs when the MySQL password in `application.properties` doesn't match your actual MySQL password.

## Quick Fix Options:

### Option 1: Update application.properties with correct password
1. Open `backend/SkillForge_BackendPart/src/main/resources/application.properties`
2. Update line 6 with your actual MySQL root password:
   ```properties
   spring.datasource.password=YOUR_ACTUAL_MYSQL_PASSWORD
   ```

### Option 2: Reset MySQL root password (if you forgot it)
1. Stop MySQL service
2. Start MySQL in safe mode
3. Reset the password

### Option 3: Check MySQL is running
1. Open MySQL Workbench or Command Line
2. Try connecting with:
   ```
   mysql -u root -p
   ```
3. Enter your password

### Option 4: Create the database manually
If MySQL is working but the database doesn't exist:
1. Connect to MySQL: `mysql -u root -p`
2. Run: `CREATE DATABASE IF NOT EXISTS skillforge_db;`
3. Run the setup script: `mysql -u root -p skillforge_db < backend/SkillForge_BackendPart/setup_database.sql`

## Common MySQL Passwords to Try:
- `root`
- `password`
- `admin`
- Empty (no password - leave blank in properties)
- Your system password

## To Find Your MySQL Password:
- Check MySQL Workbench saved connections
- Check your MySQL installation notes
- If using XAMPP: password is usually empty or "root"
- If using WAMP: password is usually empty

