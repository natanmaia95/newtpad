import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import { MongoClient } from 'mongodb'
import { createClient } from 'redis'

import { createCache } from './modules/cache.js'

// const express = require('express')
// const http = require('http')
// const { Server } = require('socket.io')
// const { MongoClient } = require('mongodb')

// const { createCache } = require('./modules/cache.js')



const uri = process.env.MONGO_URL
// const uri = 'mongodb://admin:pass@localhost:27017/test'


const mongoClient = new MongoClient(uri, {
  connectTimeoutMS: 5000,
  serverSelectionTimeoutMS: 5000,
});

async function initMongoConnection() {
  try {
    console.log("--- Attempting to connect to MongoDB ---");
    await mongoClient.connect();
    
    // Send a ping to confirm a successful connection
    await mongoClient.db("admin").command({ ping: 1 });
    console.log("✅ Success! Authentication verified.");
    
  } catch (error) {
    console.error("❌ Connection Failed!");
    console.error(`Error Name: ${error.name}`);
    console.error(`Error Message: ${error.message}`);
    
    if (error.message.includes("Authentication failed")) {
      console.log("\n💡 Hint: Check your username, password, or authSource.");
    } else if (error.name === "MongoNetworkError") {
      console.log("\n💡 Hint: This is a network issue. Check if MongoDB is listening on 10.89.1.14.");
    }
  }
}

await initMongoConnection()
await mongoClient.db("test").command({ ping: 1 });
const db = mongoClient.db("test");
const notes = db.collection("notes");

let rc = await createClient({ url: process.env.REDIS_URL })
await rc.connect()
rc.on('error', (err) => console.log('Redis Client Error', err))
let notesCache = await createCache(rc, db)

const app = express()
const server = http.createServer(app)
const io = new Server(server, {"cors": {"origin":"*"}})






class FileStore {
  constructor() {
    this._data = {};
  }

  async getFileContent(address) {
    let stored = this._data[address];
    console.log("stored: ", stored)
    if (!stored) {
      let result = await notes.findOne({path: address})
      if (!result) {
        let newDoc = {
          path: address,
          content: "TEST",
          lastUpdated: new Date()
        }
        await notes.insertOne(newDoc)
        stored = newDoc
      } else {
        stored = result
      }
      console.log("inserting new data into address: ", address)
      this._data[address] = stored
      console.log("after save", stored)
      this.log()
    }

    return {
      text: stored.content ?? ""
    }
  }

  async setFileContent(address, newContent) {
    if (!this._data[address]) {
      console.log(`no data cached for '${address}', querying...`)
      await this.getFileContent(address);
    }
    this.log()
    let cachedEntry = this._data[address]
    console.log("cached entry?: ", cachedEntry)
    cachedEntry.content = newContent.text
    console.log("a", cachedEntry)
    //cancel old update
    if (cachedEntry.timeout) {
      clearTimeout(cachedEntry.timeout)
      delete cachedEntry.timeout
      console.log("b")
    }
    cachedEntry.timeout = setTimeout(() => {
      this.updateFileContent(address, newContent);
    }, 1000) //5 seconds
  }

  async updateFileContent(address, newContent) {
    let text = newContent.text
    console.log(`pushing update for '${address}' to mongo`)
    let result = await notes.findOneAndUpdate({path:address}, {$set: { content:text }})
  }

  log() {
    console.log("temp data:",this._data)
  }
}



let tempStore = new FileStore();






io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('join-room', async (roomId) => {
    console.log(`User joined room: ${roomId}`)
    socket.join(roomId)
    // let baseContents = {};
    // let baseContent = await tempStore.getFileContent(roomId); 
    let baseContent = await notesCache.getFileContent(roomId);
    let respContent = { type: "full", ...baseContent }
    console.log("contents on join: ", baseContent, respContent)
    socket.emit('receive-update', respContent)
  })

  socket.on('text-update', async ({roomId, changes}) => {
    console.log((roomId, changes))
    socket.broadcast.to(roomId).emit('receive-update', changes)
    await notesCache.updateFileContent(roomId, changes)
    // await tempStore.setFileContent(roomId, content)
    // tempStore.log()
  })

  socket.on('disconnect', () => console.log('User disconnected'))
})



server.listen(3001, () => {
  console.log('Express intro running on localhost:3001');
})