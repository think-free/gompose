![Gompose Logo](/assets/gompose-full.png =885x300)

Gompose is a docker-compose manager written in Go and next.js

Running :
---------------------

The easiest way to run Gompose is to use docker-compose. Create the /media/docker/gompose folder and create a docker-compose.yml :

    version: "3"
    services:
        gompose:
            container_name: gompose
            image: thinkfree84/gompose
            restart: always
            ports:
                - "0.0.0.0:80:8123" # @gompose:[-][WebUI][]
            volumes:
                - /media/docker/:/media/docker/
                - /var/run/docker.sock:/var/run/docker.sock
                - /media/docker/gompose:/etc/gompose
            command: -git


Building :
---------------------

* Docker Image :

docker build --rm -t thinkfree84/gompose .

* Without docker :

- Copy the 3 scripts from the scripts folder to the root of this repository
- Go, node.js, npm must be installed and working on your system
- For the run time you need docker-compose and docker working
- Run the build.sh script, you'll get the gompose binary.
- Run it

Parameters :
---------------------

- -git : Use the git integration
- -path : Specify an other path for your docker-compose files

Usage :
---------------------

Create projects folders in /media/docker, they will appear in the gompose interface :

    /media/docker/projects1/docker-compose.yml
    /media/docker/projects2/subproject1/docker-compose.yml
    /media/docker/projects2/subproject2/docker-compose.yml
    /media/docker/projects3/docker-compose.yml

For git integration, if the folder contains a .git you will have the option to update it from the interface
