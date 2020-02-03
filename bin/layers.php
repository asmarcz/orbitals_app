<?php

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/getRange.php';

$layers = [];

$layers[0] = [1, 2];
$layers[1] = getRange(3, 10);
$layers[2] = getRange(11, 18);
$layers[3] = getRange(19, 36);
$layers[4] = getRange(37, 54);
$layers[5] = getRange(55, 86);
$layers[6] = getRange(87, 118);

file_put_contents(__DIR__ . '/../config/layers.json', json_encode($layers));
