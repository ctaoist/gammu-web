package sqlite3

import (
	"database/sql"
	"os"
	"path"

	gerror "github.com/ctaoist/gutils/error"
	log "github.com/ctaoist/gutils/log"
	_ "github.com/logoove/sqlite" // not use cgo
)

type Database struct {
	db *sql.DB
}

type Error = gerror.Error

var __CREATESQL1 = `CREATE TABLE if not exists messages
(id TEXT PRIMARY KEY NOT NULL,
self_number TEXT NOT NULL,
number TEXT NOT NULL,
text TEXT NOT NULL,
sent INT NOT NULL,
time DATETIME NOT NULL);`

var __CREATESQL2 = `CREATE TABLE if not exists abstract
(id TEXT PRIMARY KEY NOT NULL,
self_number TEXT NOT NULL,
number TEXT NOT NULL,
text TEXT NOT NULL,
time DATETIME NOT NULL);`

func (s *Database) Init() {
	if e := s.Exec(__CREATESQL1); e != nil {
		log.Fatal("CreateTable1", e)
	}

	if e := s.Exec(__CREATESQL2); e != nil {
		log.Fatal("CreateTable2", e)
	}
}

func (s *Database) Open() error {
	dbPath := path.Join("data", "sqlite3")
	_ = os.MkdirAll(dbPath, 0755)
	dbPath += "/gammu.db"
	var err error
	s.db, err = sql.Open("sqlite3", dbPath)
	if err != nil {
		return Error{"Sqlite3Open", err}
	}
	_, err = s.db.Exec("PRAGMA foreign_keys = ON;")
	if err != nil {
		return Error{"Sqlite3Exec", err}
	}
	return nil
}

func (s *Database) Query(str string) *sql.Rows {
	if rows, err := s.db.Query(str); err != nil {
		log.Error("Sqlite3Query", err)
		return &sql.Rows{}
	} else {
		return rows
	}
}

func (s *Database) Insert(query string, data []interface{}) {
	stmt, err := s.db.Prepare(query)
	if err != nil {
		log.Error("Sqlite3Prepare", err)
	}

	_, err = stmt.Exec(data...)
	if err != nil {
		log.Error("Sqlite3Insert", err)
	}
}

func (s *Database) Exec(query string) error {
	_, e := s.db.Exec(query)
	return e
}
