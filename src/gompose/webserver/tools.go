package webserver

import (
	"errors"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"regexp"
	"strings"

	"github.com/asdine/storm"
)

func (s *WebServer) getParentAndNameFromRequest(r *http.Request) (string, string, error) {

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

func (s *WebServer) getProjectPath(parent, name string) string {

	projectPath := s.path
	if parent != "none" {
		projectPath = projectPath + "/" + parent
	}
	if name != "none" {
		projectPath = projectPath + "/" + name
	}

	return projectPath
}

func (s *WebServer) getProjects(path string) []Projects {

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

			projects = append(projects, Projects{Name: f.Name(), Logo: "/files" + strings.TrimPrefix(path, s.path) + "/" + f.Name() + "/.logo.png", Parent: parent, State: state})
		}
	}

	return projects
}

func (s *WebServer) getProject(db *storm.DB, parent, project string) Project {

	projectPath := s.path
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
	out := s.run(projectPath, "docker-compose", "ps")
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
				containerVolumes = make([]string, 0) // containerVolumes[:0]
				containerPorts = make([]string, 0)   //containerPorts[:0]
				containers = append(containers, currentContainer)
			}
			currentContainer = Container{Compose: key, Status: "stopped"}
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
	if s.gitIntegration {
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

func (s *WebServer) run(path, name string, args ...string) string {

	cmd := exec.Command(name, args...)
	cmd.Dir = path
	out, _ := cmd.Output()
	// if err != nil {
	// 	log.Println(err)
	// }

	return string(out)
}
