

const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3');

module.exports = async () => {
    const dbPath = path.join(__dirname, 'database.db');
    
    // Create a dummy db connection to close it, this is a workaround
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            // If we can't open it, it might be gone already, which is fine.
            if (fs.existsSync(dbPath)) {
                fs.unlinkSync(dbPath);
                console.log('\nTest database cleaned up.');
            }
            return;
        }
        db.close((closeErr) => {
            if (closeErr) {
                // Ignore error if db is already closing
            }
            if (fs.existsSync(dbPath)) {
                try {
                    fs.unlinkSync(dbPath);
                    console.log('\nTest database cleaned up.');
                } catch (unlinkErr) {
                    // Ignore if it's busy, the OS will clean it up.
                }
            }
        });
    });
};

