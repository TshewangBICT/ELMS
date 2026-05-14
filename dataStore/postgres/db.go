package postgres

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

// db details
const (
	postgres_host     = "localhost"
	postgres_port     = "5432"
	postgres_user     = "postgres"
	postgres_password = "postgres"
	postgres_dbname   = "elms_db"
)

// DB variable to store the address of our database
var Db *sql.DB

func init() {
	// create a connection string
	db_info := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", postgres_host, postgres_port, postgres_user, postgres_password, postgres_dbname)
	var err error
	// establish the connection to database server using the driver (lib/pq)
	Db, err = sql.Open("postgres", db_info)

	// Handle error
	if err != nil {
		panic(err)
	} else {
		log.Println("Database successfully established")
	}

}
