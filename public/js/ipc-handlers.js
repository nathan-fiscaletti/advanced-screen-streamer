const windows = require('./windows');
const settings = require('./settings');
const stream = require('./stream');

module.exports = {
    initialize: (app, ipcMain, screen) => {
        ipcMain.on('closeRegionSelector', () => {
            windows.closeRegionSelectionWindow();
        });

        ipcMain.on('saveRegion', () => {
            const bounds = windows.getRegionSelectionWindow().getBounds();
            stream.setStreamScreen(
                screen.getDisplayNearestPoint(
                    windows.getRegionSelectionWindow().getBounds()
                )
            );

            let streamRegion = { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
            if (process.platform === "darwin") {
                streamRegion.x -= stream.getStreamScreen().bounds.x;
                streamRegion.y -= stream.getStreamScreen().bounds.y;
            }
            stream.setStreamRegion(streamRegion);
            windows.closeRegionSelectionWindow();

            if (stream.isStreaming()) {
                stream.stopStream();
                stream.startStream({ app });
            }
        });

        ipcMain.on("getSettings", (event) => {
            event.sender.send("settings", settings.get());
        });

        ipcMain.on("closeSettingsWindow", (event) => {
            windows.closeSettingsWindow();
        });

        ipcMain.on("updateSettings", (event, newSettings) => {        
            const oldSettings = settings.get()
            // If default region changed, update current region to match
            if (oldSettings.defaultScreenCaptureWidth !== newSettings.defaultScreenCaptureWidth || 
                oldSettings.defaultScreenCaptureHeight !== newSettings.defaultScreenCaptureHeight) {
                const streamRegion = stream.getStreamRegion()
                streamRegion.width = newSettings.defaultScreenCaptureWidth
                streamRegion.height = newSettings.defaultScreenCaptureHeight
                stream.setStreamRegion(streamRegion)
            }

            settings.set(newSettings);
            if (stream.isStreaming()) {
                stream.stopStream();
                stream.startStream({ app });
            }
        });

        ipcMain.on('selectRegionOpened', (event, { maxWidth, maxHeight }) => {
            windows.restrictRegionSelectionWindowSize(maxWidth, maxHeight);
        });

        ipcMain.on("selectRegion", (event) => {
            windows.createRegionSelectionWindow({ app });
        });

        ipcMain.on("showSettings", (event, props) => {
            let _props = { app, tab: 0 };
            if (props) {
                _props = { ..._props, ...props };
            }
            windows.createSettingsWindow(_props);
        });

        ipcMain.on("startStream", (event) => {
            stream.startStream({ app });
        });

        ipcMain.on("stopStream", (event) => {
            stream.stopStream();
        });
    }
};