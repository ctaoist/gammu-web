package main

import (
	"flag"

	"github.com/ctaoist/gammu-web/config"
	"github.com/ctaoist/gammu-web/db"
	"github.com/ctaoist/gammu-web/smsd"
	"github.com/ctaoist/gammu-web/web"
	log "github.com/sirupsen/logrus"
)

func init() {
	log.SetFormatter(&log.TextFormatter{
		DisableColors:   false,
		ForceColors:     true,
		FullTimestamp:   true,
		TimestampFormat: "2006-01-02 15:04:05",
	})
	log.SetLevel(log.InfoLevel)
}

func main() {
	debug := flag.Bool("debug", false, "Debug mode")
	port := flag.String("port", "21234", "Server listen port")
	flag.BoolVar(&config.TestMode, "test", false, "Test mode, and not start gammu service")
	flag.StringVar(&config.AccessToken, "token", "", "Api access token")
	gammurc := flag.String("gammu-conf", "~/.gammurc", "Gammu config file")
	flag.Parse()

	if *debug {
		log.SetLevel(log.DebugLevel)
	}

	log.Info("Init", "Initializing...")
	db.Init()

	if !config.TestMode {
		smsd.Init(*gammurc)
		defer smsd.Close()
	}

	web.RunServer(*port)
}
