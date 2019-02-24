<?php

use Nette\Neon\Neon;

require __DIR__ . '/../vendor/autoload.php';

$fileContent = file_get_contents(__DIR__ . '/../app/config/elementlist.csv');

$array = [];
foreach (preg_split("/\r\n|\n|\r/", $fileContent) as $line) {
	if (!empty($line)) {
		$data = explode(',', $line);
		$array[] = [(int)$data[0], $data[1], $data[2]];
	}
}

$output = ['parameters' => ['elements' => $array]];

file_put_contents(__DIR__ . '/../app/config/elements.neon', Neon::encode($output, Neon::BLOCK));
