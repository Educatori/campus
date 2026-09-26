<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['isAuthorized' => false]);
    exit;
}

$email = strtolower(trim($_POST['email'] ?? ''));
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['isAuthorized' => false]);
    exit;
}

$csvFile = __DIR__ . '/../data/mailing_list.csv';
$authorized = false;

if (file_exists($csvFile) && ($handle = fopen($csvFile, 'r')) !== false) {
    while (($row = fgetcsv($handle)) !== false) {
        if (isset($row[0]) && strtolower(trim($row[0])) === $email) {
            $authorized = true;
            break;
        }
    }
    fclose($handle);
}

echo json_encode(['isAuthorized' => $authorized]);