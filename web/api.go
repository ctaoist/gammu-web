package web

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/ctaoist/gammu-web/db"
	"github.com/ctaoist/gammu-web/smsd"
	log "github.com/ctaoist/gutils/log"
)

func verifyToken(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]interface{}{"retCode": 0, "errorMsg": "", "msg": "Ok"})
}

func getPhoneInfo(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]interface{}{"retCode": 0, "errorMsg": "", "data": map[string]string{"ownNumber": smsd.GSM_StateMachine.GetOwnNumber()}})
}

func sendSMS(w http.ResponseWriter, r *http.Request) {
	// params := map[string]string{}
	// parseBody(r.Body, &params)
	params := r.Context().Value("Params").(map[string]string)
	if params["number"] == "" {
		json.NewEncoder(w).Encode(map[string]interface{}{"retCode": -1, "errorMsg": "Parse parameters missing"})
		return
	}
	log.Debugf("APISendSMS", "Plan to send SMS to %s with text: %s", params["number"], params["text"])

	// if e := sms.SendSMS(params["number"], params["text"]); e != nil {
	// 	json.NewEncoder(w).Encode(map[string]interface{}{"retCode": -1, "errorMsg": e.Error()})
	// 	return
	// }
	if len(params["number"]) < 1 || len(params["text"]) < 1 {
		json.NewEncoder(w).Encode(map[string]interface{}{"retCode": -1, "errorMsg": "Phone number or text was not correct"})
		return
	}
	smsd.SendSMS(params["number"], params["text"])
	json.NewEncoder(w).Encode(map[string]interface{}{"retCode": 0, "errorMsg": ""})
}

func deleteSMS(w http.ResponseWriter, r *http.Request) {
	params := r.Context().Value("Params").(map[string]string)
	if params["number"] == "" {
		json.NewEncoder(w).Encode(map[string]interface{}{"retCode": -1, "errorMsg": "Parse parameters missing"})
		return
	}
	db.DeleteSMS(smsd.GSM_StateMachine.GetOwnNumber(), params["number"])
	json.NewEncoder(w).Encode(map[string]interface{}{"retCode": 0, "errorMsg": ""})
}

func getAbstract(w http.ResponseWriter, r *http.Request) {
	params := r.Context().Value("Params").(map[string]string)
	page, own_number := 0, smsd.GetOwnNumber()
	if p, found := params["page"]; found {
		var e error
		page, e = strconv.Atoi(p)
		if e != nil {
			log.Error("ParseParams", e)
			// json.NewEncoder(w).Encode(map[string]interface{}{"retCode": -1, "errorMsg": e})
			// return
		}
	}

	msgs := db.GetAbstract(page, own_number)
	json.NewEncoder(w).Encode(map[string]interface{}{"retCode": 0, "errorMsg": "", "data": msgs})
}

func getMessages(w http.ResponseWriter, r *http.Request) {
	params := r.Context().Value("Params").(map[string]string)
	page, own_number, number := 0, smsd.GetOwnNumber(), params["number"]
	if p, found := params["page"]; found {
		var e error
		page, e = strconv.Atoi(p)
		if e != nil {
			log.Error("ParseParams", e)
		}
	}
	if len(number) <= 0 {
		json.NewEncoder(w).Encode(map[string]interface{}{"retCode": -1, "errorMsg": "Missing parameter: number"})
		return
	}

	msgs := db.GetMessagesByNumber(page, own_number, number)
	json.NewEncoder(w).Encode(map[string]interface{}{"retCode": 0, "errorMsg": "", "data": msgs})
}
