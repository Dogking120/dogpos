var sessionState = null

/*sessionState: {
    currentItem
    currentImage
    currentCount
    inventory
    total
}*/

function sell() {
    window.ipc.postState(sessionState)
    sessionState = window.ipc.syncState(['sync'])
    console.log(sessionState.total)
    setTab('currentCount')
    setTab('total')
}

function changeItem() {
    sessionState = window.ipc.syncState(['changeItem'])
    setTab('currentItem')
    setTab('currentCount')
    setImage()
}

function addItems(amount) {
    sessionState = window.ipc.syncState(['changeCount', amount])
    setTab('currentCount')
    setTab('total')
}

function setImage() {

    let img = document.getElementById('item_image')
    img.src = sessionState.currentImage

}

function setTab(tab_name) {

    let tab = document.getElementById(tab_name)
    let tab_value = tab.getElementsByClassName('value')[0]
    
    tab_value.textContent = sessionState[tab_name]

}

(() => {
    sessionState = window.ipc.syncState(['sync'])
    console.log(sessionState)

    setTab('currentItem')
    setTab('currentCount')
    setTab('total')
    setImage()
})()