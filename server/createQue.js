
var express = require('express'),
_ = require('lodash'),
config = require('../config'),

// = require('easy-pdf-merge'),
Tiff = require('tiff.js'),
PNG = require('node-png').PNG,
PDFDocument = require('pdfkit');

var defaultDownloadSourceDir = config.Download_Source_Dir;
var defaultSourceMoveToDir = config.Download_Source_Move_To;
var defaultDownloadSourceIngestingDir = config.Download_Source_Ingesting;
var defaultDownloadSourceErrorDir = config.Download_Source_Error;
var defaultACKDestDir = config.ACK_Dest_Dir;
var defaultNACKDestDir = config.NACK_Dest_Dir;

var amrestFilesModel = require('../models/amrestModel').amrestFilesModel;
var amqp = require('amqplib').connect('amqp://localhost:5672');
var fs = require('fs');
var fileMap = {};
IngestionLoop()
setInterval(IngestionLoop, 5000);
async function IngestionLoop() {
    try {
        cb = await ingest();
        await sendNackForPartiallyIngestedFiles();
        sendAckNack()
            .then(() => {
                setTimeout(IngestionLoop, config.ingestion_interval_in_milliseconds);
            })
            .catch((err) => {
                console.log("Ingestion error..." + err);
                setTimeout(IngestionLoop, config.ingestion_interval_in_milliseconds);
            })
    } catch (err) {

    }

}

async function ingest() {
    return new Promise(async (resolve, reject) => {
        try {
            //process.stdout.write("#");
            let items = fs.readdirSync(config.dir_path + defaultDownloadSourceDir);
            let zipFileList = [];
            let semFileList = [];
            zipFileList = items.filter((data) => { return data.endsWith('.zip') });
            semFileList = items.filter((data) => { return data.endsWith('.sem') });
            if (semFileList.length) {
                amqp.then(function (conn) {
                    return conn.createChannel();
                }).then(function (ch) {
                    for (var semFile of semFileList) {
                        if (semFile.endsWith(".sem")) {
                            zipFileName = semFile.split('.sem')[0] + '.zip';
                            try {
                                if (zipFileList.indexOf(zipFileName) >= 0) {
                                    if (!fileMap[zipFileName]) {
                                        console.log(zipFileName);
                                        fileMap[zipFileName] = {};
                                        ch.assertQueue('insertZip', { durable: true }).then(async () => {
                                            //await ingesterService.movefile(config.dir_path + defaultDownloadSourceDir + "/" + zipFileName, config.dir_path + defaultDownloadSourceIngestingDir + "/" + zipFileName);
                                            ch.sendToQueue('insertZip', Buffer.from(zipFileName));
                                        });
                                    };
                                } else {
                                    if (fs.existsSync(config.dir_path + defaultDownloadSourceDir + '/' + semFile)) {
                                        fs.unlink(config.dir_path + defaultDownloadSourceDir + '/' + semFile, (err) => {
                                            if (err) {
                                                console.log('File is locked');
                                            } else {
                                                console.log('File deleted successfully');
                                            }
                                        });
                                    }
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        }
                    }
                    //ch.close();
                }).catch(console.warn);
            }

            resolve();
        } catch (err) {
            console.error(++errorcounter + ") Ingestion error " + err);
            reject();
        }
    });
}