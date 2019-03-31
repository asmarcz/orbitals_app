<?php

require __DIR__ . '/../vendor/autoload.php';

$configurator = new Nette\Configurator;

//$configurator->setDebugMode('23.75.345.200'); // enable for your remote IP
$configurator->enableTracy(__DIR__ . '/../log');

$configurator->setTimeZone('Europe/Prague');
$configurator->setTempDirectory(__DIR__ . '/../temp');

$configurator->createRobotLoader()
	->addDirectory(__DIR__)
	->register();

$configurator->addConfig(__DIR__ . '/config/config.neon');
$configurator->addConfig(__DIR__ . '/config/exceptions.neon');
$configurator->addConfig(__DIR__ . '/config/elements.neon');
$configurator->addConfig(__DIR__ . '/config/ranges.neon');
$configurator->addConfig(__DIR__ . '/config/layers.neon');
$configurator->addConfig(__DIR__ . '/config/noble_gases.neon');

$container = $configurator->createContainer();

return $container;
