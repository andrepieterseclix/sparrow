const { dialog, app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const importDir = getWorkingDirectory('blob');
const dataDirectory = getWorkingDirectory('base');

// Data Access
const { DataAccess } = require('./app/scripts/infrastructure/dataAccess');
let dataAccess = null;

// Security
const { SecurityHandler } = require('./app/scripts/infrastructure/securityHandler');
const securityHandler = new SecurityHandler(dataDirectory);
let loggedIn = false;

// Web Server
const { VideoStreamingServer } = require('./app/scripts/infrastructure/videoStreamingServer');
const streamingServer = new VideoStreamingServer(importDir);
streamingServer.start();

function getWorkingDirectory(subdir) {
    let wd = app.getAppPath();
    if (wd.endsWith('.asar')) {
        wd = path.dirname(wd);
    }
    wd = path.join(wd, 'data', subdir);
    return wd;
}

// User Interface
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let window;
let securityWindow;
let importWindow;

function runApp() {
    // Create the browser window.
    window = new BrowserWindow({
        width: 1200,
        height: 900,
        show: false,
        frame: true,
        autoHideMenuBar: true,
        webPreferences: {
            webSecurity: true,
            allowRunningInsecureContent: false,
            plugins: true,
            nodeIntegration: true
        }
    });

    securityWindow = new BrowserWindow({
        parent: window,
        width: 410,
        height: 450,
        show: false,
        frame: false
    });

    securityWindow.on('closed', () => {
        securityWindow = null;
        if (!loggedIn)
            app.quit();
    });

    securityWindow.once('ready-to-show', () => {
        securityWindow.show();
        //securityWindow.webContents.openDevTools();
    });

    window.once('ready-to-show', () => {
        window.show();
    });

    window.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        window = null;
        app.quit();
    });


    securityHandler.checkSecurity()
        .then(result => {
            if (result.requiresInput) {
                securityWindow.loadFile('app/securitySetup.html');
            }
            else if (result.isEncrypted) {
                securityWindow.loadFile('app/login.html');
            }
            else {
                showMainWindow(result);
            }
        })
        .catch(err => console.log(err));
}

function createImportWindow(parameters) {
    parameters = parameters || {};

    importWindow = new BrowserWindow({
        width: 800,
        height: 600,
        parent: window,
        frame: false,
        modal: true,
        show: false
    });

    importWindow.once('ready-to-show', () => {
        importWindow.show();

        if (parameters.categoryId) {
            importWindow.webContents.send('videos:import:setCategory', parameters);
        }
    });

    importWindow.loadFile('app/video_import.html');

    importWindow.on('closed', () => {
        importWindow = null;
    });
}

function showMainWindow(recordHandlers) {
    loggedIn = true;
    if (securityWindow) {
        securityWindow.close();
        securityWindow = null;
    }

    // Set up data access security
    dataAccess = new DataAccess(dataDirectory, recordHandlers.encryptRecord, recordHandlers.decryptRecord);

    window.loadFile('app/index.html');
    window.maximize();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', runApp);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (window === null) {
        runApp();
    }
});

ipcMain.on('passwordSet', (event, data) => {
    securityHandler.setPassword(data.pw)
        .then(showMainWindow)
        .catch(err => console.error(err));
});

ipcMain.on('passwordEntered', (event, data) => {
    securityHandler.checkPassword(data.pw)
        .then(result => {
            if (result.isValid === true) {
                showMainWindow(result);
            }
            else {
                event.sender.send('passwordEntered:incorrect');
            }
        })
        .catch(err => console.error(err));
});

ipcMain.on('quit', () => {
    app.quit();
});

ipcMain.on('videos:import', (event, parameters) => {
    createImportWindow(parameters);
});

ipcMain.on('videos:export', (event, item) => {
    dialog.showSaveDialog({
        title: 'Export Video',
        defaultPath: path.join(app.getPath('downloads'), item.video.originalFileName),
        filters: [
            { name: 'MP4 Video (*.mp4)', extensions: ['mp4'] }
        ]
    }, exportPath => {
        event.sender.send('videos:export', { fileName: item.video._id, exportPath, importDir, item });
    });
});

ipcMain.on('data:createVideo', (event, item) => {
    const { video } = item;
    dataAccess.addVideo(video, (err, doc) => {
        item.video = doc;
        item.error = err;
        item.importDir = importDir;
        event.sender.send('data:createVideo', item);
    });
});

ipcMain.on('data:deleteVideo', (event, item) => {
    dataAccess.deleteVideo(item, (err, numDeleted) => {
        if (err)
            console.error(err);
        else if (numDeleted !== 1)
            console.log(`Expected to delete 1 video, actually deleted ${numDeleted}.`);
    });
});

ipcMain.on('videos:import:submit', (event, item) => {
    if (item)
        window.webContents.send('videos:import:submit', item);

    importWindow.close();
});

ipcMain.on('videos:import:selectFile', event => {
    dialog.showOpenDialog({
        title: 'Import Video',
        filters: [
            { name: 'MP4 Video (*.mp4)', extensions: ['mp4'] }
        ]
    }, files => {
        if (files)
            event.sender.send('videos:import:selectFile', files);
    });
});

ipcMain.on('categories:create:submit', (event, item) => {
    dataAccess.addCategory(item, (err, doc) => {
        event.sender.send('categories:create:submit', { err, doc });
    });
});

ipcMain.on('data:getCategories', event => {
    dataAccess.getCategories(categories => {
        event.sender.send('data:getCategories', categories);
    });
});

ipcMain.on('data:getCategory', (event, data) => {
    dataAccess.getCategory(data.id, result => {
        event.sender.send('data:getCategory', result);
    })
});

ipcMain.on('data:updateCategory', (event, category) => {
    dataAccess.updateCategory(category, result => {
        event.sender.send('data:updateCategory', result);
    })
});

ipcMain.on('data:deleteCategory', (event, item) => {
    dataAccess.deleteCategory(item, (err, info) => {
        event.sender.send('data:deleteCategory', { err, unsortedCategory: info.unsortedCategory });
    });
});

ipcMain.on('data:deleteVideo', (event, video) => {
    dataAccess.deleteVideo(video, err => {
        event.sender.send('data:deleteVideo', { err, importDir });
    });
});

ipcMain.on('data:updateVideo', (event, video) => {
    dataAccess.updateVideo(video, (err, result) => {
        event.sender.send('data:updateVideo', { err, video: result });
    });
});

ipcMain.on('data:getVideos', (event, spec) => {
    dataAccess.getVideos(spec)
        .then(result => event.sender.send('data:getVideos', { err: null, category: result }))
        .catch(err => event.sender.send('data:getVideos', { err }));
});

ipcMain.on('data:getVideo', (event, item) => {
    dataAccess.getVideo(item, (err, result) => {
        event.sender.send('data:getVideo', { err, result });
    });
});

ipcMain.on('videos:getRandom', (event, spec) => {
    dataAccess.getRandomVideos(spec)
        .then(result => event.sender.send('videos:getRandom', { err: null, result }))
        .catch(err => event.sender.send('videos:getRandom', { err }));
});

ipcMain.on('console.log', (event, info) => {
    console.log(info);
})