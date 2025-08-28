const util = require('util');
const databaseManager = require('../database-manager');

async function getNextDocumentNumber(db, counterType) {
    const get = util.promisify(db.get.bind(db));
    const run = util.promisify(db.run.bind(db));

    const row = await get('SELECT last_number FROM document_counters WHERE counter_type = ?', [counterType]);
    if (!row) {
        await run('INSERT INTO document_counters (counter_type, last_number) VALUES (?, 1)', [counterType]);
        return 1;
    }
    const next = row.last_number + 1;
    await run('UPDATE document_counters SET last_number = ? WHERE counter_type = ?', [next, counterType]);
    return next;
}

module.exports = { getNextDocumentNumber };
