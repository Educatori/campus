<?php
/**
 * api/stats.php
 * Aggrega data/subscriptions.csv e restituisce i conteggi SÌ/NO per attività.
 *
 * Output JSON:
 * {
 *   "calcio": { "yes": 5, "no": 3, "total": 8 },
 *   "coding": { "yes": 7, "no": 2, "total": 9 },
 *   "updated_at": "2026-09-24 14:32:10",
 *   "total_records": 17
 * }
 *
 * Nota: i nomi delle chiavi ("calcio", "coding") sono una mappatura
 * dagli ID usati nel form ("calcio-lunedi", "coding-martedi").
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');

// Solo GET (o HEAD)
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'GET' && $method !== 'HEAD') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// --- Configurazione ---
$csvFile = __DIR__ . '/../data/subscriptions.csv';

/**
 * Mappa: ID interno del form → chiave esposta all'API.
 * Se aggiungi nuove attività nel form, aggiungile qui.
 * Le attività NON presenti in questa mappa vengono ignorate
 * (così eventuali voci vecchie/sporche non inquinano i contatori).
 */
$activityMap = [
    'calcio-lunedi' => 'calcio',
    'coding-martedi' => 'coding',
];

// Inizializza i contatori a 0 per TUTTE le attività conosciute
$stats = [];
foreach ($activityMap as $apiKey) {
    $stats[$apiKey] = ['yes' => 0, 'no' => 0, 'total' => 0];
}

// --- Lettura CSV ---
if (!file_exists($csvFile)) {
    // Nessun file → restituisci tutti zeri (200, non errore: il sito deve funzionare)
    echo json_encode([
        'calcio'        => $stats['calcio'],
        'coding'        => $stats['coding'],
        'updated_at'    => date('Y-m-d H:i:s'),
        'total_records' => 0,
        'warning'       => 'subscriptions.csv non trovato',
    ]);
    exit;
}

$handle = fopen($csvFile, 'r');
if ($handle === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Impossibile aprire subscriptions.csv']);
    exit;
}

$totalRecords = 0;
$headerSkipped = false;
$emailActivitySeen = []; // dedup: [email|activity] => true

while (($row = fgetcsv($handle)) !== false) {
    // Salta header (prima riga)
    if (!$headerSkipped) {
        $headerSkipped = true;
        // Rileva header in modo robusto (case-insensitive)
        if (isset($row[0]) && strtolower(trim($row[0])) === 'email') {
            continue;
        }
        // Se non c'è header, trattala come dato → non fare continue
    }

    // Righe vuote o malformate
    if (!isset($row[0]) || trim($row[0]) === '') {
        continue;
    }

    $email         = strtolower(trim($row[0] ?? ''));
    $activityRaw   = trim($row[1] ?? '');
    $participation = strtolower(trim($row[2] ?? ''));

    // Validazione minima
    if ($email === '' || $activityRaw === '') {
        continue;
    }
    if ($participation !== 'yes' && $participation !== 'no') {
        continue;
    }

    // Attività sconosciuta → ignora
    if (!isset($activityMap[$activityRaw])) {
        continue;
    }
    $apiKey = $activityMap[$activityRaw];

    // --- Deduplicazione ---
    // Un utente può iscriversi più volte alla stessa attività nel tempo.
    // Contiamo solo l'ULTIMA iscrizione per (email, attività).
    // Siccome il CSV è in append, la riga più recente vince.
    $dedupKey = $email . '|' . $activityRaw;

    // Se avevamo già visto questa coppia, dobbiamo "annullare" il conteggio
    // precedente e applicare quello nuovo.
    if (isset($emailActivitySeen[$dedupKey])) {
        $prev = $emailActivitySeen[$dedupKey]; // 'yes' o 'no'
        $stats[$apiKey][$prev]--;
        $stats[$apiKey]['total']--;
    }

    $emailActivitySeen[$dedupKey] = $participation;
    $stats[$apiKey][$participation]++;
    $stats[$apiKey]['total']++;
    $totalRecords++;
}

fclose($handle);

// --- Output ---
echo json_encode([
    'calcio'        => $stats['calcio'],
    'coding'        => $stats['coding'],
    'updated_at'    => date('Y-m-d H:i:s'),
    'total_records' => $totalRecords,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);