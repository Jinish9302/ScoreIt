// Import Modueles
import express from "express"
import connectDB from "./db.js"
import printLog from "./utils/printLog.js"
import authRoute from "./routes/authentication.route.js"

const app = express()
const PORT = process.env.PORT || 3000

// Connect to mongodb
connectDB()

app.use(express.json())

app.use("/auth", authRoute)

app.listen(PORT, () => {
  printLog("INFO", `Example app listening on port ${PORT}`)
})
