Set up the database
Do this once.

Open MySQL Workbench, open your local connection, and sign in as root.
Open a new SQL tab (Ctrl+T, or Cmd+T on Mac).
Paste the script below. Replace the two placeholder passwords with your own (see Where passwords go for how to generate good ones)

  CREATE DATABASE IF NOT EXISTS lab5;

   CREATE USER 'lab5_writer'@'localhost' IDENTIFIED BY 'PUT-WRITER-PASSWORD-HERE';
   CREATE USER 'lab5_reader'@'localhost' IDENTIFIED BY 'PUT-READER-PASSWORD-HERE';

   GRANT CREATE, INSERT ON lab5.* TO 'lab5_writer'@'localhost';
   GRANT SELECT ON lab5.* TO 'lab5_reader'@'localhost';

   FLUSH PRIVILEGES;

Run it: Ctrl+Shift+Enter (Cmd+Shift+Return on Mac), or the lightning bolt. Every line should show a green check.
Verify the reader has only SELECT:
sql
   SHOW GRANTS FOR 'lab5_reader'@'localhost';

If you do not use Workbench, run the same script from a terminal with mysql -u root -p < setup.sql.

If you already ran the script and want to change a password: CREATE USER never changes an existing user. It fails with error 1396. Use ALTER USER instead:

sql
ALTER USER 'lab5_writer'@'localhost' IDENTIFIED BY 'NEW-WRITER-PASSWORD';
ALTER USER 'lab5_reader'@'localhost' IDENTIFIED BY 'NEW-READER-PASSWORD';
FLUSH PRIVILEGES;

The grants stay in place, so you do not need to run them again.

If IF NOT EXISTS is rejected on CREATE USER: your MySQL is older than 5.7.6. The script above already leaves it out for that reason.

5. Install dependencies

Open a terminal in the server2 folder.

Windows: open the folder in File Explorer, click the address bar, type cmd, press Enter.
VS Code: open the folder, then Terminal → New Terminal.

Then run:

bash
npm install

This installs mysql2 and creates node_modules. If you get a JSON error, check that package.json ends with a closing }:

json
{
  "name": "lab5-server2",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": { "start": "node server.js" },
  "dependencies": { "mysql2": "^3.11.0" }
}
6. Set the environment variables

Create a file named exactly .env (with the leading dot and no .txt) in server2:

WRITER_USER=lab5_writer
WRITER_PASS=the-writer-password-from-step-4
READER_USER=lab5_reader
READER_PASS=the-reader-password-from-step-4
DB_HOST=localhost
DB_PORT=3306
DB_NAME=lab5
PORT=8080

Rules for this file:

The two passwords must match what you set in MySQL exactly.
No quotes around values and no spaces around =.
Never commit it or put it in the zip.
7. Start the server
bash
node --env-file=.env server.js

You should see:

Server on port 8080

Leave this terminal open. Closing it stops the server. Press Ctrl+C to stop it yourself.