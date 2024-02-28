const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const databasePath = path.join(__dirname, 'covid19India.db')

const app = express()
app.use(express.json())

let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const convertDbobjectToResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    population: dbObject.population,
  }
}

app.get('/states/', async (request, response) => {
  const getQuery = `
    SELECT 
    *
    FROM 
    state;
    `
  const covidIn = await database.all(getQuery)
  response.send(covidIn.map(each => convertDbobjectToResponseObject(each)))
})

app.get('/districts/', async (request, response) => {
  const getDisQuery = `
    SELECT 
    *
    FROM 
    district;
    `
  const disQ = await database.all(getDisQuery)
  response.send(disQ.map(each => convertDbobjectToResponseObject(each)))
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDisQuery = `
    SELECT 
      * 
    FROM 
      district
    WHERE 
      district_id = ${districtId};`
  const disPlayer = await database.get(getDisQuery)
  response.send(convertDbobjectToResponseObject(disPlayer))
})

app.get('/states/:stateId', async (request, response) => {
  const {stateId} = request.params
  const getState = `
  SELECT * 
  FROM 
  state
  WHERE
  state_id=${stateId};
  `
  const covidIn = await database.get(getState)
  response.send(convertDbobjectToResponseObject(covidIn))
})

app.delete('/states/:stateId', async (request, response) => {
  const {stateId} = request.params
  const delQuery = `
  DELETE from state
  WHERE state_id=${stateId};
  `
  await database.run(delQuery)
  response.send('District Removed')
})

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const postQuert = `
  INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
  VALUES("${districtName}",${stateId},${cases},${cured},${active},${deaths});
  `

  await database.run(postQuert)
  response.send('District Successfully Added')
})
module.exports = app
