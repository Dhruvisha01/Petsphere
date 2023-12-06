import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bodyParser from 'body-parser';
import { MongoClient, ServerApiVersion } from 'mongodb';
import multer from 'multer';
// import fileUpload from 'express-fileupload';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(fileUpload());

const storage = multer.memoryStorage(); // Use memory storage for handling images
const upload = multer({ storage: storage });

const password = encodeURIComponent("MooseSnow@2852");

const uri = `mongodb+srv://dmondhe:${password}@cluster0.i7tisuz.mongodb.net/?retryWrites=true&w=majority`;

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
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.render("index"); // index refers to index.ejs
});

app.get('/petSitters', (req, res) => {
    res.render("petSitters")
})

app.get('/becomeSitter', (req, res) => {
    res.locals.successMessage = ""
    res.locals.errorMessage = ""
    res.render("sitterForm")
})

app.get('/purchaseSitter', (req, res) => {
    res.locals.successMessage = ""
    res.locals.errorMessage = ""
    res.render("purchaseSitter")
})

app.get('/petWalkers', (req, res) => {
    res.render("petWalkers")
})

app.get('/purchaseWalker', (req, res) => {
    res.locals.successMessage = ""
    res.locals.errorMessage = ""
    res.render("purchaseWalker")
})

app.get('/becomeWalker', (req, res) => {
    res.locals.successMessage = ""
    res.locals.errorMessage = ""
    res.render("walkerForm")
})

app.post('/walkerForm', upload.single('image'), async (req, res) => {
    let successMessage = '';
    let errorMessage = '';
    try {
        await client.connect();
        const database = client.db('DFDS');
        const collection = database.collection('walkerSignUp');

        const { name, email, location, days, availability } = req.body;
        const imageFileName = req.file.filename;
        console.log(req.body)
        console.log(req.file)

        let imageDetails = {}
        
        imageDetails["fileName"] = req.file.originalname;
        imageDetails["content"] = req.file.buffer.toString('base64');

        // Insert data into MongoDB
        await collection.insertOne({
            name,
            email,
            location,
            days,
            availability,
            image: imageDetails
        });

        console.log("Yay connected")
        successMessage = "Your information has been recorded. If selected our team will get back to you in 7-8 business days."
        // res.render("walkerForm")

    } catch (error) {
        console.error('Error handling form submission:', error);
        errorMessage = "Sorry there was a problem at our end. Please try again in a bit."
        // res.render("walkerForm")
    } finally {
        await client.close();
    }
    res.locals.successMessage = successMessage;
    res.locals.errorMessage = errorMessage;
    res.render("walkerForm");
})

app.post("/purchasedWalker", upload.array('images', 5), async (req, res) => {
    let successMessage = '';
    let errorMessage = '';
    let petDetails = [];

    const petImages = {};

    try {

        if (req.files && req.files.length > 0) {
            const petFiles = req.files;

            // Handle each pet image field
            for (let i = 0; i < petFiles.length; i++) {
                const file = petFiles[i];

                petImages[`petImage${i + 1}`] = {
                    filename: file.originalname,
                    content: file.buffer.toString('base64'), // Convert image to base64 for demonstration
                };
            }
        }

        await client.connect()
        const database = client.db('DFDS');
        const collection = database.collection('walkerPurchased');
        const formData = req.body;
        console.log(req.body)

        const name = formData.name
        const email = formData.email
        const location = formData.location
        const numPets = formData.numPets;
        const overallInstructions = formData.overallInstructions;
        const date = formData.datefilter
        const availability = formData.availability
        const plan = formData.plan
        const preferredSitter = formData.preferredSitter
        // const imageFileName = req.file.filename;
        const imageFileNames = req.files.map(file => file.originalname);

        if (numPets <= 3) {
            for (let i = 1; i <= numPets; i++) {

                let petsInfo = {};
                const petName = formData[`petsName${i}`];
                const petType = formData[`typeP${i}`];
                const petBreed = formData[`breed${i}`];
                const petAge = formData[`petsAge${i}`];
                const petInstructions = formData[`instructions${i}`];
                const petImage = req.files[`petImage${i}`];
                // const petImage = formData[`image${i}`];

                petsInfo["petName"] = petName;
                petsInfo["petType"] = petType;
                petsInfo["petBreed"] = petBreed;
                petsInfo["petAge"] = petAge;
                petsInfo["petInstructions"] = petInstructions;
                petImage: petImage ? `${Date.now()}-${petImage.originalname}` : null,
                    // petsInfor["petImage"] = petImage

                    petDetails.push(petsInfo)


                if (petImage) {
                    const fileName = `${Date.now()}-${petImage.originalname}`;
                    imageFileNames.push(fileName);

                    // Save the pet image to your desired directory or storage
                    // For example, using fs.writeFile to save to a directory
                    fs.writeFile(`uploads/${fileName}`, petImage.buffer, (err) => {
                        if (err) {
                            console.error('Error saving image:', err);
                        }
                    });
                }
            }
        }

        await collection.insertOne({
            name,
            email,
            location,
            numPets,
            overallInstructions,
            date,
            availability,
            plan,
            preferredSitter,
            petDetails,
            petImages
        });

        console.log("Yay connected")
        successMessage = "Your request has been recorded. We will be in touch shortly."
        // res.render("purchaseSitter")

    } catch (error) {
        console.error('Error handling form submission:', error);
        errorMessage = "Sorry there was a problem at our end. Please try again in a bit."
        // res.render("purchaseSitter")
    } finally {
        await client.close();
    }

    res.locals.successMessage = successMessage;
    res.locals.errorMessage = errorMessage;
    res.render("purchaseWalker");
})

app.post('/sitterForm', upload.single('image'), async (req, res) => {
    let successMessage = '';
    let errorMessage = '';
    try {
        await client.connect();
        const database = client.db('DFDS');
        const collection = database.collection('sitterSignUp');

        const { name, email, location, days, availability } = req.body;
        const imageFileName = req.file.filename;
        console.log(req.body)
        console.log(req.file)

        let imageDetails = {}
        
        imageDetails["fileName"] = req.file.originalname;
        imageDetails["content"] = req.file.buffer.toString('base64');

        // Insert data into MongoDB
        await collection.insertOne({
            name,
            email,
            location,
            days,
            availability,
            image: imageDetails,
        });
        console.log("Yay connected")
        successMessage = "Your information has been recorded. If selected our team will get back to you in 7-8 business days."
        // res.render("sitterForm")
    } catch (error) {
        console.error('Error handling form submission:', error);
        errorMessage = "Sorry there was a problem at our end. Please try again in a bit."
        // res.render("sitterForm")
    } finally {
        await client.close();
    }
    res.locals.successMessage = successMessage;
    res.locals.errorMessage = errorMessage;
    res.render("sitterForm");
})

app.post('/purchasedSitter', upload.array('images', 5), async (req, res) => {

    let successMessage = '';
    let errorMessage = '';
    let petDetails = [];

    const petImages = {};

    try {

        if (req.files && req.files.length > 0) {
            const petFiles = req.files;

            // Handle each pet image field
            for (let i = 0; i < petFiles.length; i++) {
                const file = petFiles[i];

                petImages[`petImage${i + 1}`] = {
                    filename: file.originalname,
                    content: file.buffer.toString('base64'), // Convert image to base64 for demonstration
                };
            }
        }

        await client.connect()
        const database = client.db('DFDS');
        const collection = database.collection('sitterPurchased');
        const formData = req.body;
        console.log(req.body)

        const name = formData.name
        const email = formData.email
        const location = formData.location
        const numPets = formData.numPets;
        const overallInstructions = formData.overallInstructions;
        const date = formData.datefilter
        const availability = formData.availability
        const plan = formData.plan
        const preferredSitter = formData.preferredSitter
        // const imageFileName = req.file.filename;
        const imageFileNames = req.files.map(file => file.originalname);

        for (let i = 1; i <= numPets; i++) {
            let petsInfo = {};
            const petName = formData[`petsName${i}`];
            const petType = formData[`typeP${i}`];
            const petBreed = formData[`breed${i}`];
            const petAge = formData[`petsAge${i}`];
            const petInstructions = formData[`instructions${i}`];
            const petImage = req.files[`petImage${i}`];
            // const petImage = formData[`image${i}`];

            petsInfo["petName"] = petName;
            petsInfo["petType"] = petType;
            petsInfo["petBreed"] = petBreed;
            petsInfo["petAge"] = petAge;
            petsInfo["petInstructions"] = petInstructions;
            petImage: petImage ? `${Date.now()}-${petImage.originalname}` : null,
                // petsInfor["petImage"] = petImage

                petDetails.push(petsInfo)
            // Do something with the pet information, e.g., save to the database

            if (petImage) {
                const fileName = `${Date.now()}-${petImage.originalname}`;
                imageFileNames.push(fileName);

                // Save the pet image to your desired directory or storage
                // For example, using fs.writeFile to save to a directory
                fs.writeFile(`uploads/${fileName}`, petImage.buffer, (err) => {
                    if (err) {
                        console.error('Error saving image:', err);
                    }
                });
            }
        }

        await collection.insertOne({
            name,
            email,
            location,
            numPets,
            overallInstructions,
            date,
            availability,
            plan,
            preferredSitter,
            petDetails,
            petImages
        });

        console.log("Yay connected")
        successMessage = "Your request has been recorded. We will be in touch shortly."
        // res.render("purchaseSitter")

    } catch (error) {
        console.error('Error handling form submission:', error);
        errorMessage = "Sorry there was a problem at our end. Please try again in a bit."
        // res.render("purchaseSitter")
    } finally {
        await client.close();
    }

    res.locals.successMessage = successMessage;
    res.locals.errorMessage = errorMessage;
    res.render("purchaseSitter");
})

app.get("/datepicker", (req, res) => {
    res.render("datepicker")
})


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});