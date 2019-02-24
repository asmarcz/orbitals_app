<?php

namespace App\Presenters;

use Nette;


/**
 * Base presenter for all application presenters.
 */
abstract class BasePresenter extends Nette\Application\UI\Presenter
{
	public function startup()
	{
		parent::startup();
		$this->template->exceptions = $this->context->parameters['exceptions'];
		$this->template->elements = $this->context->parameters['elements'];
	}
}
