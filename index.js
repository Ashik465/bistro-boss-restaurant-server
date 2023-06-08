const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(express.json());
app.use(cors());


// verify jwt token

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization
  if(!authorization) {
  return   res.status(401).send({error:true ,message: "you are not authenticated"})
  }
  const token = authorization.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if(err) {
      return res.status(403).send({error:true ,message: "you are not authenticated"})
    }
    req.decoded = decoded
    next()
  })
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vgwn8xr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const menuCollection = client.db("bistroDb").collection("menu");
    const usersCollection = client.db("bistroDb").collection("users");

    const reviewCollection = client.db("bistroDb").collection("reviews");
    const cartCollection = client.db("bistroDb").collection("carts");



// create jwt token

app.post('/jwt', (req, res) => {
  const user = req.body 
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
  res.send({token})
})



  // update user make admin

  app.patch("/users/admin/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: {
      role: "admin",
      },
    };
    const result = await usersCollection.updateOne(query, updateDoc);
    res.send(result);
  });




    // get all user data

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // insert user data

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists" });
      } 
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // insert cart data

    app.post("/carts", async (req, res) => {
      const item = req.body;
      // console.log("adding new cart: ", item);
      const result = await cartCollection.insertOne(item);
      res.send(result);
    });

    // get cart data by email

    app.get("/carts", verifyJWT , async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email
      // console.log(email, 'deco', decodedEmail)
      if (email !== decodedEmail) {
        return res.status(403).send({ error: true, message: "Forbidden user" });
      }
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    // delete cart data by id

    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    // get all menu data

    app.get("/menu", async (req, res) => {
      const result = await menuCollection.find().toArray();

      res.send(result);
    });

    //get all review data

    app.get("/reviews", async (req, res) => {
      const result = await reviewCollection.find().toArray();

      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
