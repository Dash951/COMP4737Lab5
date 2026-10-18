CREATE DATABASE IF NOT EXISTS lab5;

CREATE USER IF NOT EXISTS 'lab5_writer'@'localhost' IDENTIFIED BY 'change-me-writer';
CREATE USER IF NOT EXISTS 'lab5_reader'@'localhost' IDENTIFIED BY 'change-me-reader';

GRANT CREATE, INSERT ON lab5.* TO 'lab5_writer'@'localhost';
GRANT SELECT ON lab5.* TO 'lab5_reader'@'localhost';

FLUSH PRIVILEGES;