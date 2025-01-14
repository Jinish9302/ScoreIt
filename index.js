// Import Modueles
import express from "express"
import { connectDB } from "./db.js"
import authRoute from "./routes/authentication.route.js"
import contestRoute from "./routes/contest.route.js"
import printLog from "./utils/printLog.js"
import declarePrototypes from "./utils/prototypes.js"

const app = express()
const PORT = process.env.PORT || 3000

// Connect to mongodb
connectDB()
// declare prototypes
declarePrototypes()

app.use(express.json())

app.use("/api/v1/auth", authRoute)
app.use("/api/v1/contest", contestRoute)

app.listen(PORT, () => {
  printLog("INFO", `Example app listening on port ${PORT}`)
})
