package web

import (
	"context"
	"net/http"
	"strings"

	log "github.com/ctaoist/gutils/log"

	"github.com/ctaoist/gammu-web/config"
)

type ResponseWriter struct {
	http.ResponseWriter
}

func logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Debug("RequestURI", r.RequestURI)
		// Call the next handler, which can be another middleware in the chain, or the final handler.
		next.ServeHTTP(w, r)
	})
}

func auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		p := r.RequestURI
		if p == "/" || p == "/favicon.ico" || p == "/sms" || p == "/sms_chat" || p == "/setting" || strings.Split(p, "/")[1] == "assets" {
			next.ServeHTTP(w, r)
			return
		}
		r.ParseForm()
		if len(config.AccessToken) > 0 {
			token := r.FormValue("token")
			if token != config.AccessToken {
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}

func parse_body(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		params := map[string]string{}
		parseBody(r.Body, &params)
		r.ParseForm()
		for k, v := range r.Form {
			params[k] = strings.Join(v, "")
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(context.Background(), "Params", params)))
	})
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Methods", strings.Join([]string{"GET", "POST", "OPTIONS"}, ","))
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Origin", r.Header["Origin"][0])
		next.ServeHTTP(w, r)
	})
}
