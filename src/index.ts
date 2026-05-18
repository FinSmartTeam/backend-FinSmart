import bodyParser from "body-parser";
import express from "express";
import cors from "cors";

import router from "./routes/api";
import docs from "./docs/route";

async function init() {
  try {
    const app = express();
    const PORT = 3000;

    app.get("/", (req, res) => {
      return res.status(200).json({
        message: "FinSmart API is running",
        data: null,
      });
    });

    app.use(cors());
    app.use(bodyParser.json());

    app.use("/api", router);
    docs(app);

    app.listen(PORT, () => {
      console.log(`Server run at port ${PORT}`);
    });
  } catch (error) {
    console.log("Error : ", error);
  }
}

init();
