
var express = require('express'),
_ = require('lodash'),
config = require('../config'),

// = require('easy-pdf-merge'),
Tiff = require('tiff.js'),
PNG = require('node-png').PNG,
PDFDocument = require('pdfkit');

//var detect = require('charset-detector');



var filecounter = 0;
var errorcounter = 0;
var sftpSiteCounter = -1;
var listenSftpList = [];


var defaultDownloadSourceDir = config.Download_Source_Dir;
var defaultSourceMoveToDir = config.Download_Source_Move_To;
var defaultDownloadSourceIngestingDir = config.Download_Source_Ingesting;
var defaultDownloadSourceErrorDir = config.Download_Source_Error;
var defaultACKDestDir = config.ACK_Dest_Dir;
var defaultNACKDestDir = config.NACK_Dest_Dir;

var amrestFilesModel = require('../models/amrestModel').amrestFilesModel;
var amqp = require('amqplib').connect('amqp://localhost:5672');
var ingesting = false;

var fs = require('fs');
var Grid = require('gridfs-stream');
Grid.mongo = mongoose.mongo;
var mconn = mongoose.connection;
var gfs = null;
mconn.once('open', function () {
    console.log('Successfully connected to MongoDB at ' + config.pathToMongoDb);
    gfs = Grid(mconn.db);
});
mconn.on('error', function (err) {
    console.log("Failed to connect to MongoDB at " + config.pathToMongoDb);
    console.log("Exiting...");
    process.exit();
});

module.exports = {
    triggerBoxofficeIngester: IngestionLoop,
    movefile: movefile

}

async function streamToString_utf8(stream) {
    return new Promise((resolve, reject) => {
        const chunks_utf8 = [];
        stream.on('data', (chunk) => {
            chunks_utf8.push(chunk.toString("utf8"));
        });
        stream.on('end', () => {
            resolve(chunks_utf8.join(''));
        });
        stream.on('error', function () {
            reject("");
        });
    });
}

async function streamToString_utf16(stream) {
    return new Promise((resolve, reject) => {
        const chunks_utf16le = [];
        stream.on('data', (chunk) => {
            chunks_utf16le.push(chunk);
        });
        stream.on('end', () => {
            let buffer = Buffer.concat(chunks_utf16le);
            let string = buffer.toString('utf16le');
            resolve(string);
        });
        stream.on('error', function () {
            reject("");
        });
    });
}

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

async function IngestionLoop() {
    try {
        amqp.then(function (conn) {
            return conn.createChannel();
        }).then(function (ch) {
            return ch.assertQueue('insertZip', { durable: true }).then(async () => {
                await ch.prefetch(1);
                return ch.consume('insertZip', async function (fileName) {
                    if (fileName !== null) {
                        try {
                            var zipDoc = await insertZipFile(fileName.content.toString());
                            if (zipDoc) {
                                await unZipFile(zipDoc, ch);
                            }
                            ch.ack(fileName);
                        } catch (err) {
                            ch.ack(fileName);
                            console.error(err);
                        }
                    } else {
                        ch.ack(fileName);
                    }
                }, { noAck: false });
            });
        }).catch(console.warn);

    } catch (err) {

    }
setTimeout(IngestionLoop,5000);
}





amqp.then(function (conn) {
    return conn.createChannel();
}).then(function (ch) {
    return ch.assertQueue('uploadZipContents', { durable: true }).then(async () => {
        await ch.prefetch(1);
        return ch.consume('uploadZipContents', async function (zipDocId) {
            if (zipDocId !== null) {
                try {
                    await uploadZipFileContents(zipDocId.content.toString());
                    await sendNackForPartiallyIngestedFiles();
                    sendAckNack()
                        .then(() => {
                            //setTimeout(IngestionLoop, config.ingestion_interval_in_milliseconds);
                        })
                        .catch((err) => {
                            console.log("Ingestion error..." + err);
                            //setTimeout(IngestionLoop, config.ingestion_interval_in_milliseconds);
                        })
                    ch.ack(zipDocId);
                } catch (err) {
                    ch.ack(zipDocId);
                    console.error(err);
                }
            } else {
                ch.ack(zipDocId);
            }
        }, { noAck: false });
    });
}).catch(console.warn);





async function movefile(source, destination) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(source)) {
            readStream = fs.createReadStream(source);
            writeStream = fs.createWriteStream(destination);
            readStream.pipe(writeStream);
            writeStream.on('close', () => {
                fs.unlink(source, err => { if (err) console.log(err) });
                resolve();
            });
            writeStream.on('error', () => {
                reject();

            });
        } else {
            console.log("File Not exists...");
            resolve();
        }

    })

}
async function insertZipFile(zipfilename) {
    return new Promise(async (resolve, reject) => {
        try {

            try {
                await movefile(config.dir_path + defaultDownloadSourceDir + "/" + zipfilename, config.dir_path + defaultDownloadSourceIngestingDir + "/" + zipfilename);
            } catch (err) { return }//Safely ignore movefile error here. Somebody (another thread) moved your cheese :-) (so he is consuming it anyways)
            var duplicate = await isDuplicateFile(zipfilename);
            if (duplicate) {
                reject("Duplicate file encountered : " + zipfilename);
            } else {
                if (fs.existsSync(config.dir_path + defaultDownloadSourceIngestingDir + "/" + zipfilename)) {
                    var sftpZipInputStream = fs.createReadStream(config.dir_path + defaultDownloadSourceIngestingDir + "/" + zipfilename)
                    var zipFileID = await fileStreamToMongo(sftpZipInputStream, zipfilename);
                    var zipRecord = { "zipName": zipfilename, "zipFileID": zipFileID, "ingestionStartedTime": Date.now() };
                    var zipRow = new amrestFilesModel(zipRecord);
                    var record = await zipRow.save();
                    resolve(record);
                } else {
                    resolve();
                }
            }
        } catch (err) {
            console.log(err);
            reject(err)
        }
    })
}

async function unZipFile(zipDoc, channel) {
    try {
        var zipfilename = zipDoc.zipName
        var zipRecord = { "zipName": zipfilename, "filecontents": [] };
        var inputstream = null;
        if (config.use_eFA_store.toLowerCase() == "true") {
            inputstream = await eFA.getDocument(zipDoc.zipFileID);
        } else {
            inputstream = gfs.createReadStream({ _id: zipDoc.zipFileID, root: config.attachment_collection });
        }
        var ziphandle = await inputstream.pipe(unzip.Parse());

        ziphandle.on('entry', async function (entry) {
            var metadata_file_starts_with = config.metadata_file_starts_with;
            var metadata_file_ends_with = config.metadata_file_ends_with;
            var startsWith = metadata_file_starts_with ? (entry.path.toLowerCase().startsWith(metadata_file_starts_with.toLowerCase()) ? true : false) : true;
            var endsWith = metadata_file_ends_with ? (entry.path.toLowerCase().endsWith(metadata_file_ends_with.toLowerCase()) ? true : false) : true;
            if (entry.type === "File" && entry.path.toLowerCase().endsWith(".xml")) { //xml file inside zip
                try {
                    if (entry.path.toLowerCase().endsWith(".xml")) {

                        var xmlBufferString = await streamToString_utf16(entry);
                        var json = convertXMLToJSON(xmlBufferString);
                        checkDuplicateDCN(json).then(async () => {
                            await processOCRFile(zipDoc, entry, zipRecord, json);
                            channel.assertQueue('uploadZipContents', { durable: true }).then(async () => {
                                channel.sendToQueue('uploadZipContents', Buffer.from(zipDoc.id));
                            });
                            // await uploadZipFileContents(zipDoc.id);
                            // await sendNackForPartiallyIngestedFiles();
                            // sendAckNack()
                            //     .then(() => {
                            //         //setTimeout(IngestionLoop, config.ingestion_interval_in_milliseconds);
                            //     })
                            //     .catch((err) => {
                            //         console.log("Ingestion error..." + err);
                            //         //setTimeout(IngestionLoop, config.ingestion_interval_in_milliseconds);
                            //     })
                        }).catch(async (dcn) => {
                            if (dcn === 'error') {
                                // send document to Error Folder
                                await movefile(config.dir_path + defaultDownloadSourceIngestingDir + "/" + zipfilename, config.dir_path + defaultDownloadSourceErrorDir + "/" + zipfilename);
                                await amrestFilesModel.remove({ _id: zipDoc._id });
                            } else {
                                //send document to NACK FOLDER
                                reason = dcn + " duplicate dcn ";
                                await uploadNAck(zipfilename, zipDoc._id, dcn, reason)
                            }

                        });
                    }
                } catch (e) {
                    console.log(e);
                    await amrestFilesModel.findByIdAndUpdate(zipDoc.id, {
                        $set: {
                            "markAsCorrupted": true
                        }
                    });
                    entry.autodrain();
                }
            } else {
                entry.autodrain();
            }
        });
        ziphandle.on('close', async function () {
            // try {//Move source files from ingesting folder to done folder upon successful save to mongo
            //   var movedfile = await movefile(null, defaultSftpPath + defaultDownloadSourceIngestingDir + "/" + zipfilename, defaultSftpPath + defaultSourceMoveToDir + "/" + zipfilename);
            // } catch (err) { console.log(err) }
        });
        ziphandle.on('finish', async function () {
        })
        ziphandle.on('error', async function (err) {
            console.log("??????? ??????? " + zipfilename + " " + err);
            // try {//Move source files from ingesting folder to error folder for error condition
            //   var movedfile = movefile(null, defaultSftpPath + defaultDownloadSourceIngestingDir + "/" + zipfilename, defaultSftpPath + defaultDownloadSourceErrorDir + "/" + zipfilename);
            // } catch (err) { }
        });
    } catch (err) {
        console.log(zipfilename + " " + err);
        try {//Move source files from ingesting folder to error folder for error condition
        } catch (err) { }
    }
}

async function checkDuplicateDCN(json) {
    return new Promise(async (resolve, reject) => {
        var xmlData = JSON.parse(replaceAll(JSON.stringify(json), "$", "attribute"));
        if (xmlData.Workset && xmlData.Workset.Document && xmlData.Workset.Document.length) {
            dcn = xmlData.Workset.Document[0].Attribute.DocumentIdentifier;
            duplicateDoc = await amrestFilesModel.find({ dcn: dcn });
            if (duplicateDoc && duplicateDoc.length) {
                reject(dcn);
            } else {
                resolve();
            }
        } else {
            reject('error');
        }
    })

}

async function processOCRFile(zipDoc, entry, zipRecord, json) {
    try {
        zipRecord.xmlName = entry.path.substring(entry.path.lastIndexOf("/") + 1);
        zipRecord.xmlData = JSON.parse(replaceAll(JSON.stringify(json), "$", "attribute"));
        zipRecord.auditData = getFirstAuditEntry();
        if (zipRecord.xmlData.Workset && zipRecord.xmlData.Workset.Document && zipRecord.xmlData.Workset.Document.length) {
            zipRecord.dcn = zipRecord.xmlData.Workset.Document[0].Attribute.DocumentIdentifier;
            zipRecord.totalPageCount = zipRecord.xmlData.Workset.Document[0].Page.length;
            zipRecord.commonData = prepareBoxOfficeCommonData(zipRecord);
            zipRecord.boxofficeData = prepareBoxOfficeData(zipRecord);
            if (zipRecord.boxofficeData.page_1.data['H_BARCODE_3OF9']) {
                zipRecord.endorserNumber = zipRecord.boxofficeData.page_1.data['H_BARCODE_3OF9'].value;
            }
            zipRecord.documentType = zipRecord.boxofficeData.page_1.pageType;
        }
        if (!zipRecord.boxofficeData.page_1.data.H_CUSTID) {
            zipRecord.boxofficeData.page_1.data['H_CUSTID'] = { value: config.default_Organization, fieldType: "Text", fieldname: 'H_CUSTID' }

        }
        if (!zipRecord.boxofficeData.page_1.data.H_PROJID) {
            zipRecord.boxofficeData.page_1.data['H_PROJID'] = { value: config.default_Project, fieldType: "Text", fieldname: 'H_PROJID' };
        }
        zipRecord.commonData["bo_organization"] = { organizationCode: zipRecord.boxofficeData.page_1.data.H_CUSTID.value.toLowerCase() };
        zipRecord.commonData["bo_project"] = { projectCode: zipRecord.boxofficeData.page_1.data.H_PROJID.value.toLowerCase() };
        zipRecord.commonData.bo_lastModifiedDate = new Date().getTime();
        zipRecord.commonData.bo_ingestionDate = new Date().getTime();
        zipRecord.commonData.ack = { attemptToMergePDF: 0, pdfMergeSuccess: false, sendAckNack: "NA" }
        await amrestFilesModel.findByIdAndUpdate(zipDoc.id, zipRecord);
        await amrestFilesModel.findByIdAndUpdate(zipDoc.id, { $unset: { "ingestionStartedTime": 1 } });
        console.log("amrest process completed");
    } catch (error) {
        console.log(error);
    }
}

async function uploadZipFileContents(zipDocId) {
    try {
        var inputstream = null;
        var zipDoc = await amrestFilesModel.findById({ "_id": zipDocId });
        zipDoc = zipDoc._doc;
        if (zipDoc && zipDoc._doc) {
            if (config.use_eFA_store.toLowerCase() == "true") {
                inputstream = await eFA.getDocument(zipDoc.zipFileID);
            } else {
                inputstream = gfs.createReadStream({ _id: zipDoc.zipFileID, root: config.attachment_collection });
            }
            var writestream = unzip.Parse();
            var ziphandle = await inputstream.pipe(unzip.Parse());
            ziphandle.on('entry', async function (entry) {
                if (entry.type === "File") {
                    try {
                        entry.path = entry.path.substring(entry.path.lastIndexOf("/") + 1);
                        await entryToMongo(false, entry, zipDoc);
                        await amrestFilesModel.findByIdAndUpdate(zipDoc._id, zipDoc);
                    } catch (err) {
                        console.log(err);
                        entry.autodrain();
                    }
                } else {
                    entry.autodrain();
                }
            });
            ziphandle.on('close', async function () {

            });
            ziphandle.on('error', async function () {

            });
        }
    } catch (e) {
        console.error(e);
    }
}


function convertXMLToJSON(xmlData) {
    var xmlData_processed = xmlData.replace(/\$/g, "__Dollar__");
    var xmlParsingResult = parseStringSync(xmlData_processed);
    var replaceDollarRegex = new RegExp("__Dollar__", "g");
    strJson = JSON.stringify(xmlParsingResult).replace(/\"\$\":/g, "\"Attribute\"\:")
        .replace(replaceDollarRegex, "\$");
    return JSON.parse(strJson);
}

function prepareBoxOfficeData(zipRecord) {

    try {
        var boxofficeData = {};
        for (j = 0; j < zipRecord.xmlData.Workset.Document[0].Page.length; j++) {
            var page = zipRecord.xmlData.Workset.Document[0].Page[j];
            pageNo = page.Attribute.PageNumber;
            pageType = page.Attribute.PageType;
            var doc = {};
            if (page.FieldData && page.FieldData.length) {
                for (i = 0; i < page.FieldData[0].Field.length; i++) {
                    fieldname = page.FieldData[0].Field[i].Attribute.FieldName;
                    fieldType = page.FieldData[0].Field[i].Attribute.FieldType;
                    fieldvalue = page.FieldData[0].Field[i].Output[0].Attribute.CapturedValue;
                    //confidence = page.FieldData[0].Field[i].Output[0].DataSource[0].Attribute.Confidence;
                    modifiedFieldName = fieldname.replace(/ /g, '_');
                    if (modifiedFieldName.toLowerCase() === "file_size") {
                        var unit = " KB";
                        try {
                            fieldvalue = parseInt(fieldvalue) / (1024);
                            if (fieldvalue > 1024) {
                                fieldvalue = (fieldvalue / 1024);
                                unit = " MB"
                            }
                        } catch (err) {
                            fieldvalue = 0;
                        } finally {
                            if (unit === " KB") {
                                fieldvalue = ((Math.floor(fieldvalue)).toLocaleString('en')) + unit;
                            } else {
                                fieldvalue = (fieldvalue.toFixed(2)) + unit;
                            }

                        }
                    }
                    fieldvalue = fieldvalue == "" ? "-" : fieldvalue;
                    doc[modifiedFieldName] = { "value": fieldvalue, "fieldname": fieldname, "fieldType": fieldType };
                }
                boxofficeData['page_' + pageNo] = { "pageType": pageType, data: doc };
            }
        }

    } catch (err) { }
    return boxofficeData;
}

function prepareBoxOfficeCommonData(zipRecord) {
    var doc = {};
    doc["bo_fileMetadata"] = [];
    for (i = 0; i < zipRecord.xmlData.Workset.Document[0].Page.length; i++) {
        var tmpJSON = {
            fileName: zipRecord.xmlData.Workset.Document[0].Page[i].Attribute.Filename,
            pageType: zipRecord.xmlData.Workset.Document[0].Page[i].Attribute.PageType,
            pageNo: zipRecord.xmlData.Workset.Document[0].Page[i].Attribute.PageNumber,
            pageConfidence: zipRecord.xmlData.Workset.Document[0].Page[i].Attribute.PageConfidence,
            // source: "ocr"
        }
        doc["bo_fileMetadata"].push(tmpJSON);
    }

    doc["bo_uniqueDocName"] = zipRecord.xmlData.Workset.Document[0].Attribute.DocumentIdentifier;
    //doc["bo_docFileName"] = zipRecord.xmlData.Document.Attribute.DocumentFilename;
    // doc["bo_queue"] = "Exception";
    doc["bo_docType"] = zipRecord.xmlData.Workset.Document[0].Attribute.DocumentType;
    return doc;
}


function searchAndReturnFileId(commonData, fileName, fileId, pageNo) {
    var found = false;
    commonData.bo_fileMetadata.forEach((metadata) => {
        if (metadata.fileName === fileName) {
            metadata.fileId = fileId;
            found = true;
        }
    });
    if (!found) {
        commonData.bo_fileMetadata.push({
            fileName: fileName,
            fileId: fileId,
            pageType: fileName.substr(fileName.lastIndexOf(".") + 1, fileName.length),
            pageNo: pageNo ? pageNo : -1,
            pageConfidence: 100
        });
    }
}

function getFirstAuditEntry() {
    var key = "System";
    return [{
        date: new Date(),
        event: "Created",
        userId: key,
        userName: key,
        userEmail: key,
        queue: "-"
    }]
}

async function fileStreamToMongo(inputstream, filename) {
    if (config.use_eFA_store.toLowerCase() == "true") {
        return new Promise(async (resolve, reject) => {
            var eFAId = await fileStreamToeFA(inputstream, filename);
            console.log(++filecounter + ") Ingested to eFA: " + eFAId + " : " + filename);
            resolve(eFAId);
        });
    } else {
        return new Promise((resolve, reject) => {
            var writestream = gfs.createWriteStream({ filename: filename, root: config.attachment_collection });
            inputstream.pipe(writestream);
            writestream.on('close', (file) => {
                console.log(++filecounter + ") Ingested : " + file._id + " : " + filename);
                resolve(file._id);
            });
            writestream.on('error', (file) => {
                console.log('Error while saving file to MongoDB : ' + filename);
                reject('Error while saving file to MongoDB : ' + filename);
            });
        })
    }

}

function fileStreamToeFA(inputstream, filename) {
    return new Promise(async (resolve, reject) => {
        var eFAId = await eFA.storeFileIneFA(inputstream, filename);
        resolve(eFAId);
    })
}

async function diskFileToMongo(filename) {
    return new Promise((resolve, reject) => {
        var inputstream = fs.createReadStream(filename);
        var writestream = gfs.createWriteStream({ filename: filename, root: config.attachment_collection });
        inputstream.pipe(writestream);
        writestream.on('close', (file) => {
            console.log('Saved to Mongo ' + file._id);
            fs.unlink(filename, function (err) { if (err) console.log(err) }); //delete the file after it is written to gridfs
            resolve(file._id);
        });
        writestream.on('error', (file) => {
            console.log('Error while saving file to MongoDB : ' + filename);
            reject('Error while saving file to MongoDB : ' + filename);
        });
    })
}

async function entryToMongo(writetoDisk, entry, zipRecord) {
    return new Promise(async (resolve, reject) => {
        try {
            var writestream = null;
            if (writetoDisk)
                writestream = fs.createWriteStream(entry.path);
            else
                writestream = gfs.createWriteStream({ filename: entry.path, root: config.attachment_collection });

            if (config.use_eFA_store.toLowerCase() == "true") {
                var fileid = await eFA.storeFileIneFA(entry, entry.path);
                var filename = entry.path.substring(entry.path.lastIndexOf("/") + 1);
                var pageType, pageNo;
                for (let commonData of zipRecord.commonData.bo_fileMetadata) {
                    if (commonData.fileName === filename) {
                        pageType = commonData.pageType;
                        pageNo = commonData.pageNo;
                        break;
                    }
                }
                zipRecord.filecontents.push({ "name": filename, "fileid": fileid, "pageType": pageType, "pageNo": pageNo });
                searchAndReturnFileId(zipRecord.commonData, filename, fileid, pageNo);
                if (filename.toLowerCase().endsWith('.tif') || filename.toLowerCase().endsWith('.tiff') || getProbableTiffExtension(filename)) {
                    if (!zipRecord.pdfCount) { zipRecord.pdfCount = 0; }
                    var fileId = await convertTiiffToPDF(zipRecord, fileid, filename, pageType, pageNo);
                    resolve("Success");
                } else {
                    resolve("Success");
                }

            } else {
                await entry.pipe(writestream);
                writestream.on('close', async (file) => {
                    var fileid;
                    if (writetoDisk)
                        fileid = await diskFileToMongo(entry.path);
                    else
                        fileid = file._id;
                    var filename = entry.path.substring(entry.path.lastIndexOf("/") + 1);
                    var pageType, pageNo;
                    for (let commonData of zipRecord.commonData.bo_fileMetadata) {
                        if (commonData.fileName === filename) {
                            pageType = commonData.pageType;
                            pageNo = commonData.pageNo;
                            break;
                        }
                    }
                    zipRecord.filecontents.push({ "name": filename, "fileid": fileid, "pageType": pageType, "pageNo": pageNo });
                    searchAndReturnFileId(zipRecord.commonData, filename, fileid, pageNo);
                    if (filename.toLowerCase().endsWith('.tif') || filename.toLowerCase().endsWith('.tiff') || getProbableTiffExtension(filename)) {
                        if (!zipRecord.pdfCount) { zipRecord.pdfCount = 0; }
                        var fileId = await convertTiiffToPDF(zipRecord, fileid, filename, pageType, pageNo);
                        resolve("Success");
                    } else {
                        resolve("Success");
                    }

                });
                writestream.on('error', (file) => {
                    console.log('Error while saving file to Disk : ' + filename);
                    reject('Error while saving file to Disk : ' + filename);
                });
            }
        } catch (err) {

        }
    })
}

function getProbableTiffExtension(fileName) {
    var fileExt = fileName.split('.').pop();
    if (!isNaN(parseInt(fileExt))) {
        return true;
    }
    return false;
}

async function uploadAck(zipfilename, zipid, DCN) {
    var Readable = require('stream').Readable
    var msgStream = new Readable({
        read(size) {
            this.push(DCN + " injested successfully.");
            this.push(null);
        }
    });
    writestream = fs.createWriteStream(config.dir_path + defaultACKDestDir + "/" + zipfilename + ".ack");
    msgStream.pipe(writestream);
    writestream.on('finish', async function () {
        try {//Move source files from ingesting folder to done folder upon successful save to mongo
            var movedfile = await movefile(config.dir_path + defaultDownloadSourceIngestingDir + "/" + zipfilename, config.dir_path + defaultSourceMoveToDir + "/" + zipfilename);
        } catch (err) { console.log(err) }
        console.log("Successful ACK for " + zipfilename + " (DCN = " + DCN + ")");

    })

}

async function uploadNAck(zipfilename, zipid, DCN, reason) {
    var Readable = require('stream').Readable
    var msgStream = new Readable({
        read(size) {
            // this.push(DCN + " pdf merging failed ");
            this.push(reason);
            this.push(null);
        }
    });
    writestream = fs.createWriteStream(config.dir_path + defaultNACKDestDir + "/" + zipfilename + ".nack");
    msgStream.pipe(writestream);
    writestream.on('finish', async function () {
        try {//Move source files from ingesting folder to done folder upon successful save to mongo
            await movefile(config.dir_path + defaultDownloadSourceIngestingDir + "/" + zipfilename, config.dir_path + defaultDownloadSourceErrorDir + "/" + zipfilename);
            await amrestFilesModel.remove({ _id: zipid });
        } catch (err) { console.log(err) }
        console.log("Successful NACK for " + zipfilename + " (DCN = " + DCN + ")");

    })

}



async function isDuplicateFile(zipName) {
    var duplicate = false;

    let zipRec = await amrestFilesModel.findOne({ "zipName": zipName, 'commonData.bo_ingestionDate': { $exists: true } });
    if (zipRec) {
        duplicate = true;
        var Readable = require('stream').Readable
        var msgStream = new Readable({
            read(size) {
                this.push(zipName + " not injested(duplicate file name)");
                this.push(null);
            }
        });
        writestream = fs.createWriteStream(config.dir_path + defaultNACKDestDir + "/" + zipName + ".nack");
        msgStream.pipe(writestream);
        writestream.on('finish', function () {
            console.log("Sending NACK for duplicate file " + zipName);
        });
    } else {
        //remove partially ingested records.
        await amrestFilesModel.remove({ "zipName": zipName });
    }
    return duplicate;
}

async function sendAckNack() {
    var ackBatches = await amrestFilesModel.find({ "commonData.ack.pdfMergeSuccess": true, "commonData.ack.sendAckNack": "NA" });
    for (var i = 0; i < ackBatches.length; i++) {
        var item = ackBatches[i]._doc
        await uploadAck(item.zipName, item._id.toString(), item.dcn);
        await amrestFilesModel.update({ _id: item._id }, { "commonData.ack.sendAckNack": "ack" });
    }
    //Max merge attempt is 5 for now.
    var nackBatches = await amrestFilesModel.find({ "commonData.ack.pdfMergeSuccess": false, "commonData.ack.attemptToMergePDF": { $gt: 5 }, "commonData.ack.sendAckNack": "NA" });
    for (var i = 0; i < nackBatches.length; i++) {
        var item = nackBatches[i]._doc;
        var reason = item.commonData.ack.failureMessage;
        if (!reason) {
            reason = item.dcn + " pdf merging failed ";
        }

        await uploadNAck(item.zipName, item._id.toString(), item.dcn, reason);
        await amrestFilesModel.update({ _id: item._id }, {
            "commonData.ack.sendAckNack": "nack",
            "zipName": item.zipName + "_" + Date.now(),
            "dcn": item.dcn + "_" + Date.now(),
            "commonData.ack.failureMessage": reason
        });
    }
    //setTimeout(sendAckNack, 1000);
}


async function sendNackForPartiallyIngestedFiles() {
    var nackBatches = await amrestFilesModel.find({
        $and: [{ "ingestionStartedTime": { $exists: true } },
        {
            "ingestionStartedTime": {
                $lte: new Date().setMinutes(new Date().getMinutes() - 2)
            }
        }, { $or: [{ "commonData": { $exists: false } }, { "commonData.ack": { $exists: false } }, { "commonData.ack.sendAckNack": { $exists: false } }] }]
    });
    for (var i = 0; i < nackBatches.length; i++) {
        var item = nackBatches[i]._doc;
        await amrestFilesModel.remove({ _id: item._id });
        //Try Reingesting or send nack
        try {
            var zipfilename = item.zipName;
            if (zipfilename.startsWith("retry_")) {
                throw "Retry ingestion failed...for file " + zipfilename;
            } else {

                var movedfile = await movefile(config.dir_path + defaultDownloadSourceIngestingDir + "/" + zipfilename, config.dir_path + defaultDownloadSourceErrorDir + "/" + zipfilename + '.error');
            }
        } catch (err) {
            console.log(err);
            //Send Nack
            var reason = item.zipName + " is partially ingested. Please try again.";
            await uploadNAck(item.zipName, item._id.toString(), item.zipName, reason);
        }
    }
}


async function convertTiiffToPDF(zipRecord, fileid, filename, pageType, pageNo) {
    return new Promise(async (resolve, reject) => {
        try {
            var imageData;
            if (config.use_eFA_store.toLowerCase() == "true") {
                imageData = await eFA.getDocument(fileid);
            } else {
                imageData = await gfs.createReadStream({ _id: fileid, root: config.attachment_collection });
            }
            var buffers = [];
            imageData.on('data', function (buffer) {
                buffers.push(buffer);
            });

            imageData.on('end', async function () {
                var data = Buffer.concat(buffers);
                if (data != undefined && data.length) {
                    try {
                        var tiff = new Tiff({ buffer: data });
                    } catch (err) {

                    }
                    var images;
                    if (tiff) {
                        images = await writeLayer(tiff);
                    } else {
                        reason = filename + ' Tiff file  is corrupted from ' + zipRecord.zipName;
                        await sendToError(zipRecord.zipName, zipRecord._id, zipRecord.dcn, reason);
                        reject();
                    }

                    //  for (var i = 0, len = tiff.countDirectory(); i < len; ++i) {
                    //     images=await writeLayer(tiff, i);
                    //  }
                    if (images) {
                        var doc = new PDFDocument({
                            layout: 'landscape',
                            margin: 0,
                            size: [tiff.height(), tiff.width()]
                        });
                        tiff.close();
                        var pageRatio = doc.page.Width / doc.page.Height;
                        doc.image(images, {
                            // fit: [doc.page.height,doc.page.width],
                            // valign: 'center'
                        });
                        // images.forEach(element => {
                        //     doc.image(images, {
                        //         // fit: [doc.page.height,doc.page.width],
                        //         // valign: 'center'
                        //     });
                        // });
                        var fileName = filename + '.pdf';
                        console.log(filename + "  Successfully converted to " + fileName);
                        if (config.use_eFA_store.toLowerCase() == "true") {
                            var chunks = [];
                            doc.on('data', function (data) {
                                chunks.push(data)
                            });
                            doc.on('end', function () {
                                eFA.storeFileIneFA(Buffer.concat(chunks), fileName).then((eFAFileId) => {
                                    if (pageNo) {
                                        zipRecord.pdfCount++;
                                    }
                                    zipRecord.filecontents.push({ "name": fileName, "fileid": eFAFileId, "fileType": pageType, "pageNo": pageNo });
                                    searchAndReturnFileId(zipRecord.commonData, fileName, eFAFileId, pageNo);
                                    console.log('Saved to eFA ' + eFAFileId);
                                    if (fs.existsSync(images)) {
                                        fs.unlink(images, function (err) {
                                            if (err) console.log(err)
                                        });
                                    }
                                    resolve(eFAFileId)
                                }).catch((err) => { reject(err); });

                            });
                        } else {
                            writestream = gfs.createWriteStream({ filename: fileName, root: config.attachment_collection });
                            doc.pipe(writestream);
                            writestream.on('close', (file) => {
                                console.log('Saved to Mongo ' + file._id);
                                zipRecord.filecontents.push({ "name": fileName, "fileid": file._id, "fileType": pageType, "pageNo": pageNo });
                                var fileid = file._id;
                                if (pageNo) {
                                    zipRecord.pdfCount++;
                                }
                                searchAndReturnFileId(zipRecord.commonData, fileName, fileid, pageNo);
                                if (fs.existsSync(images)) {
                                    fs.unlink(images, function (err) {
                                        if (err) console.log(err)
                                    });
                                }
                                resolve(fileid)
                            });
                            writestream.on('error', (file) => {
                                console.log('Error while convert file to PDF : ' + filename);
                                reject('Error while convert file to PDF : ' + filename);
                            });
                        }
                        doc.on('end', () => {
                            fs.unlink(images, function (err) {
                                if (err) {
                                    //console.log(err)
                                }
                            });
                        })
                        doc.end()
                    }
                } else {
                    if (data.length <= 0) {
                        reason = filename + ' Tiff file  is corrupted from ' + zipRecord.zipName;
                        await sendToError(zipRecord.zipName, zipRecord._id, zipRecord.dcn, reason);
                    } else {
                        reject('Error while convert file to PDF : ' + filename);
                    }
                }
            });
        } catch (err) {
            console.log(err);
            reject(err);
        }

    });

}


async function sendToError(zipfilename, zipid, DCN, reason) {
    try {
        var Readable = require('stream').Readable
        var msgStream = new Readable({
            read(size) {
                // this.push(DCN + " pdf merging failed ");
                this.push(reason);
                this.push(null);
            }
        });
        writestream = fs.createWriteStream(config.dir_path + defaultDownloadSourceErrorDir + "/" + zipfilename + ".error");
        msgStream.pipe(writestream);
        writestream.on('finish', async function () {
            try {//Move source files from ingesting folder to done folder upon successful save to mongo
                await movefile(config.dir_path + defaultDownloadSourceIngestingDir + "/" + zipfilename, config.dir_path + defaultDownloadSourceErrorDir + "/" + zipfilename);
                await amrestFilesModel.remove({ _id: zipid });
            } catch (err) { console.log(err) }
            console.log("Successful NACK for " + zipfilename + " (DCN = " + DCN + ")");

        });
    } catch (err) {
        console.log(err);
    }
}

async function writeLayer(tiff) {
    return new Promise(async (resolve, reject) => {
        //tiff.setDirectory(layer);
        try {
            var width = tiff.width();
            var height = tiff.height();
            var bufsiz = width * height * 4;
            var raster = Tiff.Module.ccall('_TIFFmalloc', 'number', ['number'], [bufsiz]);
            var result = Tiff.Module.ccall('TIFFReadRGBAImageOriented', 'number', [
                'number',
                'number',
                'number',
                'number',
                'number',
                'number'
            ], [
                    tiff._tiffPtr,
                    width,
                    height,
                    raster,
                    1,
                    0
                ]);

            if (result === 0) {
                throw new Tiff.Exception('The function TIFFReadRGBAImageOriented returns NULL');
            }
            var image = Tiff.Module.HEAPU8.subarray(raster, raster + bufsiz);
            var png = new PNG({
                filterType: -1,
                width: width,
                height: height
            });
            for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                    var idx = (y * width + x) * 4;
                    png.data[idx] = image[idx];
                    png.data[idx + 1] = image[idx + 1];
                    png.data[idx + 2] = image[idx + 2];
                    png.data[idx + 3] = image[idx + 3];
                }
            }
            var fileName = __dirname + '/tifftopngfile-' + Math.random() + '.png';
            Tiff.Module.ccall('free', 'number', ['number'], [raster]);
            const file = fs.createWriteStream(fileName);
            png.pack().pipe(file, true);
            file.on("finish", () => {
                resolve(fileName);
            }); // not sure why you want to pass a boolean
            file.on("error", reject); // don't forget this!
        } catch (err) {
            console.log(err);
        }

    });
}

cleanupFile();
setInterval(cleanupFile, 1000 * 60 * 60 * 12);
async function cleanupFile() {
    console.log("check dangling files.")
    var files = fs.readdirSync(".");
    for (var i = 0; i < files.length; i++) {
        if (files[i].endsWith(".png") || files[i].endsWith(".zip")) {
            var creationTimeMs = await new Promise((resolve, reject) => {
                fs.stat(files[i], function (err, stats) {
                    if (err) {
                        reject(0);
                    }
                    if (stats) {
                        resolve(stats.birthtimeMs);
                    } else {
                        reject(0);
                    }
                });
            });
            if (new Date().getTime() - creationTimeMs > 1000 * 60 * 60 * 12) {
                try {
                    fs.unlinkSync(files[i]);
                } catch (e) { console.log(e) }
                console.log(files[i] + " file deleted under cleanup activity.");
            }
        }
    }
}

removeUnmergedDoc();
async function removeUnmergedDoc() {
    try {
        amrestFilesModel.find({
            $where: "this.totalPageCount != this.pdfCount",
            "commonData.bo_fileMetadata.pageType": { $ne: "FULL" },
            "commonData.bo_ingestionDate": {
                $lt: new Date().setMinutes(new Date().getMinutes() - 60 * 2)
            }
        }, { _id: 1, zipName: 1 }, async (err, zipDoc) => {
            if (!err) {
                for (let doc of zipDoc) {
                    if (fs.existsSync(config.dir_path + defaultDownloadSourceIngestingDir + "/" + doc._doc.zipName)) {
                        await movefile(config.dir_path + defaultDownloadSourceIngestingDir + "/" + doc._doc.zipName, config.dir_path + defaultDownloadSourceDir + "/retry_" + doc._doc.zipName);
                        await amrestFilesModel.remove({ _id: doc._doc._id })
                    }
                }
            }
        });
    } catch (err) {

    }
    setTimeout(removeUnmergedDoc, 4000);
}



//===============================================================================================================



