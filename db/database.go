package db

import (
	"fmt"
	"sort"

	"github.com/ctaoist/gammu-web/db/sqlite3"
	"github.com/ctaoist/gammu-web/message"

	gerror "github.com/ctaoist/gutils/error"
	log "github.com/ctaoist/gutils/log"
)

type Error = gerror.Error
type Msg = message.Msg

var (
	size   = 20 // size of per page
	sqlite = &sqlite3.Database{}
)

var __INSERTSQL1 = `id,self_number,number,text,sent,time`
var __INSERTSQL2 = `id,self_number,number,text,time`

func Init() {
	if e := sqlite.Open(); e != nil {
		log.Fatal("Sqlite3Init", e)
	}
	sqlite.Init()
}

func InsertSMS(msg Msg) {
	sqlite.Insert("insert into messages("+__INSERTSQL1+") values(?,?,?,?,?,?)", []interface{}{msg.ID, msg.SelfNumber, msg.Number, msg.Text, msg.Sent, msg.Time})
}

func InsertSMSMany(msgs []Msg) {
	if n := len(msgs); n == 1 {
		InsertSMS(msgs[0])
	} else {
		sqlStr := "insert into messages(" + __INSERTSQL1 + ") values"
		val := []interface{}{}
		for _, msg := range msgs {
			sqlStr += "(?,?,?,?,?,?),"
			val = append(val, msg.ID, msg.SelfNumber, msg.Number, msg.Text, msg.Sent, msg.Time)
		}
		sqlStr = sqlStr[0 : len(sqlStr)-1] // Trimming the last ","
		sqlite.Insert(sqlStr, val)
	}

}

func DeleteSMS(own_number, number string) {
	sqlite.Exec(fmt.Sprintf("delete from messages where self_number = '%s' and number = '%s'", own_number, number))
	sqlite.Exec(fmt.Sprintf("delete from abstract where self_number = '%s' and number = '%s'", own_number, number))
}

func GetFirstCardNumber() (card_number string) {
	card_number = ""
	rows := sqlite.Query("select self_number from messages limit 1")
	defer rows.Close()
	rows.Next()
	rows.Scan(&card_number)
	return
}

func UpdateAbstract(msg Msg) {
	msg.GenerateIdA()
	sqlite.Insert("insert or replace into abstract("+__INSERTSQL2+") values(?,?,?,?,?)", []interface{}{msg.ID, msg.SelfNumber, msg.Number, msg.Text, msg.Time})
}

func GetAbstract(page int, number string) []Msg {
	rows := sqlite.Query(fmt.Sprintf("select * from abstract where self_number = '%s' order by time desc limit %d offset %d;", number, size, page*size))
	defer rows.Close()

	msgs := []Msg{}
	for rows.Next() {
		msg := Msg{}
		err := rows.Scan(&msg.ID, &msg.SelfNumber, &msg.Number, &msg.Text, &msg.Time)
		if err != nil {
			log.Error("GetAbstract", err)
		}
		// msg.Time, _ = time.Parse("2006-01-02 15:04:05", t)
		msgs = append(msgs, msg)
	}

	sort.Slice(msgs, func(i, j int) bool { return msgs[i].Time.After(msgs[j].Time) }) // descending order
	return msgs
}

func GetMessagesByNumber(page int, own_number, number string) []Msg {
	rows := sqlite.Query(fmt.Sprintf("select * from messages where self_number = '%s' and number = '%s' order by time desc limit %d offset %d;", own_number, number, size, page*size))
	defer rows.Close()

	msgs := []Msg{}
	for rows.Next() {
		msg := Msg{}
		err := rows.Scan(&msg.ID, &msg.SelfNumber, &msg.Number, &msg.Text, &msg.Sent, &msg.Time)
		if err != nil {
			log.Error("GetAbstract", err)
		}
		// msg.Time, _ = time.Parse("2006-01-02 15:04:05", t)
		msgs = append(msgs, msg)
	}

	sort.SliceStable(msgs, func(i, j int) bool { return msgs[i].Time.Before(msgs[j].Time) }) // ascending order
	return msgs
}
