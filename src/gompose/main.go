package main

import (
	"encoding/json"
	"errors"
	"flag"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"regexp"
	"strconv"
	"strings"

	rice "github.com/GeertJohan/go.rice"
	"github.com/asdine/storm"
)

type Dashboard struct {
	ID            int    `storm:"id,increment"`
	Internal      string `storm:"index"`
	Project       string `json:"project"`
	Parent        string `json:"parent"`
	ImageOverride string `json:"imageOverrideUrl"`
	Name          string `json:"name"`
	BaseUrl       string `json:"baseUrl"`
	Port          string `json:"port"`
	Path          string `json:"path"`
}

type Projects struct {
	Name   string `json:"name"`
	Logo   string `json:"logo"`
	Parent bool   `json:"parent"`
	State  string `json:"state"`
}

type ProjectsAnswer struct {
	AllowCreate bool       `json:"allowcreate"`
	IsGit       bool       `json:"isgit"`
	Projects    []Projects `json:"projects"`
}

type Project struct {
	Project    string      `json:"project"`
	Status     string      `json:"status"`
	HasGit     bool        `json:"git"`
	Ports      []Port      `json:"ports"`
	Containers []Container `json:"containers"`
}

type Port struct {
	Port        string `json:"port"`
	Map         string `json:"map"`
	Exposed     bool   `json:"exposed"`
	ExposeId    int    `json:"exposeId"`
	UrlPath     string `json:"urlPath"`
	Description string `json:"description"`
}

type Container struct {
	Compose string   `json:"compose"`
	Status  string   `json:"status"`
	Name    string   `json:"name"`
	Image   string   `json:"image"`
	Volumes []string `json:"volumes"`
	Ports   []string `json:"ports"`
}

var PT = "/media/docker"
var GITINTEGRATION = true

func main() {

	flag.BoolVar(&GITINTEGRATION, "git", false, "Use this flag to activate git integration")
	flag.StringVar(&PT, "path", "/media/docker", "Path to your compose tree")
	flag.Parse()

	log.Println("Starting gompose - Path :", PT, " - Git :", GITINTEGRATION)

	/* Database */
	db, err := storm.Open("/etc/gompose/dashboard.db")
	if err != nil {
		os.Exit(1)
	}

	setupRouter(db)

	/* Webserver */
	http.ListenAndServe(":8123", nil)
}

func setupRouter(db *storm.DB) {

	/* SERVE WEB APP */
	/* *************************************** */
	box := rice.MustFindBox("./gui/out/")
	http.Handle("/", http.FileServer(box.HTTPBox()))
	http.Handle("/files/", http.StripPrefix("/files", http.FileServer(http.Dir(PT))))

	/* API */
	/* *************************************** */

	/* DASHBOARDS */
	http.HandleFunc("/dashboard", func(w http.ResponseWriter, r *http.Request) {

		var dash []Dashboard
		db.All(&dash)
		js, _ := json.Marshal(dash)
		w.Write(js)
	})

	http.HandleFunc("/dashboard/add", func(w http.ResponseWriter, r *http.Request) {

		var dash Dashboard
		decoder := json.NewDecoder(r.Body)
		err := decoder.Decode(&dash)

		if err != nil {

			w.Write([]byte("{\"msg\":" + err.Error() + "}"))
		} else {

			dash.Internal = dash.Parent + dash.Project + dash.Port
			err := db.Save(&dash)
			if err != nil {

				w.Write([]byte("{\"msg\":" + err.Error() + "}"))
			} else {

				js, _ := json.Marshal(dash)
				w.Write(js)
			}
		}
	})

	http.HandleFunc("/dashboard/del", func(w http.ResponseWriter, r *http.Request) {

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
		err = db.One("ID", id, &dash)
		if err != nil {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		err = db.DeleteStruct(&dash)
		if err != nil {
			w.WriteHeader(http.StatusUnprocessableEntity)
			return
		}

		w.Write([]byte("OK"))
	})

	/* PROJECTS */

	http.HandleFunc("/projects", func(w http.ResponseWriter, r *http.Request) {

		parentar, _ := r.URL.Query()["parent"]
		parent := "/" + strings.Join(parentar, " ")

		path := PT + parent

		hasGit := false
		if GITINTEGRATION {
			git := path + "/.git/config"
			if _, err := os.Stat(git); err == nil {
				hasGit = true
			}
		}

		js, _ := json.Marshal(&ProjectsAnswer{Projects: getProjects(path), AllowCreate: GITINTEGRATION && !hasGit, IsGit: hasGit})
		w.Write(js)
	})

	http.HandleFunc("/project/get", func(w http.ResponseWriter, r *http.Request) {

		parent, name, err := getParentAndNameFromRequest(r)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
		}

		js, _ := json.Marshal(getProject(db, parent, name))
		w.Write(js)
	})

	http.HandleFunc("/project/update", func(w http.ResponseWriter, r *http.Request) {

		parent, name, err := getParentAndNameFromRequest(r)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
		}

		projectPath := getProjectPath(parent, name)

		out := Run(projectPath, "git", "pull")

		w.Write([]byte(out))
	})

	http.HandleFunc("/project/start", func(w http.ResponseWriter, r *http.Request) {

		parent, name, err := getParentAndNameFromRequest(r)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
		}

		projectPath := getProjectPath(parent, name)

		out := Run(projectPath, "docker-compose", "start")

		w.Write([]byte(out))
	})

	http.HandleFunc("/project/stop/", func(w http.ResponseWriter, r *http.Request) {

		parent, name, err := getParentAndNameFromRequest(r)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
		}

		projectPath := getProjectPath(parent, name)

		out := Run(projectPath, "docker-compose", "stop")

		w.Write([]byte(out))
	})

	http.HandleFunc("/project/container/start", func(w http.ResponseWriter, r *http.Request) {

		parent, name, err := getParentAndNameFromRequest(r)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
		}

		projectPath := getProjectPath(parent, name)

		containerar, ok := r.URL.Query()["container"]
		if !ok {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		container := strings.Join(containerar, " ")

		out := Run(projectPath, "docker-compose", "start", container)

		w.Write([]byte(out))
	})

	http.HandleFunc("/project/container/stop", func(w http.ResponseWriter, r *http.Request) {

		parent, name, err := getParentAndNameFromRequest(r)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
		}

		projectPath := getProjectPath(parent, name)

		containerar, ok := r.URL.Query()["container"]
		if !ok {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		container := strings.Join(containerar, " ")

		out := Run(projectPath, "docker-compose", "stop", container)

		w.Write([]byte(out))
	})
}

func getParentAndNameFromRequest(r *http.Request) (string, string, error) {

	parentar, ok := r.URL.Query()["parent"]
	if !ok {
		return "", "", errors.New("Parent missing")
	}

	namear, ok := r.URL.Query()["name"]
	if !ok {
		return "", "", errors.New("Name missing")
	}

	parent := strings.Join(parentar, " ")
	name := strings.Join(namear, " ")

	return parent, name, nil
}

func getProjectPath(parent, name string) string {

	projectPath := PT
	if parent != "none" {
		projectPath = projectPath + "/" + parent
	}
	if name != "none" {
		projectPath = projectPath + "/" + name
	}

	return projectPath
}

func getProjects(path string) []Projects {

	files, err := ioutil.ReadDir(path)
	if err != nil {
		log.Fatal(err)
	}

	var projects []Projects
	for _, f := range files {

		if f.IsDir() && f.Name() != ".git" {

			state := "folder"
			parent := true
			if _, err := os.Stat(path + "/" + f.Name() + "/" + "docker-compose.yml"); err == nil {
				parent = false
			}

			if !parent { // Check here the state of the project
				state = ""
			}

			projects = append(projects, Projects{Name: f.Name(), Logo: "/files" + strings.TrimPrefix(path, PT) + "/" + f.Name() + "/.logo.png", Parent: parent, State: state})
		}
	}

	return projects
}

func getProject(db *storm.DB, parent, project string) Project {

	projectPath := PT
	if parent != "none" {
		projectPath = projectPath + "/" + parent
	}
	projectPath = projectPath + "/" + project
	file := projectPath + "/docker-compose.yml"

	raw, err := ioutil.ReadFile(file)
	if err != nil {
		log.Println(err)
		return Project{}
	}

	// Getting status
	out := Run(projectPath, "docker-compose", "ps")
	containerStatus := strings.Split(out, "\n")

	// Parse docker-compose.yml
	lines := strings.Split(string(raw), "\n")

	var spacing string
	var doubleSpacing string
	var tripleSpacing string

	// Detecting yml spacing used in this file
	for _, line := range lines {
		if strings.HasPrefix(line, " ") {
			lineNoSpace := strings.TrimSpace(line)
			spacing = strings.TrimSuffix(line, lineNoSpace)
			var str strings.Builder
			str.WriteString(spacing)
			str.WriteString(spacing)
			doubleSpacing = str.String()
			str.WriteString(spacing)
			tripleSpacing = str.String()
			break
		}
	}

	// Getting content
	var currentContainer Container
	var currentInfo string
	var containerPorts []string
	var containerVolumes []string
	var ports []Port
	var containers []Container
	reg := regexp.MustCompile(`\[.*?\]`)

	for _, line := range lines {

		kv := strings.Split(line, ":")
		key := strings.TrimSpace(kv[0])

		if strings.HasPrefix(line, tripleSpacing) {

			v := strings.TrimPrefix(strings.TrimSpace(line), "-")

			//log.Println("Info data      : " + v)

			if currentInfo == "ports" {

				// Add to container port
				p := strings.Split(v, "#")
				pp := strings.Replace(p[0], "\"", "", -1)
				containerPorts = append(containerPorts, pp)

				// Add to global port publish array
				pub := strings.Split(pp, ":")
				port := strings.TrimSpace(pub[2])
				var comment []string
				if strings.Contains(line, "@gompose") {

					comment = reg.FindAllString(line, -1)
				}
				var desc string
				var pt string
				exposeId := -1
				exposed := false
				if len(comment) > 2 {
					desc = strings.TrimSuffix(strings.TrimPrefix(comment[1], "["), "]")
					pt = strings.TrimSuffix(strings.TrimPrefix(comment[2], "["), "]")
				}

				var dash Dashboard
				err := db.One("Internal", parent+project+pub[1], &dash)
				if err == nil {
					exposeId = dash.ID
					exposed = true
				}

				ports = append(ports, Port{Exposed: exposed, ExposeId: exposeId, Description: desc, UrlPath: pt, Port: port, Map: pub[0] + ":" + pub[1]})

			} else if currentInfo == "volumes" {

				containerVolumes = append(containerVolumes, v)
			}

		} else if strings.HasPrefix(line, doubleSpacing) {

			//log.Println("Container info : " + key + " -> " + kv[1])

			switch key {
			case "container_name":
				currentInfo = ""
				currentContainer.Name = strings.TrimSpace(kv[1])
				for _, line := range containerStatus {
					if strings.Contains(line, currentContainer.Name) {
						if strings.Contains(line, "Up") {
							currentContainer.Status = "running"
						}
					}
				}

			case "image":
				currentInfo = ""
				currentContainer.Image = strings.TrimSpace(kv[1])
			case "ports":
				currentInfo = "ports"
			case "volumes":
				currentInfo = "volumes"
			default:
				currentInfo = ""
			}

		} else if strings.HasPrefix(line, spacing) {

			//log.Println("Container      : " + line)

			if currentContainer.Compose != "" {
				currentContainer.Volumes = containerVolumes
				currentContainer.Ports = containerPorts
				containerVolumes = containerVolumes[:0]
				containerPorts = containerPorts[:0]
				containers = append(containers, currentContainer)
			}
			currentContainer = Container{Compose: key, Status: "stopped"}

			// Get container status
		}
	}

	// Add the latest container
	currentContainer.Volumes = containerVolumes
	currentContainer.Ports = containerPorts
	containers = append(containers, currentContainer)

	projectStatus := "running"
	for _, c := range containers {
		if c.Status != "running" {
			projectStatus = "stopped"
		}
	}

	// Check if project has git
	hasGit := false
	if GITINTEGRATION {
		git := projectPath + "/.git/config"
		if _, err := os.Stat(git); err == nil {
			hasGit = true
		}
	}

	// Create the project
	p := Project{
		Project:    parent + "/" + project,
		Status:     projectStatus,
		Ports:      ports,
		Containers: containers,
		HasGit:     hasGit,
	}
	return p
}

func Run(path, name string, args ...string) string {

	cmd := exec.Command(name, args...)
	cmd.Dir = path
	out, _ := cmd.Output()
	/*if err != nil {
		log.Println(err)
	}*/

	return string(out)
}
