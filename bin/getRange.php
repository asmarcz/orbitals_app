<?php

function getRange($start, $end) {
	$tmp = [];
	for ($i = $start; $i <= $end; $i++) {
		$tmp[] = $i;
	}
	return $tmp;
}
