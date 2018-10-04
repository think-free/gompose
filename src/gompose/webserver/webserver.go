package webserver

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	docker "github.com/fsouza/go-dockerclient"

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
func New(db *storm.DB, path string, gitIntegration bool, dev bool) *WebServer {

	s := &WebServer{
		db:             db,
		gitIntegration: gitIntegration,
		path:           path,
	}

	// Server the web app and the files in the docker compose tree
	if dev {
		http.Handle("/", http.StripPrefix("/", http.FileServer(http.Dir("./src/gompose/gui/out/"))))

	} else {
		box := rice.MustFindBox("../gui/out/")
		http.Handle("/", http.FileServer(box.HTTPBox()))
	}
	http.Handle("/files/", http.StripPrefix("/files", http.FileServer(http.Dir(s.path))))

	// Api requests
	http.HandleFunc("/dashboard", s.Dashboard)
	http.HandleFunc("/dashboard/add", s.DashboardAdd)
	http.HandleFunc("/dashboard/del", s.DashboardDel)

	http.HandleFunc("/projects", s.Projects)
	http.HandleFunc("/project/get", s.ProjectGet)
	http.HandleFunc("/project/update", s.ProjectUpdate)
	http.HandleFunc("/project/pull", s.ProjectPull)
	http.HandleFunc("/project/start", s.ProjectStart)
	http.HandleFunc("/project/stop/", s.ProjectStop)
	http.HandleFunc("/project/container/start", s.ProjectContainerStart)
	http.HandleFunc("/project/container/stop", s.ProjectContainerStop)
	http.HandleFunc("/project/container/delete", s.ProjectContainerDelete)

	http.HandleFunc("/logs", s.Logs)

	http.HandleFunc("/containers", s.ContainersGet)
	http.HandleFunc("/containers/delete", s.ContainersDelete)

	http.HandleFunc("/images", s.ImagesGet)
	http.HandleFunc("/images/removeintermediate", s.ImagesRemoveIntermediate)
	http.HandleFunc("/images/upload", s.ImagesUpload)
	http.HandleFunc("/images/delete", s.ImagesDelete)

	http.HandleFunc("/volumes", s.VolumesGet)

	return s
}

// Run start the web server
func (s *WebServer) Run() {

	http.ListenAndServe(":8123", nil)
}

/* Handlers */

// Dashboard

// Return all the dashboard configured
// Params : none
func (s *WebServer) Dashboard(w http.ResponseWriter, r *http.Request) {

	var dash []Dashboard
	s.db.All(&dash)
	js, _ := json.Marshal(dash)
	w.Write(js)
}

// Add a dashboard (POST request)
// Params : body is the json formated dashboard
func (s *WebServer) DashboardAdd(w http.ResponseWriter, r *http.Request) {

	var dash Dashboard
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&dash)

	if err != nil {
		log.Println(err)
		w.Write([]byte("{\"type\" : \"error\", \"msg\":" + err.Error() + "}"))
	} else {

		dash.Internal = dash.Parent + dash.Project + dash.Port
		err := s.db.Save(&dash)
		if err != nil {
			log.Println(err)
			w.Write([]byte("{\"type\" : \"error\", \"msg\":" + err.Error() + "}"))
		} else {

			js, _ := json.Marshal(dash)
			log.Println(js)

			js = append([]byte("{\"type\" : \"json\", \"msg\":"), js...)
			js = append(js, []byte("}")...)
			w.Write(js)
		}
	}
}

func (s *WebServer) DashboardDel(w http.ResponseWriter, r *http.Request) {

	idstring, ok := r.URL.Query()["id"]

	if !ok {
		log.Println("Missing url parameter")
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("{\"type\" : \"error\", \"msg\": \"Missing url parameter 'id'\"}"))
		return
	}

	id, err := strconv.Atoi(strings.Join(idstring, " "))
	if err != nil {
		log.Println("Bad format for url parameter")
		w.WriteHeader(http.StatusNotAcceptable)
		w.Write([]byte("{\"type\" : \"error\", \"msg\": \"Bad format for url parameter 'id'\"}"))
		return
	}

	var dash Dashboard
	err = s.db.One("ID", id, &dash)
	if err != nil {
		log.Println("Can't find dashboard for deletion")
		w.WriteHeader(http.StatusNoContent)
		w.Write([]byte("{\"type\" : \"error\", \"msg\": \"Can't find dashboard for deletion\"}"))
		return
	}

	err = s.db.DeleteStruct(&dash)
	if err != nil {
		log.Println("Error deleting dashboard")
		w.WriteHeader(http.StatusUnprocessableEntity)
		w.Write([]byte("{\"type\" : \"error\", \"msg\": \"Error deleting dashboard\"}"))
		return
	}

	w.Write([]byte("{\"type\" : \"log\", \"msg\": \"Dashboard deleted\"}"))
}

// Projects

// Return all the projects
// Params : parent, leave empty to load projects from root projects directory
func (s *WebServer) Projects(w http.ResponseWriter, r *http.Request) {

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

// Return the project detail
// Params :
// - parent
// - name
func (s *WebServer) ProjectGet(w http.ResponseWriter, r *http.Request) {

	parent, name, err := s.getParentAndNameFromRequest(r)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
	}

	js, _ := json.Marshal(s.getProject(s.db, parent, name))
	w.Write(js)
}

// Run git pull for the specified project
// Params :
// - parent
// - name
func (s *WebServer) ProjectUpdate(w http.ResponseWriter, r *http.Request) {

	parent, name, err := s.getParentAndNameFromRequest(r)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		log.Println(err)
		w.Write([]byte("{\"type\" : \"error\", \"msg\":" + err.Error() + "}"))
		return
	}

	projectPath := s.getProjectPath(parent, name)

	out := s.run(projectPath, "git", "pull")

	w.Write([]byte("{\"type\" : \"log\", \"msg\":\"" + out + "\"}"))
}

// Run docker-compose pull and docker-compose up for the specified project
// Params :
// - parent
// - name
func (s *WebServer) ProjectPull(w http.ResponseWriter, r *http.Request) {

	parent, name, err := s.getParentAndNameFromRequest(r)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		log.Println(err)
		w.Write([]byte("{\"type\" : \"error\", \"msg\":" + err.Error() + "}"))
		return
	}

	projectPath := s.getProjectPath(parent, name)

	out := s.run(projectPath, "docker-compose", "pull")
	out = out + "\n" + s.run(projectPath, "docker-compose", "up")

	w.Write([]byte("{\"type\" : \"log\", \"msg\":\"" + out + "\"}"))
}

// Run docker-compose up for the specified project
// Params :
// - parent
// - name
func (s *WebServer) ProjectStart(w http.ResponseWriter, r *http.Request) {

	parent, name, err := s.getParentAndNameFromRequest(r)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		log.Println(err)
		w.Write([]byte("{\"type\" : \"error\", \"msg\":" + err.Error() + "}"))
		return
	}

	projectPath := s.getProjectPath(parent, name)

	out := s.run(projectPath, "docker-compose", "up")

	w.Write([]byte("{\"type\" : \"log\", \"msg\":\"" + out + "\"}"))
}

// Run docker-compose stop for the specified project
// Params : none
func (s *WebServer) ProjectStop(w http.ResponseWriter, r *http.Request) {

	parent, name, err := s.getParentAndNameFromRequest(r)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		log.Println(err)
		w.Write([]byte("{\"type\" : \"error\", \"msg\":" + err.Error() + "}"))
		return
	}

	projectPath := s.getProjectPath(parent, name)

	out := s.run(projectPath, "docker-compose", "stop")

	w.Write([]byte("{\"type\" : \"log\", \"msg\":\"" + out + "\"}"))
}

// Run docker-compose up for the specified container in the specified project
// Params :
// - parent
// - name
// - container
func (s *WebServer) ProjectContainerStart(w http.ResponseWriter, r *http.Request) {

	parent, name, err := s.getParentAndNameFromRequest(r)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		log.Println(err)
		w.Write([]byte("{\"type\" : \"error\", \"msg\":" + err.Error() + "}"))
		return
	}

	projectPath := s.getProjectPath(parent, name)

	containerar, ok := r.URL.Query()["container"]
	if !ok {
		w.WriteHeader(http.StatusBadRequest)
		log.Println("Missing url parameter")
		w.Write([]byte("{\"type\" : \"error\", \"msg\":\"Missing url parameter 'container'\"}"))
		return
	}
	container := strings.Join(containerar, " ")

	out := s.run(projectPath, "docker-compose", "up", container)

	w.Write([]byte("{\"type\" : \"log\", \"msg\":\"" + out + "\"}"))
}

// Run docker-compose stop for the specified container in the specified project
// Params :
// - parent
// - name
// - container
func (s *WebServer) ProjectContainerStop(w http.ResponseWriter, r *http.Request) {

	parent, name, err := s.getParentAndNameFromRequest(r)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		log.Println(err)
		w.Write([]byte("{\"type\" : \"error\", \"msg\":" + err.Error() + "}"))
		return
	}

	projectPath := s.getProjectPath(parent, name)

	containerar, ok := r.URL.Query()["container"]
	if !ok {
		w.WriteHeader(http.StatusBadRequest)
		log.Println("Missing url parameter")
		w.Write([]byte("{\"type\" : \"error\", \"msg\":\"Missing url parameter 'container'\"}"))
		return
	}
	container := strings.Join(containerar, " ")

	out := s.run(projectPath, "docker-compose", "stop", container)

	w.Write([]byte("{\"type\" : \"log\", \"msg\":\"" + out + "\"}"))
}

// Run docker-compose stop and docker-compose rm for the specified container in the specified project
// Params :
// - parent
// - name
// - container
func (s *WebServer) ProjectContainerDelete(w http.ResponseWriter, r *http.Request) {

	parent, name, err := s.getParentAndNameFromRequest(r)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		log.Println(err)
		w.Write([]byte("{\"type\" : \"error\", \"msg\":" + err.Error() + "}"))
	}

	projectPath := s.getProjectPath(parent, name)

	containerar, ok := r.URL.Query()["container"]
	if !ok {
		w.WriteHeader(http.StatusBadRequest)
		log.Println("Missing url parameter")
		w.Write([]byte("{\"type\" : \"error\", \"msg\":\"Missing url parameter 'container'\"}"))
		return
	}
	container := strings.Join(containerar, " ")

	out := s.run(projectPath, "docker-compose", "stop", container)
	out = out + "\n" + s.run(projectPath, "docker-compose", "rm", container)

	w.Write([]byte("{\"type\" : \"log\", \"msg\":\"" + out + "\"}"))
}

// Logs

// Run docker-compose logs for the specified container in the specified project
// Params :
// - parent
// - name
// - container if container == "none" return logs for the entire project
func (s *WebServer) Logs(w http.ResponseWriter, r *http.Request) {

	parent, name, err := s.getParentAndNameFromRequest(r)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
	}

	projectPath := s.getProjectPath(parent, name)

	containerar, ok := r.URL.Query()["container"]
	if !ok {
		w.WriteHeader(http.StatusBadRequest)
	}
	container := strings.Join(containerar, " ")

	var out string

	if container != "none" {
		out = s.run(projectPath, "docker-compose", "logs", "--no-color", "--tail", "1000", container)
	} else {
		out = s.run(projectPath, "docker-compose", "logs", "--no-color", "--tail", "1000")
	}

	w.Write([]byte(out))
}

// Containers

// List all docker containers
// Params : none
func (s *WebServer) ContainersGet(w http.ResponseWriter, r *http.Request) {

	endpoint := "unix:///var/run/docker.sock"
	client, err := docker.NewClient(endpoint)
	if err != nil {
		panic(err)
	}

	imgs, err := client.ListContainers(docker.ListContainersOptions{All: true})
	if err != nil {
		log.Println(err)
	}

	js, _ := json.Marshal(&imgs)
	w.Write(js)
}

// Delete the container with the specified id
// Params :
// - id
func (s *WebServer) ContainersDelete(w http.ResponseWriter, r *http.Request) {

	idstring, ok := r.URL.Query()["id"]
	id := strings.Join(idstring, " ")

	if !ok {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	endpoint := "unix:///var/run/docker.sock"
	client, err := docker.NewClient(endpoint)
	if err != nil {
		panic(err)
	}

	client.StopContainer(id, 30000)

	err = client.RemoveContainer(docker.RemoveContainerOptions{
		ID: id,
	})

	if err != nil {
		log.Println(err)
		w.Write([]byte("{\"type\" : \"error\", \"msg\":" + err.Error() + "}"))
	} else {

		w.Write([]byte("{\"type\" : \"log\", \"msg\": \"Container deleted\"}"))
	}
}

// Images

// List all docker images
// Params : none
func (s *WebServer) ImagesGet(w http.ResponseWriter, r *http.Request) {

	endpoint := "unix:///var/run/docker.sock"
	client, err := docker.NewClient(endpoint)
	if err != nil {
		panic(err)
	}

	imgs, err := client.ListImages(docker.ListImagesOptions{All: true})
	if err != nil {
		log.Println(err)
	}

	js, _ := json.Marshal(&imgs)
	w.Write(js)
}

// Remove all untagged images that are not in use
// Params : none
func (s *WebServer) ImagesRemoveIntermediate(w http.ResponseWriter, r *http.Request) {

	list := s.run("/", "docker", "images", "-a")
	listArr := strings.Split(list, "\n")

	ret := ""

	for _, line := range listArr {

		if strings.Contains(line, "none") {

			image := strings.Fields(line)[2]
			s.run("/", "docker", "rmi", image)
			ret = ret + image + "\n"
		}
	}
	w.Write([]byte("{\"type\" : \"log\", \"msg\": \"" + ret + "\"}"))
}

// Upload and docker load a compressed image
// Params :
// - file (POST request multipart/form)
func (s *WebServer) ImagesUpload(w http.ResponseWriter, r *http.Request) {

	if r.Method != http.MethodPost {
		w.Write([]byte("{\"type\" : \"error\", \"msg\": \"Bad methods\"}"))
		return
	}

	file, handle, err := r.FormFile("file")
	if err != nil {
		log.Println(err)
		w.Write([]byte("{\"type\" : \"error\", \"msg\":" + err.Error() + "}"))
		return
	}
	defer file.Close()

	data, err := ioutil.ReadAll(file)
	if err != nil {
		log.Println(err)
		w.Write([]byte("{\"type\" : \"error\", \"msg\":" + err.Error() + "}"))
		return
	}

	fileName := strings.TrimPrefix(handle.Filename, "'")
	fileName = strings.TrimSuffix(fileName, "'")

	err = ioutil.WriteFile("/tmp/"+fileName, data, 0666)
	if err != nil {
		log.Println(err)
		w.Write([]byte("{\"type\" : \"error\", \"msg\":" + err.Error() + "}"))
		return
	}

	out := s.run("/tmp/", "docker", "load", "--input", fileName)
	os.Remove("/tmp/" + fileName)

	w.Write([]byte("{\"type\" : \"log\", \"msg\":\"" + out + "\"}"))
}

// Delete the specified image if not in use
// Params :
// - id
func (s *WebServer) ImagesDelete(w http.ResponseWriter, r *http.Request) {

	idstring, ok := r.URL.Query()["id"]
	id := strings.Join(idstring, " ")

	if !ok {
		log.Println("Missing url parameter")
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("{\"type\" : \"error\", \"msg\": \"Missing url parameter 'id'\"}"))
		return
	}

	endpoint := "unix:///var/run/docker.sock"
	client, err := docker.NewClient(endpoint)
	if err != nil {
		panic(err)
	}

	err = client.RemoveImage(id)

	if err != nil {
		log.Println(err)
		w.Write([]byte("{\"type\" : \"error\", \"msg\":" + err.Error() + "}"))
	} else {

		w.Write([]byte("{\"type\" : \"log\", \"msg\": \"Image deleted\"}"))
	}
}

// Volumes

// List all docker volumes
// Params : none
func (s *WebServer) VolumesGet(w http.ResponseWriter, r *http.Request) {

	endpoint := "unix:///var/run/docker.sock"
	client, err := docker.NewClient(endpoint)
	if err != nil {
		panic(err)
	}

	volumes, err := client.ListVolumes(docker.ListVolumesOptions{})
	if err != nil {
		log.Println(err)
	}

	js, _ := json.Marshal(&volumes)
	w.Write(js)
}
