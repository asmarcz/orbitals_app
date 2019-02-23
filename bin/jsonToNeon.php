<?php

require __DIR__ . '/../vendor/autoload.php';

$parsedJson = \Nette\Utils\Json::decode(file_get_contents(__DIR__ . '/../app/config/exceptions.json'));

$neon = \Nette\Neon\Neon::encode(['parameters' => ['exceptions' => $parsedJson]], \Nette\Neon\Neon::BLOCK);

file_put_contents(__DIR__ . '/../app/config/exceptions.neon', $neon);
