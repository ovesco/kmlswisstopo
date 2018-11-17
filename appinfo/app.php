<?php

$eventDispatcher = \OC::$server->getEventDispatcher();

$manager = \OC::$server->getContentSecurityPolicyManager();
$policy = new \OCP\AppFramework\Http\EmptyContentSecurityPolicy();
for($i = 1; $i < 11; $i++) {
    $policy->addAllowedImageDomain("http://wmts$i.geo.admin.ch");
    $policy->addAllowedMediaDomain("http://wmts$i.geo.admin.ch");
}

$policy->addAllowedConnectDomain("https://api3.geo.admin.ch");
$policy->addAllowedImageDomain("https://wmts0.geo.admin.ch");

$manager->addDefaultPolicy($policy);


if (\OC::$server->getUserSession()->isLoggedIn()) {
    $eventDispatcher->addListener('OCA\Files::loadAdditionalScripts', function() {

        OCP\Util::addStyle('kmlswisstopo', 'ga');
        OCP\Util::addStyle('kmlswisstopo', 'style');

        OCP\Util::addScript('kmlswisstopo', 'swisstopo');
        OCP\Util::addScript('kmlswisstopo', 'proj4');
        OCP\Util::addScript('kmlswisstopo', 'epsg');
        OCP\Util::addScript('kmlswisstopo', 'ga');
        OCP\Util::addScript('kmlswisstopo', 'chart');
        OCP\Util::addScript('kmlswisstopo', 'KmlViewer');

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