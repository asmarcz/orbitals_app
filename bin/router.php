<?php
$file = $_SERVER["DOCUMENT_ROOT"] . $_SERVER["REQUEST_URI"] . ".html";
if (is_file($file)) {
	readfile($file);
} else {
	return false;
}
