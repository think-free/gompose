package webserver

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
