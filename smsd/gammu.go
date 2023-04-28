// Go binding for libGammu (library to work with different cell phones)
package smsd

/*
#cgo pkg-config: gammu
// #cgo CFLAGS: -I/usr/include/gammu
// #cgo LDFLAGS: -lGammu -lm
// #include <stdlib.h>
#include <gammu.h>

void sendCallback(GSM_StateMachine *sm, int status, int msgRef, void *data) {
	if (status==0) {
		*((GSM_Error *) data) = ERR_NONE;
	} else {
		*((GSM_Error *) data) = ERR_UNKNOWN;
	}
}

void setStatusCallback(GSM_StateMachine *sm, GSM_Error *status) {
	GSM_SetSendSMSStatusCallback(sm, sendCallback, status);
}

GSM_Debug_Info *debug_info;
void setDebug() {
	debug_info = GSM_GetGlobalDebug();
	GSM_SetDebugFileDescriptor(stderr, TRUE, debug_info);
	GSM_SetDebugLevel("textall", debug_info);
}
*/
import "C"
import (
	"fmt"
	"io"
	"runtime"
	"time"
	"unsafe"

	gerror "github.com/ctaoist/gutils/error"
	log "github.com/ctaoist/gutils/log"
)

// Error
type Error = gerror.Error

func (e C.GSM_Error) Error() string {
	return C.GoString(C.GSM_ErrorString(C.GSM_Error(e)))
}

// type Error struct {
// 	descr string
// 	g     C.GSM_Error
// }

// func (e Error) Error() string {
// 	return fmt.Sprintf(
// 		"[%s] %s", e.descr, C.GoString(C.GSM_ErrorString(C.GSM_Error(e.g))),
// 	)
// }

type EncodeError struct {
	g C.GSM_Error
}

func (e EncodeError) Error() string {
	return fmt.Sprintf(
		"[EncodeMultiPartSMS] %s", C.GoString(C.GSM_ErrorString(C.GSM_Error(e.g))),
	)
}

// StateMachine
type StateMachine struct {
	g       *C.GSM_StateMachine
	smsc    C.GSM_SMSC // SMS Center information
	number  string     // Own phone number
	country string     // Country code
	status  C.GSM_Error

	Timeout time.Duration // Default 15s
}

// Creates new state maschine using cf configuration file or default configuration file `~/.gammurc` if cf == "".
func NewStateMachine(cf string) (*StateMachine, error) {
	// C.setDebug()
	var config *C.INI_Section
	if cf != "" {
		cs := C.CString(cf)
		defer C.free(unsafe.Pointer(cs))
		if e := C.GSM_FindGammuRC(&config, cs); e != C.ERR_NONE {
			return nil, Error{"FindGammuRC", e}
		}
	} else {
		if e := C.GSM_FindGammuRC(&config, nil); e != C.ERR_NONE {
			return nil, Error{"FindGammuRC", e}
		}
	}
	defer C.INI_Free(config)

	C.GSM_InitLocales((*C.char)(C.NULL))

	sm := new(StateMachine)
	sm.g = C.GSM_AllocStateMachine()
	if sm.g == nil {
		log.Fatal("GammuInit", "State Machine initial error: out of memory")
	}

	if e := C.GSM_ReadConfig(config, C.GSM_GetConfig(sm.g, 0), 0); e != C.ERR_NONE {
		sm.free()
		return nil, Error{"ReadConfig", e}
	}
	C.GSM_SetConfigNum(sm.g, 1)
	sm.Timeout = 15 * time.Second

	runtime.SetFinalizer(sm, (*StateMachine).free)
	return sm, nil
}

func (sm *StateMachine) free() {
	if sm.IsConnected() {
		sm.Disconnect()
	}
	C.GSM_FreeStateMachine(sm.g)
	sm.g = nil
}

func (sm *StateMachine) Connect() error {
	if e := C.GSM_InitConnection(sm.g, 1); e != C.ERR_NONE {
		sm.status = e
		return Error{"InitConnection", e}
	}
	C.setStatusCallback(sm.g, &sm.status)
	sm.smsc.Location = 1
	if e := C.GSM_GetSMSC(sm.g, &sm.smsc); e != C.ERR_NONE {
		sm.status = e
		return Error{"GetSMSC", e}
	}
	return nil
}

func (sm *StateMachine) IsConnected() bool {
	return C.GSM_IsConnected(sm.g) != 0
}

func (sm *StateMachine) Disconnect() error {
	if e := C.GSM_TerminateConnection(sm.g); e != C.ERR_NONE {
		sm.status = e
		return Error{"TerminateConnection", e}
	}
	return nil
}

func (sm *StateMachine) GetMemory(mem_type C.GSM_MemoryType, location int) (C.GSM_SubMemoryEntry, error) {
	mem_entry := C.GSM_MemoryEntry{MemoryType: mem_type, Location: (C.int)(location)}
	if e := C.GSM_GetMemory(sm.g, &mem_entry); e != C.ERR_NONE {
		return C.GSM_SubMemoryEntry{}, Error{"GetMemory", e}
	}
	return mem_entry.Entries[0], nil
}

func (sm *StateMachine) GetOwnNumber() string {
	if sm.number != "" {
		return sm.number
	}
	for {
		entry, e := sm.GetMemory(C.MEM_ON, 1)
		if e != nil {
			log.Error("GammuGetMem", e)
			log.Warn("GammuGetMem", "Tring to get memory of SIM card again after 5 seconds......")
			time.Sleep(5 * time.Second)
			continue
		}
		sm.number = sm.country + encodeUTF8(&entry.Text[0])
		break
	}
	return sm.number
}

func (sm *StateMachine) GetCountryCode() string {
	if sm.country != "" {
		return sm.country
	}
	netinfo := C.GSM_NetworkInfo{}
	for {
		if e := C.GSM_GetNetworkInfo(sm.g, &netinfo); e != C.ERR_NONE {
			log.Error("GetCountryCode", e)
			log.Warn("GammuGetCountryCode", "Tring to get country code of phone again after 5 seconds......")
			time.Sleep(5 * time.Second)
			continue
		}
		sm.country = parseCountry(encodeUTF8(&netinfo.NetworkName[0]))
		break
	}
	return sm.country
}

func (sm *StateMachine) Reset() error {
	if e := C.GSM_Reset(sm.g, 0); e != C.ERR_NONE {
		sm.status = e
		return Error{"Reset", e}
	}
	return nil
}

func (sm *StateMachine) HardReset() error {
	if e := C.GSM_Reset(sm.g, 1); e != C.ERR_NONE {
		sm.status = e
		return Error{"Reset", e}
	}
	return nil
}

func decodeUTF8(out *C.uchar, in string) {
	cin := C.CString(in)
	C.DecodeUTF8(out, cin, C.ulong(len(in)))
	C.free(unsafe.Pointer(cin))
}

func encodeUnicode(out *C.uchar, in string) {
	cin := C.CString(in)
	C.EncodeUnicode(out, cin, C.ulong(len(in)))
	C.free(unsafe.Pointer(cin))
}

// func toUnicode(in string) {
// 	textQuoted := strconv.QuoteToASCII(in)
// 	textUnquoted := textQuoted[1 : len(textQuoted)-1]
// 	textUnquoted
// }

// func decodeUnicode(out *C.uchar, in string) {
// 	cn := C.CString(in)
// 	C.DecodeUnicode(cn, out)
// 	C.free(unsafe.Pointer(cn))
// }

func (sm *StateMachine) sendSMS(sms *C.GSM_SMSMessage, number string, report bool) error {
	C.CopyUnicodeString(&sms.SMSC.Number[0], &sm.smsc.Number[0])
	decodeUTF8(&sms.Number[0], number)
	if report {
		sms.PDU = C.SMS_Status_Report
	} else {
		sms.PDU = C.SMS_Submit
	}
	// Send mepssage
	sm.status = C.ERR_TIMEOUT
	if e := C.GSM_SendSMS(sm.g, sms); e != C.ERR_NONE {
		return Error{"SendSMS", e}
	}
	// Wait for reply
	t := time.Now()
	for time.Since(t) < sm.Timeout {
		C.GSM_ReadDevice(sm.g, C.TRUE)
		if sm.status == C.ERR_NONE {
			// Message sent OK
			break
		} else if sm.status != C.ERR_TIMEOUT {
			// Error
			break
		}
	}
	if sm.status != C.ERR_NONE {
		return Error{"ReadDevice", sm.status}
	}
	return nil
}

func (sm *StateMachine) SendSMS(number, text string, report bool) error {
	var sms C.GSM_SMSMessage
	decodeUTF8(&sms.Text[0], text)
	sms.UDH.Type = C.UDH_NoUDH
	sms.Coding = C.SMS_Coding_Default_No_Compression
	sms.Class = 1
	return sm.sendSMS(&sms, number, report)
}

func (sm *StateMachine) SendLongSMS(number, text string, report bool) error {
	// Fill in SMS info
	var smsInfo C.GSM_MultiPartSMSInfo
	C.GSM_ClearMultiPartSMSInfo(&smsInfo)
	smsInfo.Class = 1
	smsInfo.EntriesNum = 1
	smsInfo.UnicodeCoding = C.FALSE
	// Check for non-ASCII rune
	for _, r := range text {
		if r > 0x7F {
			smsInfo.UnicodeCoding = C.TRUE
			break
		}
	}
	smsInfo.Entries[0].ID = C.SMS_ConcatenatedTextLong
	msgUnicode := (*C.uchar)(C.calloc(C.size_t(len(text)+1), 2))
	defer C.free(unsafe.Pointer(msgUnicode))
	decodeUTF8(msgUnicode, text)
	smsInfo.Entries[0].Buffer = msgUnicode
	// Prepare multipart message
	var msms C.GSM_MultiSMSMessage
	if e := C.GSM_EncodeMultiPartSMS(nil, &smsInfo, &msms); e != C.ERR_NONE {
		return EncodeError{e}
	}
	// Send message
	for i := 0; i < int(msms.Number); i++ {
		if e := sm.sendSMS(&msms.SMS[i], number, report); e != nil {
			return e
		}
	}
	return nil
}

func encodeUTF8(in *C.uchar) string {
	l := C.UnicodeLength(in)
	if l == 0 {
		return ""
	}
	out := make([]C.char, C.UnicodeLength(in)*2)
	C.EncodeUTF8(&out[0], in)
	return C.GoString(&out[0])
}

func goTime(t *C.GSM_DateTime) time.Time {
	return time.Date(
		int(t.Year), time.Month(t.Month), int(t.Day),
		int(t.Hour), int(t.Minute), int(t.Second), 0,
		time.UTC,
	).Add(-time.Second * time.Duration(t.Timezone)).Local()
}

type SMS struct {
	Time     time.Time
	SMSCTime time.Time
	Number   string
	Report   bool // True if this message is a delivery report
	Body     string
}

// Read and deletes first avaliable message.
// Returns io.EOF if there is no more messages to read
func (sm *StateMachine) GetSMS() (sms SMS, err error) {
	var msms C.GSM_MultiSMSMessage
	// if e := C.GSM_GetSMS(sm.g, &msms); e != C.ERR_NONE {
	if e := C.GSM_GetNextSMS(sm.g, &msms, C.TRUE); e != C.ERR_NONE {
		if e == C.ERR_EMPTY {
			err = io.EOF
		} else {
			err = Error{"GetNextSMS", e}
		}
		return
	}
	s := msms.SMS[msms.Number-1]
	sms.Number = encodeUTF8(&s.Number[0])
	sms.Time = goTime(&s.DateTime)
	sms.SMSCTime = goTime(&s.SMSCTime)

	for i := 0; i < int(msms.Number); i++ {
		s = msms.SMS[i]
		if s.Coding == C.SMS_Coding_8bit {
			continue
		}
		sms.Body += encodeUTF8(&s.Text[0])
		// sms.Body += encodeUTF8(&s.MessageReference)
		if s.PDU == C.SMS_Status_Report {
			sms.Report = true
		}
		s.Folder = 0 // Flat
		if e := C.GSM_DeleteSMS(sm.g, &s); e != C.ERR_NONE {
			err = Error{"DeleteSMS", e}
			return
		}
	}
	return
}
