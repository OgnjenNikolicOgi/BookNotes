CREATE DATABASE book_notes;

CREATE TABLE book(
	id serial primary key unique,
	author VARCHAR(256) NOT NULL,
	title VARCHAR(256) NOT NULL,
	year INT NOT NULL,
	
);


