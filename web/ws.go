package web

import (
	"net/http"

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
