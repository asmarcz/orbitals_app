<?php

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/getRange.php';

$ranges = [];

$ranges[0] = [1, 2, 3, 4, 11, 12, 19, 20, 37, 38, 55, 56, 87, 88];
$ranges[1] = array_merge(getRange(5, 10), getRange(13, 18), getRange(31, 36), getRange(49, 54), getRange(81, 86), getRange(113, 118));
$ranges[2] = array_merge(getRange(21, 30), getRange(39, 48), getRange(71, 80), getRange(103, 112));
$ranges[3] = array_merge(getRange(57, 70), getRange(89, 102));

$neon = \Nette\Neon\Neon::encode(['parameters' => ['ranges' => $ranges]], \Nette\Neon\Neon::BLOCK);
file_put_contents(__DIR__ . '/../app/config/ranges.neon', $neon);
