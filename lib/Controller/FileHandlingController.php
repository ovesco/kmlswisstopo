<?php

namespace OCA\KmlSwisstopo\Controller;

use OC\HintException;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\Files\File;
use OCP\Files\Folder;
use OCP\Files\ForbiddenException;
use OCP\Files\GenericFileException;
use OCP\IL10N;
use OCP\ILogger;
use OCP\IRequest;
use OCP\Lock\LockedException;

class FileHandlingController extends Controller {

    /** @var IL10N */
    private $l;
    /** @var ILogger */
    private $logger;
    /** @var Folder */
    private $userFolder;
    /**
     * @NoAdminRequired
     *
     * @param string $AppName
     * @param IRequest $request
     * @param IL10N $l10n
     * @param ILogger $logger
     * @param Folder $userFolder
     */
    public function __construct($AppName,
                                IRequest $request,
                                IL10N $l10n,
                                ILogger $logger,
                                Folder $userFolder) {
        parent::__construct($AppName, $request);
        $this->l = $l10n;
        $this->logger = $logger;
        $this->userFolder = $userFolder;
    }

    /**
     * load text file
     * @NoAdminRequired
     * @param string $dir
     * @param string $filename
     * @return DataResponse
     */
    public function load($dir, $filename) {
        try {
            if (!empty($filename)) {
                $path = $dir . '/' . $filename;
                /** @var File $file */
                $file = $this->userFolder->get($path);
                if ($file instanceof Folder) {
                    return new DataResponse(['message' => "C'est un dossier."], Http::STATUS_BAD_REQUEST);
                }

                // default of 4MB
                $maxSize = 4194304;
                if ($file->getSize() > $maxSize) {
                    return new DataResponse(['message' => "Ce fichier est trop gros pour être ouvert"], Http::STATUS_BAD_REQUEST);
                }

                $fileContents = $file->getContent();

                if ($fileContents !== false) {
                    $writable = $file->isUpdateable();
                    $mime = $file->getMimeType();
                    $mTime = $file->getMTime();
                    $encoding = mb_detect_encoding($fileContents . 'a', 'UTF-8, WINDOWS-1252, ISO-8859-15, ISO-8859-1, ASCII', true);

                    if ($encoding === '') {
                        $encoding = 'ISO-8859-15';
                    }

                    $fileContents = iconv($encoding, 'UTF-8', $fileContents);
                    return new DataResponse(
                        [
                            'filecontents' => $fileContents,
                            'writeable' => $writable,
                            'mime' => $mime,
                            'mtime' => $mTime
                        ],
                        Http::STATUS_OK
                    );
                } else {
                    return new DataResponse(['message' => "Impossible de lire le fichier"], Http::STATUS_BAD_REQUEST);
                }
            } else {
                return new DataResponse(['message' => "Chemin du fichier invalide"], Http::STATUS_BAD_REQUEST);
            }
        } catch (LockedException $e) {
            return new DataResponse(['message' => "Fichier verrouillé"], Http::STATUS_BAD_REQUEST);
        } catch (ForbiddenException $e) {
            return new DataResponse(['message' => $e->getMessage()], Http::STATUS_BAD_REQUEST);
        } catch (HintException $e) {
            return new DataResponse(['message' => $e->getHint()], Http::STATUS_BAD_REQUEST);
        } catch (\Exception $e) {
            return new DataResponse(['message' => "Une erreur du serveur est survenue"], Http::STATUS_BAD_REQUEST);
        }
    }
}
