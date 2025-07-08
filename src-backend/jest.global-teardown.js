

const path = require('path');
const fs = require('fs');

module.exports = async () => {
    const dbPath = path.join(__dirname, 'database.db');
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log('\nTest database cleaned up.');
    }
};

