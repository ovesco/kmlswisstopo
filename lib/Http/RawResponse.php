<?php

namespace OCA\KmlSwisstopo\Http;

use OCP\AppFramework\Http\Response;

class RawResponse extends Response {

    private $content;

    public function __construct($content) {
        $this->content = $content;
    }

    public function render() {
        return $this->content;
    }
}