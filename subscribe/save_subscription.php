<?php
header('Content-Type: application/json');

// Solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$email = strtolower(trim($_POST['email'] ?? ''));
$activity = trim($_POST['activity'] ?? '');
$participation = trim($_POST['participation'] ?? '');

// Validazione
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Email non valida']);
    exit;
}

$attivitaValide = ['calcio-lunedi', 'coding-martedi'];
$partecipazioniValide = ['yes', 'no'];

if (!in_array($activity, $attivitaValide, true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Attività non valida']);
    exit;
}
if (!in_array($participation, $partecipazioniValide, true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Partecipazione non valida']);
    exit;
}

// Verifica che l'email sia nella mailing list (server-side, non bypassabile)
$mailingFile = __DIR__ . '/../data/mailing_list.csv';
$authorized = false;
if (($h = fopen($mailingFile, 'r')) !== false) {
    while (($row = fgetcsv($h)) !== false) {
        if (isset($row[0]) && strtolower(trim($row[0])) === $email) {
            $authorized = true;
            break;
        }
    }
    fclose($h);
}
if (!$authorized) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Email non autorizzata']);
    exit;
}

// Salva
$file = __DIR__ . '/../data/subscriptions.csv';
$data = [$email, $activity, $participation, date('Y-m-d H:i:s')];
$handle = fopen($file, 'a');
if ($handle === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Impossibile scrivere il file']);
    exit;
}
fputcsv($handle, $data);
fclose($handle);

echo json_encode(['success' => true]);