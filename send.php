<?php
// Simple mail sender for Hostinger (PHP mail()).
// Configure the two addresses below with your domain's mailbox to improve deliverability.

// REQUIRED: change these to your real mailboxes (same domain of hosting recommended)
$MAIL_TO   = getenv('MAIL_TO')   ?: 'portugalgeng.comercial@gmail.com, fernando.karakanian12@gmail.com';
$MAIL_FROM = getenv('MAIL_FROM') ?: 'contato@portugalengenharia.com';

header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  echo json_encode(['ok' => true]);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
  exit;
}

// Parse JSON body or form-encoded
// Detecta JSON (app.js) ou multipart/form-data (trabalhe-conosco)
$raw = file_get_contents('php://input');
$data = [];
if (strpos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {
  $data = json_decode($raw, true) ?: [];
} else {
  $data = $_POST;
}

// Honeypot
if (!empty($data['_gotcha'])) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'spam']);
  exit;
}

// Sanitize inputs
$name    = trim($data['name']    ?? '');
$email   = trim($data['email']   ?? '');
$phone   = trim($data['phone']   ?? '');
$subject = trim($data['subject'] ?? '');
$message = trim($data['message'] ?? '');

if ($name === '' || $email === '' || $message === '') {
  http_response_code(422);
  echo json_encode(['ok' => false, 'error' => 'Missing required fields']);
  exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(422);
  echo json_encode(['ok' => false, 'error' => 'Invalid email']);
  exit;
}

$subject = $subject !== '' ? ('Contato: ' . $subject) : 'Novo contato do site';

// Build HTML body
$bodyHtml = '<h2>Novo contato do site</h2>'
  . '<p><strong>Nome:</strong> ' . htmlspecialchars($name) . '</p>'
  . '<p><strong>E-mail:</strong> ' . htmlspecialchars($email) . '</p>'
  . '<p><strong>Telefone:</strong> ' . htmlspecialchars($phone) . '</p>'
  . '<p><strong>Assunto:</strong> ' . htmlspecialchars($subject) . '</p>'
  . '<p><strong>Mensagem:</strong></p>'
  . '<p>' . nl2br(htmlspecialchars($message)) . '</p>';

// Headers (use envelope sender -f to improve SPF alignment)
// Com anexo (se multipart/form-data com arquivo)
$hasFile = isset($_FILES['resume']) && is_uploaded_file($_FILES['resume']['tmp_name']);
if ($hasFile) {
  $boundary = md5(uniqid(time()));
  $headers  = 'MIME-Version: 1.0' . "\r\n";
  $headers .= 'From: Portugal Engenharia <' . $MAIL_FROM . '>' . "\r\n";
  if ($email) { $headers .= 'Reply-To: ' . $email . "\r\n"; }
  $headers .= 'Content-Type: multipart/mixed; boundary="' . $boundary . '"' . "\r\n";

  $message  = '--' . $boundary . "\r\n";
  $message .= 'Content-Type: text/html; charset=UTF-8' . "\r\n";
  $message .= 'Content-Transfer-Encoding: 7bit' . "\r\n\r\n";
  $message .= $bodyHtml . "\r\n\r\n";

  $fileTmp  = $_FILES['resume']['tmp_name'];
  $fileName = preg_replace('/[^a-zA-Z0-9_\.\-]/', '_', $_FILES['resume']['name']);
  $fileType = mime_content_type($fileTmp) ?: 'application/octet-stream';
  $fileData = chunk_split(base64_encode(file_get_contents($fileTmp)));

  $message .= '--' . $boundary . "\r\n";
  $message .= 'Content-Type: ' . $fileType . '; name="' . $fileName . '"' . "\r\n";
  $message .= 'Content-Transfer-Encoding: base64' . "\r\n";
  $message .= 'Content-Disposition: attachment; filename="' . $fileName . '"' . "\r\n\r\n";
  $message .= $fileData . "\r\n";
  $message .= '--' . $boundary . '--';

  $ok = @mail($MAIL_TO, $subject, $message, $headers, '-f' . $MAIL_FROM);
} else {
  // Sem anexo (json ou form simples)
  $headers  = 'MIME-Version: 1.0' . "\r\n";
  $headers .= 'Content-type: text/html; charset=UTF-8' . "\r\n";
  $headers .= 'From: Portugal Engenharia <' . $MAIL_FROM . '>' . "\r\n";
  if ($email) { $headers .= 'Reply-To: ' . $email . "\r\n"; }
  $ok = @mail($MAIL_TO, $subject, $bodyHtml, $headers, '-f' . $MAIL_FROM);
}

if ($ok) {
  echo json_encode(['ok' => true]);
} else {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Mailer failure']);
}
?>


