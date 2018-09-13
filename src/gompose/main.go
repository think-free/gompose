package main

import (
	"flag"
	"log"
	"os"

	"gompose/webserver"

	"github.com/asdine/storm"
)

func main() {

	/* Getting parameters */
	gitIntegration := flag.Bool("git", true, "Use this flag to activate git integration")
	path := flag.String("path", "/media/docker", "Path to your compose tree")
	flag.Parse()

	log.Println("Starting gompose - Path :", *path, " - Git :", *gitIntegration)

	/* Database */
	db, err := storm.Open("/etc/gompose/gompose.db")
	if err != nil {
		os.Exit(1)
	}

	/* Webserver */
	s := webserver.New(db, *path, *gitIntegration)
	s.Run()
}
