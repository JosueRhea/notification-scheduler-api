/// <reference lib="deno.unstable" />

import { Hono } from "hono"
import { cors } from "hono/cors"

const app = new Hono()

app.use('/*', cors())
app.get('/', (c) => {
  return c.json({ message: 'Hi scheduler :)' })
})

app.post('/new', async (c) => {
  const body = await c.req.json()

  if(body.date == null){
    return c.json({ success: false, message: 'Date is required' })
  }
  if(body.data == null){
    return c.json({ success: false, message: 'Data is required' })
  }

  const keyValue = await Deno.openKv()

  const id = crypto.randomUUID()

  //check if date is valid
  const date = new Date(body.date)
  if(isNaN(date.getTime())){
    return c.json({ success: false, message: 'Invalid date' })
  }

  //check if is an utc date
  if(body.date.slice(-1) != 'Z'){
    return c.json({ success: false, message: 'Date must be in UTC' })
  }

  //check if date is in the past
  if(date.getTime() < Date.now()){
    return c.json({ success: false, message: 'Date is in the past' })
  }


  const result = await keyValue.set([id], {
    date: body.date,
    data: body.data
  })

  if(result.ok){
    return c.json({ success: true, id: id })
  }

  return c.json({ success: false, message: 'Something went wrong' })
})

app.get('/getTimer/:id', async (c) => {
  const id = c.req.param("id")
  const keyValue = await Deno.openKv()

  const result = await keyValue.get([id])

  if(result == null){
    return c.json({ success: false, message: 'Timer not found' })
  }

  return c.json({ success: true, data: result.value })
})

Deno.serve(app.fetch)