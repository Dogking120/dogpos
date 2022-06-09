const { app, BrowserWindow, ipcMain } = require('electron');
const electron = require('electron');

const fs = require('fs');
const path = require('path');

const itemspath = path.join(__dirname, 'local', 'items');
const items_file_path = path.join(itemspath, 'items_file.json');

const raw_items = fs.readFileSync(items_file_path);
const items_object = JSON.parse(raw_items);

function calculatePrice(price, batch, batchPrice, count) {

    let remainder = (count % batch)

    let batches = (count - remainder) / batch

    return remainder * price + batches * batchPrice
}

const updateSession = (add) => {

    if (add === null) {
        session.index = (session.index += 1) % session.inventory.length
        session.currentImage = path.join(__dirname, 'local', 'items', 'images', session.inventory[session.index].image)
    } else {
        session.inventory[session.index].count = Math.max((session.inventory[session.index].count + add), 0)
    }
    session.currentItem = session.inventory[session.index].display_name
    session.currentCount = session.inventory[session.index].count

    session.total = (() => {
        let total = 0
        session.inventory.forEach((item) => {
            total += calculatePrice(
                item.cost,
                item.batch_size,
                item.batch_cost,
                item.count
            )
        })
        return total
    })()

}

var session = (() => {

    let object = {}
    Object.assign(object, items_object)

    object.inventory.forEach((item) => { item.count = 0 })

    object.index = 0
    object.currentItem = object.inventory[0].display_name
    object.currentImage = path.join(__dirname, 'local', 'items', 'images', object.inventory[0].image)
    object.currentCount = 0

    object.total = 0

    return object

})()

var sessionLog = { Transactions: [] }

const createWindow = () => {

    var primaryDisplay = electron.screen.getPrimaryDisplay();
    var displaySize = primaryDisplay.size;

    const win = new BrowserWindow({
        width: displaySize.width,
        height: displaySize.height,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.on('close', () => {

        if (sessionLog.Transactions.length === 0) { return }

        let log = sessionLog
        let expected_total = 0
        let expected_volume = 0

        log.Transactions.forEach((transaction) => {
            expected_total += transaction['Total Earnings']
            expected_volume += transaction['Total Volume']
        })

        log['Expected Total'] = expected_total
        log['Expected Volume'] = expected_volume

        let raw = JSON.stringify(log)
        fs.writeFileSync(path.join(__dirname, 'local', 'logs', (Date.now() + '.json')), raw)
    })

    win.loadFile('./index.html');
}

function mutateSession(goal, add) {

    switch (goal) {
        case 'changeItem':
            updateSession(null)
            break;
        case 'changeCount':
            updateSession(add)
            break;
        default:
            break;
    }

}

const logSession = () => {
    let object = {}
    let volume = 0

    session.inventory.forEach((item) => {
        object[item.display_name] = item.count
        volume += item.count
    })

    object['Timestamp'] = Date()
    object['Total Volume'] = volume
    object['Total Earnings'] = session.total

    return object 
}

app.whenReady().then(() => {
    createWindow();
});

ipcMain.on('post_state', (event, arg) => {

    sessionLog.Transactions.push(logSession())
    console.log(sessionLog)

    session.inventory.forEach((item) => { item.count = 0 })
    session.currentCount = 0
    session.total = 0
})

ipcMain.on('sync_state', (event, args) => {
    mutateSession(args[0], args[1])
    event.returnValue = session
})