package main

import (
  "log"
  "net/http"

  "github.com/gorilla/mux"
)

// MyServer struct for mux router
type MyServer struct {
  r *mux.Router
}

func main() {

  htmlRouter := mux.NewRouter().StrictSlash(true)
  htmlRouter.PathPrefix("/static").Handler(http.StripPrefix("/static", http.FileServer(http.Dir("./html/static"))))
  htmlRouter.HandleFunc("/diagram/data-type", func(w http.ResponseWriter, r *http.Request) {
    http.ServeFile(w, r, "./html/dtd.html")
  })
  htmlRouter.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
    http.ServeFile(w, r, "./html/index.html")
  })
  htmlRouter.HandleFunc("/{resource}", func(w http.ResponseWriter, r *http.Request) {
    http.ServeFile(w, r, "./html/index.html")
  })
  http.Handle("/", &MyServer{htmlRouter})

  err := http.ListenAndServe(":9900", nil)
  // http 2.0 http.ListenAndServeTLS(":443", "server.crt", "server.key", nil)
  if err != nil {
    log.Fatal(err)
  }
}

func (s *MyServer) ServeHTTP(rw http.ResponseWriter, req *http.Request) {
  rw.Header().Set("Access-Control-Allow-Origin", "*")
  rw.Header().Set("Access-Control-Allow-Methods", "POST, GET")
  rw.Header().Set("Access-Control-Allow-Headers",
    "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

  // Let the Gorilla work
  s.r.ServeHTTP(rw, req)
}

func addDefaultHeaders(fn http.HandlerFunc) http.HandlerFunc {
  return func(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Access-Control-Allow-Origin", "*")
    fn(w, r)
  }
}
