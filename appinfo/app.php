<?php

$eventDispatcher = \OC::$server->getEventDispatcher();

if (\OC::$server->getUserSession()->isLoggedIn()) {
    $eventDispatcher->addListener('OCA\Files::loadAdditionalScripts', function() {

        OCP\Util::addStyle('kmlswisstopo', 'ga');
        OCP\Util::addStyle('kmlswisstopo', 'style');
        OCP\Util::addScript('kmlswisstopo', 'swisstopo');
        OCP\Util::addScript('kmlswisstopo', 'proj4');
        OCP\Util::addScript('kmlswisstopo', 'epsg');
        OCP\Util::addScript('kmlswisstopo', 'ga');
        OCP\Util::addScript('kmlswisstopo', 'script');



        $cspManager = \OC::$server->getContentSecurityPolicyManager();
        $csp = new \OCP\AppFramework\Http\ContentSecurityPolicy();
        $csp->addAllowedChildSrcDomain("'self'");
        $cspManager->addDefaultPolicy($csp);
    });
}
$eventDispatcher->addListener('OCA\Files_Sharing::loadAdditionalScripts', function() {
    OC_Util::addVendorScript('core', 'marked/marked.min');
    OCP\Util::addScript('files_texteditor', 'public-share');
    OCP\Util::addStyle('files_texteditor', 'public-share');
});