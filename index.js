const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
// middleware
app.use(cors());
app.use(express.json())
require('dotenv').config()







const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.SECRET_KEY}@cluster0.uwuwq9x.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const jobsCollection = client.db('jobPostDb').collection('jobs')


    // ki vabe search korte hoibo
    const indexKeys = { title: 1, category: 1 }
    const indexOptions = { name: 'titleCategory' }
    const result = await jobsCollection.createIndex(indexKeys, indexOptions);

    app.get('/getJobsByText/:text', async (req, res) => {
      const searchText = req.params.text
      const result = await jobsCollection.find({
        $or: [

          { title: { $regex: searchText, $options: 'i' } },
          { category: { $regex: searchText, $options: 'i' } }

        ]
      }).toArray()
      res.send(result)
    })



    app.post('/postJob', async (req, res) => {
      const newJos = req.body

      newJos.createdAt = new Date()
      // console.log(newJos)


      if (!newJos) {
        return res.status(404).send({ message: 'body data not found' })
      }
      const result = await jobsCollection.insertOne(newJos)
      res.send(result)
    })


    // app.get('/allJobs', async (req, res) => {
    //   const result = await jobsCollection.find({}).toArray()
    //   res.send(result);
    // })



    //  filter kora hoise remote and offline
    app.get('/allJobs/:text', async (req, res) => {

      if (req.params.text == 'remote' || req.params.text == 'offline') {
        const result = await jobsCollection.find({ status: req.params.text }).sort({ createdAt: -1 }).toArray()
        return res.send(result);
      }

      const result = await jobsCollection.find({}).sort({ createdAt: -1 }).toArray()
      res.send(result);
    })

    // email dhara id
    app.get('/myJobs/:email', async (req, res) => {

      console.log(req.params.email)
      const result = await jobsCollection.find({ postedBy: req.params.email }).toArray()
      res.send(result)

    })





    // app get put mane update
    app.put('/updateJob/:id', async (req, res) => {
      const id = req.params.id
      const updateJob = req.body
      console.log(updateJob)
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const updateDoc = {
        $set: {
          title: updateJob.title,
          status: updateJob.status,

        }
      }
      const result = await jobsCollection.updateOne(filter, updateDoc, option)
      res.send(result)
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})