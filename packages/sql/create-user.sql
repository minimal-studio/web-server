-- Create user for database
CREATE USER 'test'@'localhost' IDENTIFIED BY 'test';
GRANT ALL PRIVILEGES ON * . * TO 'test'@'localhost';

-- Create database
CREATE DATABASE test;

-- Fix the node mysql bug
ALTER USER 'test'@'localhost' IDENTIFIED WITH mysql_native_password BY 'test';
