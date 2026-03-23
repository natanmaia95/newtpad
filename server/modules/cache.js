import { Collection, Db, ReturnDocument } from 'mongodb'


// const { createClient, RedisClientType } = require('redis');
// const { Collection, Db, ReturnDocument } = require ('mongodb');



class CacheStats {
    misses = 0;
    hits = 0;
}



class NotesCache {
    /**
     * Greets a person.
     * @param {RedisClientType} redisClient - The person's name.
     * @param {Db} mongoDb - The person's name.
     * @returns {string} A greeting message.
     */
    constructor(redisClient, mongoDb) {

        /** @type {typeof(redisClient)} */ 
        this.rc = redisClient
        
        /** @type {Db} */
        this.db = mongoDb

        /** @type {Collection} */
        this.notes = this.db.collection("notes")

        /** @type {Map} */
        this.noteNeedsUpdate = new Map()

        /** @type {CacheStats} */
        this.stats = new CacheStats()

        setInterval(() => this.sendCachedNotesToMongo, 60000)
    }



    async getFileContent(address) {
        let cacheData = await this.rc.get(`note:${address}`)
        if (cacheData) {
            this.stats.hits++
            cacheData = JSON.parse(cacheData)
            return cacheData
        }

        //cache miss
        this.stats.misses++
        let dbData = await this.notes.findOneAndUpdate(
            //filter
            {path: address},
            //default object
            {
                $set: {
                    path: address, 
                    content: "hello world!",
                    lastUpdated: new Date()
                }
            },
            //options
            {upsert: true, returnDocument: ReturnDocument.AFTER}
        )

        await this.rc.set(`note:${address}`, JSON.stringify(dbData), {EX: 7200})
        return dbData
    }



    async updateFileContent(address, changes) {
        let cacheData = await this.rc.get(`note:${address}`)
        if (!cacheData) return
        cacheData = JSON.parse(cacheData)

        cacheData.content = changes.content
        cacheData.lastUpdated = new Date()
        await this.rc.set(`note:${address}`, JSON.stringify(cacheData), {EX: 7200})
        this.noteNeedsUpdate[address] = true
        return
    }


    async sendCachedNotesToMongo() {
        if (this.noteNeedsUpdate.size == 0) return;
        const noteKeys = [...this.noteNeedsUpdate.keys()]
        const noteValues = (await this.rc.mGet(noteKeys)).map(JSON.parse)
        const operations = noteValues.map(newNote => ({
            updateOne: {
                filter: { path: newNote.path },
                update: { $set: { name: newNote } }
            }
        }))

        const result = await this.notes.bulkWrite(operations)
        console.log("Sent cached notes to MongoDB: ", result, result.nModified??null)
        if (result.nModified > 0) { //clear dirty flags
            noteKeys.map((key) => this.noteNeedsUpdate.delete(key), this)
        }
    }

}





async function createCache(rc, mongoDb) {
    return new NotesCache(rc, mongoDb)
}

export { createCache }

// module.exports = {
//     rc, createCache
// }