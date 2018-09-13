package webserver

import (
	"encoding/json"
	"net/http"
	"os"
	"strconv"
	"strings"

	rice "github.com/GeertJohan/go.rice"
	"github.com/asdine/storm"
)

// WebServer create the main web server that handle the gui requests
type WebServer struct {
	path           string
	gitIntegration bool
	db             *storm.DB
}

// New create the webserver
func New(db *storm.DB, path string, gitIntegration bool) *WebServer {

	s := &WebServer{
		db:             db,
		gitIntegration: gitIntegration,
		path:           path,
	}

	// Server the web app and the files in the docker compose tree
	box := rice.MustFindBox("../gui/out/")
	http.Handle("/", http.FileServer(box.HTTPBox()))
	http.Handle("/files/", http.StripPrefix("/files", http.FileServer(http.Dir(s.path))))

	// Api requests
	http.HandleFunc("/dashboard", s.dashboard)
	http.HandleFunc("/dashboard/add", s.dashboardAdd)
	http.HandleFunc("/dashboard/del", s.dashboardDel)

	http.HandleFunc("/projects", s.projects)

	http.HandleFunc("/project/get", s.projectGet)
	http.HandleFunc("/project/update", s.projectUpdate)
	http.HandleFunc("/project/start", s.projectStart)
	http.HandleFunc("/project/stop/", s.projectStop)
	http.HandleFunc("/project/container/start", s.projectContainerStart)
	http.HandleFunc("/project/container/stop", s.projectContainerStop)

	return s
}

// Run start the web server
func (s *WebServer) Run() {

	http.ListenAndServe(":8123", nil)
}

/* Handlers */

func (s *WebServer) dashboard(w http.ResponseWriter, r *http.Request) {

	var dash []Dashboard
	s.db.All(&dash)
	js, _ := json.Marshal(dash)
	w.Write(js)
}

func (s *WebServer) dashboardAdd(w http.ResponseWriter, r *http.Request) {

	var dash Dashboard
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&dash)

	if err != nil {

		w.Write([]byte("{\"msg\":" + err.Error() + "}"))
	} else {

		dash.Internal = dash.Parent + dash.Project + dash.Port
		err := s.db.Save(&dash)
		if err != nil {

			w.Write([]byte("{\"msg\":" + err.Error() + "}"))
		} else {

			js, _ := json.Marshal(dash)
			w.Write(js)
		}
	}
}

func (s *WebServer) dashboardDel(w http.ResponseWriter, r *http.Request) {

	idstring, ok := r.URL.Query()["id"]

	if !ok {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(strings.Join(idstring, " "))
	if err != nil {
		w.WriteHeader(http.StatusNotAcceptable)
		return
	}

	var dash Dashboard
	err = s.db.One("ID", id, &dash)
	if err != nil {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	err = s.db.DeleteStruct(&dash)
	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	w.Write([]byte("OK"))
}

func (s *WebServer) projects(w http.ResponseWriter, r *http.Request) {

	parentar, _ := r.URL.Query()["parent"]
	parent := "/" + strings.Join(parentar, " ")

	path := s.path + parent

	hasGit := false
	if s.gitIntegration {
		git := path + "/.git/config"
		if _, err := os.Stat(git); err == nil {
			hasGit = true
		}
	}

	js, _ := json.Marshal(&ProjectsAnswer{Projects: s.getProjects(path), AllowCreate: s.gitIntegration && !hasGit, IsGit: hasGit})
	w.Write(js)
}

func (s *WebServer) projectGet(w http.ResponseWriter, r *http.Request) {

	parent, name, err := s.getParentAndNameFromRequest(r)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
	}

	js, _ := json.Marshal(s.getProject(s.db, parent, name))
	w.Write(js)
}

func (s *WebServer) projectUpdate(w http.ResponseWriter, r *http.Request) {

	parent, name, err := s.getParentAndNameFromRequest(r)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
	}

	projectPath := s.getProjectPath(parent, name)

	out := s.run(projectPath, "git", "pull")

	w.Write([]byte(out))
}

func (s *WebServer) projectStart(w http.ResponseWriter, r *http.Request) {

	parent, name, err := s.getParentAndNameFromRequest(r)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
	}

	projectPath := s.getProjectPath(parent, name)

	out := s.run(projectPath, "docker-compose", "up")

	w.Write([]byte(out))
}

func (s *WebServer) projectStop(w http.ResponseWriter, r *http.Request) {

	parent, name, err := s.getParentAndNameFromRequest(r)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
	}

	projectPath := s.getProjectPath(parent, name)

	out := s.run(projectPath, "docker-compose", "stop")

	w.Write([]byte(out))
}

func (s *WebServer) projectContainerStart(w http.ResponseWriter, r *http.Request) {

	parent, name, err := s.getParentAndNameFromRequest(r)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
	}

	projectPath := s.getProjectPath(parent, name)

	containerar, ok := r.URL.Query()["container"]
	if !ok {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	container := strings.Join(containerar, " ")

	out := s.run(projectPath, "docker-compose", "up", container)

	w.Write([]byte(out))
}

func (s *WebServer) projectContainerStop(w http.ResponseWriter, r *http.Request) {

	parent, name, err := s.getParentAndNameFromRequest(r)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
	}

	projectPath := s.getProjectPath(parent, name)

	containerar, ok := r.URL.Query()["container"]
	if !ok {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	container := strings.Join(containerar, " ")

	out := s.run(projectPath, "docker-compose", "stop", container)

	w.Write([]byte(out))
}