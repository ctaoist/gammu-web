package web

import (
	"embed"
	"encoding/json"
	"io"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/ctaoist/gammu-web/message"
	log "github.com/ctaoist/gutils/log"
	"github.com/gorilla/mux"
)

//go:embed dist
var web embed.FS

type spaHandler struct {
	staticPath string
	indexPath  string
}

// ServeHTTP inspects the URL path to locate a file within the static dir
// on the SPA handler. If a file is found, it will be served. If not, the
// file located at the index path on the SPA handler will be served. This
// is suitable behavior for serving an SPA (single page application).
func (h spaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// get the absolute path to prevent directory traversal
	path, err := filepath.Abs(r.URL.Path)
	if err != nil {
		// if we failed to get the absolute path respond with a 400 bad request and stop
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if path == "/" {
		http.FileServer(getFileSystem(web)).ServeHTTP(w, r)
		return
	}

	// prepend the path with the path to the static directory
	// path = filepath.Join(h.staticPath, path)
	// log.Debug("Test", path)
	// check whether a file exists at the given path
	dist := getFileSystem(web)
	_, err = dist.Open(strings.Split(path, "/")[1])
	// _, err = fsys.ReadFile(path)
	if os.IsNotExist(err) {
		// file does not exist, serve index.html
		// http.ServeFile(w, r, filepath.Join(h.staticPath, h.indexPath))
		// index, _ := web.Open(filepath.Join(h.staticPath, h.indexPath))
		// http.ServeContent(w,r, "index.html", time.Unix(0,0), index)
		http.StripPrefix(path, http.FileServer(dist)).ServeHTTP(w, r)
		return
	} else if err != nil {
		// if we got an error (that wasn't that the file doesn't exist) stating the file, return a 500 internal server error and stop
		log.Error("SPA Handler", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// otherwise, use http.FileServer to serve the static dir
	http.FileServer(dist).ServeHTTP(w, r)
}

func parseBody(body io.ReadCloser, v interface{}) {
	defer body.Close()
	decoder := json.NewDecoder(body)
	decoder.Decode(&v)
}

func RunServer(port string) {
	r := mux.NewRouter()
	r.Use(logging)
	r.Use(auth)
	r.HandleFunc("/ws", wsHandler)

	api := r.PathPrefix("/api").Subrouter()
	api.Use(parse_body)
	api.HandleFunc("/verify_token", verifyToken)
	api.HandleFunc("/get_phone_info", getPhoneInfo)
	api.HandleFunc("/send_sms", sendSMS)
	api.HandleFunc("/delete_sms", deleteSMS)
	api.HandleFunc("/get_abstract", getAbstract)
	api.HandleFunc("/get_messages", getMessages)

	// https://github.com/gorilla/mux/issues/464
	// https://github.com/gorilla/mux/pull/493
	// r.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(getFileSystem(web))))
	spa := spaHandler{staticPath: "dist", indexPath: "index.html"}
	r.PathPrefix("/").Handler(spa)
	log.Info("RunServer", "Start listening 0.0.0.0:"+port)

	go message.HeartBeatLoop()
	http.ListenAndServe("0.0.0.0:"+port, r)
}

func getFileSystem(web embed.FS) http.FileSystem {
	fsys, err := fs.Sub(web, "dist")
	if err != nil {
		log.Fatal("WebGetFS", err)
	}
	return http.FS(fsys)
}
