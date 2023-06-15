package smsd

import (
	"io"
	"os/user"
	"strings"
	"sync"
	"time"

	"github.com/ctaoist/gammu-web/config"
	"github.com/ctaoist/gammu-web/db"
	"github.com/ctaoist/gammu-web/message"

	log "github.com/ctaoist/gutils/log"
)

type event struct {
}

type Msg = message.Msg

var (
	GSM_StateMachine       *StateMachine
	sendMsgEvent           = make(chan event, 1000)
	boxEvent               = make(chan int, 1000) // 1: reveive, 2: send
	receiveLoopSleep       = 1
	outBox, inBox, sentBox []Msg
	inLock, outLock        sync.Mutex
	ownNumber              = ""
	errCount               = 0
	lastErr                error
)

func errCounter(e error) {
	if lastErr != e {
		lastErr = e
		errCount = 1
		return
	}
	errCount = errCount + 1
	if errCount >= 3 {
		log.Warn("GSMReset", "errCount >= 3, GSM hard reset")
		GSM_StateMachine.HardReset()
	}
}

func Init(config string) {
	var e error
	if config[:2] == "~/" {
		u, _ := user.Current()
		config = u.HomeDir + "/" + config[1:]
	}
	GSM_StateMachine, e = NewStateMachine(config)
	if e != nil {
		log.Fatal("GammuInit", e)
	}
	if e := GSM_StateMachine.Connect(); e != nil {
		log.Fatal("GammuInit", e)
	}
	log.Infof("GammuGetCountryCode", "Country code of phone: %s", GSM_StateMachine.GetCountryCode())
	log.Infof("GammuGetOwnNumber", "Own phone number: %s", GSM_StateMachine.GetOwnNumber())

	go ReseiveSendLoop()
	go StorageSMSLoop()
}

func Close() {
	GSM_StateMachine.free()
}

func GetOwnNumber() string {
	if !config.TestMode {
		return GSM_StateMachine.GetOwnNumber()
	}
	if ownNumber == "" {
		ownNumber = db.GetFirstCardNumber()
	}
	return ownNumber
}

func SendSMS(phone_number, text string) {
	if phone_number[0] != '+' {
		phone_number = GSM_StateMachine.country + phone_number
	}
	t := time.Now()
	msg := Msg{"", GSM_StateMachine.GetOwnNumber(), phone_number, text, true, t}
	msg.GenerateId()
	outLock.Lock()
	outBox = append(outBox, msg)
	outLock.Unlock()
	sendMsgEvent <- event{}
}

func ReceiveSMS() {
	sms, err := GSM_StateMachine.GetSMS()
	if err != nil {
		if err == io.EOF {
			return
		}
		log.Error("GammuGetSMS", err)
		errCounter(err)
		return
	}
	if len(sms.Body) <= 0 {
		c_gsm_deleteSMS(GSM_StateMachine, lastSms)
		return
	}
	log.Debugf("Test", "%+v\n", sms)
	if sms.Report {
		m := strings.TrimSpace(sms.Body)
		if strings.ToLower(m) == "delivered" {
			log.Debugf("Delivered SMS", "%+v\n", sms)
			boxEvent <- 2
		}
	} else {
		// Save a message in Inbox
		msg := Msg{"", GSM_StateMachine.GetOwnNumber(), sms.Number, sms.Body, false, sms.Time}
		msg.GenerateId()
		log.Infof("ReceivedSMS", "From %s with text: %s\n", msg.Number, msg.Text)
		inLock.Lock()
		inBox = append(inBox, msg)
		inLock.Unlock()
		boxEvent <- 1
	}
}

func ReseiveSendLoop() {
	for {
		ReceiveSMS()
		select {
		case <-sendMsgEvent:
			t := time.Now()
			outLock.Lock()
			i := 0
			for _, m := range outBox {
				GSM_StateMachine.SendLongSMS(m.Number, m.Text, true) // need report = true
				i++
				if time.Since(t) > 3*time.Second {
					break
				}
			}
			sentBox = outBox[:i]
			outBox = outBox[i:]
			outLock.Unlock()
		case <-time.After(time.Duration(receiveLoopSleep) * time.Second):
		}
	}
}

func StorageSMSLoop() {
	number := GSM_StateMachine.GetOwnNumber()
	for {
		i := <-boxEvent
		if i == 1 { // receive sms
			if len(inBox) < 1 {
				continue
			}
			inLock.Lock()
			for _, msg := range inBox {
				message.WsSendSMS(number, msg)
			}
			db.InsertSMSMany(inBox)
			db.UpdateAbstract(inBox[len(inBox)-1])
			inBox = []Msg{}
			inLock.Unlock()
		} else if i == 2 { // send sms
			if len(sentBox) < 1 {
				continue
			}
			outLock.Lock()
			for _, msg := range sentBox {
				log.Infof("SentSMS", "To %s with text: %s", msg.Number, msg.Text)
				message.WsSendSMS(number, msg)
			}
			db.InsertSMSMany(sentBox)
			db.UpdateAbstract(sentBox[len(sentBox)-1])
			sentBox = []Msg{}
			outLock.Unlock()
		}
	}
}
