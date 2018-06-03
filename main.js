const {app, BrowserWindow, ipcMain, Tray} = require('electron')
const path = require('path')
const url = require('url')
const nba = require('nba-stats-client')

let window
let trayHome
let trayVisitor
let now = new Date()

app.dock.hide()

app.on('ready', () => {
  createHomeTray()
  createWindow()
})

app.on('window-all-closed', () => {
  app.quit()
})

const createHomeTray = () => {
  trayHome = new Tray("sunTemplate.png")
  trayHome.on('right-click', toggleWindow)
  trayHome.on('double-click', toggleWindow)
  trayHome.on('click', toggleWindow)
}

const createVisitorTray = () => {
  trayVisitor = new Tray("sunTemplate.png")
  trayVisitor.on('right-click', toggleWindow)
  trayVisitor.on('double-click', toggleWindow)
  trayVisitor.on('click', toggleWindow)
}

const toggleWindow = () => {
  if(window.isVisible()) {
    window.hide()
  } else {
    showWindow()
  }
}

const showWindow = () => {
  const position = getWindowPosition()
  window.setPosition(position.x, position.y, false)
  window.show()
  window.focus()
}

const getWindowPosition = () => {
  const windowBounds = window.getBounds()
  const trayBounds = trayHome.getBounds()
  const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))
  const y = Math.round(trayBounds.y + trayBounds.height + 4)
  return {x: x, y: y}
}

const createWindow = () => {
  window = new BrowserWindow({
    width: 500,
    height: 500,
    frame: false,
    show: false
  })
  window.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))
}

ipcMain.on('flag-message', (event, arg) => {
  var nbaGames = (nba.getGames(now.getFullYear(),now.getMonth() + 1,now.getDate() - 1))
  nbaGames.then(res => {
    event.sender.send('play-reply', res.sports_content.games)
  })
})

ipcMain.on('id-message', (event, arg) => {
  var last = 0
  var loop = setInterval(function(){
    console.log("refresh")
    var plays = nba.getPlayByPlay(now.getFullYear(),now.getMonth() + 1,now.getDate() - 1,arg)
    plays.then(res => {
      if (res == null) {
        console.log("比赛未开始")
      } else {
        createVisitorTray()
        var playData = res.sports_content.game.play
        var lastIndex = playData.length - 1
        var lastEvent = playData[lastIndex].event
        if(lastIndex > last) {
          last = lastEvent
          trayHome.setTitle("H: " + playData[lastIndex].home_score + "   " +playData[lastIndex].description)
          trayVisitor.setTitle("V: " + playData[lastIndex].visitor_score)
          if (playData[lastIndex].description = "End Period"){
            clearInterval(loop)
          }
        }
      }
    })
  }, 500)
})