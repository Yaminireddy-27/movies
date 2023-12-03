const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'moviesData.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const convertDataBaseObjectToResponseObject = databaseObject => {
  return {
    movieId: databaseObject.movie_id,
    directorId: databaseObject.director_id,
    movieName: databaseObject.movie_name,
    leadActor: databaseObject.lead_actor,
  }
}

const convertDirectorDBObjectToResponseObject = directorDbObject => {
  return {
    directorId: directorDbObject.director_id,
    directorName: directorDbObject.director_name,
  }
}

app.get('/movies/', async (request, response) => {
  const getMoviesQuery = `
    SELECT
        movie_name
    FROM
        movie;`
  const getMovies = await db.all(getMoviesQuery)
  console.log(getMoviesQuery)
  response.send(getMovies.map(eachMovie => ({movieName: eachMovie.movie_name})))
})

app.post('/movies/', async (request, response) => {
  const {directorId, movieName, leadActor} = request.body
  const createMovieQuery = `
    INSERT INTO movie(director_id, movie_name, lead_actor)
    values(${directorId}, '${movieName}', '${leadActor}');`
  await db.run(createMovieQuery)
  response.send('Movie Successfully Added')
})

app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const getMovieQuery = `
    SELECT
        *
    FROM
        movie
    WHERE
        movie_id=${movieId};`
  const getMovie = await db.get(getMovieQuery)
  response.send(convertDataBaseObjectToResponseObject(getMovie))
})

app.put('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const {directorId, movieName, leadActor} = request.body
  const updateMovieQuery = `
  UPDATE movie
  SET 
    director_id=${directorId},
    movie_name='${movieName}',
    lead_actor='${leadActor}'
  WHERE Movie_id=${movieId};`

  await db.run(updateMovieQuery)
  response.send('Movie Details Updated')
})

app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const deleteMovieQuery = `
  DELETE FROM
        movie
  WHERE movie_id=${movieId}`
  await db.run(deleteMovieQuery)
  response.send('Movie Removed')
})

app.get('/directors/', async (request, response) => {
  const getDirectorsQuery = `
  SELECT * FROM director;`

  const getDirectors = await db.all(getDirectorsQuery)
  response.send(
    getDirectors.map(eachDirector =>
      convertDirectorDBObjectToResponseObject(eachDirector),
    ),
  )
})

app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const getDirectorMoviesQuery = `
  SELECT 
      movie_name
  from director
  natural Join movie
  WHERE movie.director_id=${directorId};`

  const getDirectorMovie = await db.all(getDirectorMoviesQuery)
  response.send(
    getDirectorMovie.map(eachMovie => ({movieName: eachMovie.movie_name})),
  )
})

module.exports = app
