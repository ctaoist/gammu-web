package web

import (
	"encoding/json"
	"io/ioutil"
	"net/http"
	"os"

	"github.com/ctaoist/gammu-web/config"
	"github.com/ctaoist/gammu-web/message"
	"github.com/ctaoist/gammu-web/smsd"
	"github.com/ctaoist/gutils/log"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	// cors
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
} // use default options

func wsHandler(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal("WSUpgrade", err)
	}
	number := smsd.GetOwnNumber()
	id := message.GenerateId()
	defer func() {
		message.RemoveWs(number, id)
		ws.Close()
	}()
	message.WS[number] = append(message.WS[number], message.NewWebSocket(id, ws))
	for {
		_, message, err := ws.ReadMessage()
		if err != nil {
			log.Error("WsRead", err)
			break
		}
		log.Info("WsRecv", string(message))
		// err = ws.WriteMessage(mt, message)
		// if err != nil {
		// 	log.Error("WsWrite", err)
		// 	break
		// }
	}
}

func logHandler(w http.ResponseWriter, r *http.Request) {
	if config.LogFile == "" {
		json.NewEncoder(w).Encode(map[string]interface{}{"retCode": -1, "errorMsg": "program has no log file"})
		return
	}
	fstate, err := os.Stat(config.LogFile)
	if err == nil {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		b := make([]byte, 500*1024)
		if fstate.Size()/1024 <= 500 { // 小于 500 kb
			b, err = ioutil.ReadFile(config.LogFile)
			if err != nil {
				json.NewEncoder(w).Encode(map[string]interface{}{"retCode": -1, "errorMsg": "can't read log file: " + err.Error()})
				return
			}
		} else { // 文件太大
			f, err := os.OpenFile(config.LogFile, os.O_RDONLY, os.ModePerm)
			defer f.Close()
			if err != nil {
				json.NewEncoder(w).Encode(map[string]interface{}{"retCode": -1, "errorMsg": "can't open log file: " + err.Error()})
				return
			}
			f.Seek(-500*1024, os.SEEK_END)
			f.Read(b)
		}
		w.Write(b)
	} else {
		json.NewEncoder(w).Encode(map[string]interface{}{"retCode": -1, "errorMsg": "log file not found"})
	}
}

func clearLog(w http.ResponseWriter, r *http.Request) {
	if err := os.Truncate(config.LogFile, 0); err != nil {
		log.Error("ClearLog", "Failed to truncate: ", err)
		json.NewEncoder(w).Encode(map[string]interface{}{"retCode": -1, "errorMsg": "can't clear log file: " + err.Error()})
	}
	json.NewEncoder(w).Encode(map[string]interface{}{"retCode": 0, "errorMsg": ""})
}
