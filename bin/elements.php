<?php

$fileContent = file_get_contents(__DIR__ . '/../config/elementlist.csv');

$array = [];
foreach (preg_split("/\r\n|\n|\r/", $fileContent) as $line) {
	if (!empty($line)) {
		$data = explode(',', $line);
		$array[] = [(int)$data[0], $data[1], $data[2]];
	}
}

file_put_contents(__DIR__ . '/../config/elements.json', json_encode($array));
