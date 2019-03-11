<?php

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/getRange.php';

$layers = [];

$layers[1] = [1, 2];
$layers[2] = getRange(3, 10);
$layers[3] = getRange(11, 18);
$layers[4] = getRange(19, 36);
$layers[5] = getRange(37, 54);
$layers[6] = getRange(55, 86);
$layers[7] = getRange(87, 118);

$neon = \Nette\Neon\Neon::encode(['parameters' => ['layers' => $layers]], \Nette\Neon\Neon::BLOCK);
file_put_contents(__DIR__ . '/../app/config/layers.neon', $neon);
