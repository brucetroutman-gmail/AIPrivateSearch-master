Steps for MySQL Install and DBbeaver connection with Mysql Vers 9.4 
on a Mac Silicon Chip set

1. Download and install MySql

https://dev.mysql.com/downloads/mysql/

macOS 15 (ARM, 64-bit), DMG Archive

Set root password (write it down)

2.  From terminal -> mysql -u root -p , enter password that you wrote down

From mysql>

-- Create new user with sha256_password
CREATE USER 'nimdas'@'localhost' IDENTIFIED WITH sha256_password BY 'your_password';
GRANT ALL PRIVILEGES ON *.* TO 'nimdas'@'localhost';

-- For remote access
-- CREATE USER 'newuser'@'%' IDENTIFIED WITH sha256_password BY 'your_password';
-- GRANT ALL PRIVILEGES ON *.* TO 'newuser'@'%';

FLUSH PRIVILEGES;

exit

(remember your_password)

3. In DBeaver new connection settings:

Server Host: localhost
Port: 3306
Database: 
Username: nimdas
Password: your_password

Click Driver Settings button

Click Default Settings tab

Right Click in Opean space below list

Add these three properties:
allowPublicKeyRetrieval → true
useSSL → false
serverTimezone → UTC


Click Test Connection






