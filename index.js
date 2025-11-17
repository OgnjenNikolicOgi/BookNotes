import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";

const app = express();
const port = 3000;
app.set('view engine', 'ejs');

const BASE_API_URL = "https://openlibrary.org";
const SEARCH_API_URL = BASE_API_URL + "/search.json";
const BASE_COVER_URL_WITH_ID = "https://covers.openlibrary.org/b/id/";
const NO_COVER_IMAGE = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSt9I_G5uBOTk82WFPkgmUdfsY1WKQukXNLsg&s";

const db = new pg.Client ({
    user: "postgres",
    host: "localhost",
    database: "book_notes",
    password: "baza1234",
    port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
      console.log("GET /");
    res.render("home.ejs");
});


app.post("/search", async (req, res) => {
      console.log("POST  /search");

    const searchParam = req.body.q;
    const page = parseInt(req.body.page) || 1; 
    try {
        const response = await axios.get( SEARCH_API_URL, { params: {q: searchParam , page: page, limit: 9} });
        const result = response.data; 
        const numberOfResults = result.numFound;
        


        if (numberOfResults === 0) {
            res.status(404).send("Book not found");
        } else {
            const authorTitle = result.docs;
            const resultFinal = [];
            for(let i = 0; i < authorTitle.length; i++){
                let coverImg;
                if(authorTitle[i].cover_i != undefined){
                    coverImg = BASE_COVER_URL_WITH_ID + authorTitle[i].cover_i + "-L.jpg";
                }else{
                    coverImg = NO_COVER_IMAGE;
                }
                let bookElement = {
                    title: authorTitle[i].title,
                    author: authorTitle[i].author_name,
                    year: authorTitle[i].first_publish_year,
                    coverImg: coverImg
                };
                resultFinal.push(bookElement);
            }
            console.log(resultFinal);
            const totalPages = Math.ceil(numberOfResults / 9);
            res.render("home.ejs", {
                books: resultFinal,
                totalPages,
                currentPage: page,
                searchParam
            });
        };
    } catch (error) {
        console.log(error);
        res.status(400).send("Something went wrong.")
    }
});

app.post("/myBooks", async (req, res) => {
  const { title, author, year } = req.body;
  try {
    await db.query(
      "INSERT INTO book (author, title, year) VALUES ($1, $2, $3)",
      [author, title, year]
    );
    console.log(req.body);
    res.redirect("/myBooks");
  } catch (error) {
    console.log(error);
    res.status(400).send("Something went wrong");
  }
});

app.get("/myBooks", async (req, res) => {
    console.log("GET /myBooks endpoint");
    try {
        const result = await db.query("SELECT * FROM book");
        res.render("myBooks.ejs", {books: result.rows});
    } catch (error) {
        console.log(error);
        res.status(400).send("Something went wrong");
    }
});



app.listen (port, () => {
    console.log(`Server is running on port ${port}`);
});