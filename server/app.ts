import express from 'express'

export const app = express()

app.use((_request, response, next) => {
  response.setHeader('Access-Control-Allow-Origin', '*')
  next()
})

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'WatchNSync server' })
})
